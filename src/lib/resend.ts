import { SendEmailOptions, SendEmailResult, ResendEmailSettings } from '../types/email';
import { getStoredSettings } from './storage';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';


const SEND_EMAIL_ENDPOINT = `${SUPABASE_URL}/functions/v1/send-email`;

/**
 * Send email via Resend API using Supabase Edge Function to avoid browser CORS restrictions.
 */
export async function sendResendEmail(
  options: SendEmailOptions,
  customEmailSettings?: ResendEmailSettings,
  isTest: boolean = false
): Promise<SendEmailResult> {
  try {
    const settings = customEmailSettings || getStoredSettings().emailSettings;
    const apiKey =
      customEmailSettings?.apiKey ||
      settings?.apiKey ||
      (import.meta as any).env?.VITE_RESEND_API_KEY ||
      '';

    const cleanApiKey = apiKey.trim().replace(/\s+/g, '');

    if (!cleanApiKey) {
      console.warn('[Resend] API Key not configured. Skipping email send to:', options.to);
      return {
        success: false,
        error: 'Chave de API do Resend não configurada. Por favor, insira a sua API Key nas Configurações.',
      };
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const validRecipients = recipients.filter(
      (email) => email && typeof email === 'string' && email.includes('@') && email.trim().length > 3
    );

    if (validRecipients.length === 0) {
      return {
        success: false,
        error: 'Endereço de e-mail do destinatário inválido ou não fornecido.',
      };
    }

    // Remetente padrão: usar onboarding@resend.dev para evitar bloqueio por domínio não verificado
    let fromAddress = options.fromEmail || settings?.fromEmail || 'CodeEngine <onboarding@resend.dev>';
    if (fromAddress.includes('notificacoes@resend.dev')) {
      fromAddress = fromAddress.replace('notificacoes@resend.dev', 'onboarding@resend.dev');
    }

    const replyToAddress = options.replyTo || settings?.replyTo || undefined;

    // Disparar através da Edge Function do Supabase (livre de bloqueios CORS)
    // A função só aceita pedidos de quem tem sessão iniciada (não é um relay aberto).
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(SEND_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        apiKey: cleanApiKey,
        from: fromAddress,
        to: validRecipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: replyToAddress,
        attachments: options.attachments,
      }),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok || !responseData?.success) {
      const errorMsg =
        responseData?.error ||
        responseData?.message ||
        `Falha na comunicação com servidor de e-mail (HTTP ${response.status})`;
      console.error('[Resend] Falha ao enviar e-mail:', errorMsg, responseData);
      return {
        success: false,
        error: errorMsg,
      };
    }

    console.info('[Resend] E-mail enviado com sucesso! ID:', responseData.id, 'para:', validRecipients);
    return {
      success: true,
      id: responseData.id,
    };
  } catch (err: any) {
    const msg = err?.message || 'Falha de conexão com a API de envio de e-mails.';
    console.error('[Resend] Exceção ao enviar e-mail:', err);
    return {
      success: false,
      error: msg,
    };
  }
}
