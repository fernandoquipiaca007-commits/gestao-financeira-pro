import { SendEmailOptions, SendEmailResult, ResendEmailSettings } from '../types/email';
import { getStoredSettings } from './storage';

/**
 * Send email via Resend API
 */
export async function sendResendEmail(
  options: SendEmailOptions,
  customEmailSettings?: ResendEmailSettings
): Promise<SendEmailResult> {
  try {
    const settings = customEmailSettings || getStoredSettings().emailSettings;
    const apiKey = settings?.apiKey || (import.meta as any).env?.VITE_RESEND_API_KEY || '';

    if (!apiKey) {
      console.warn('[Resend] API Key not configured. Skipping email send to:', options.to);
      return {
        success: false,
        error: 'Chave de API do Resend não configurada. Configure a API Key nas Configurações do Sistema.',
      };
    }

    if (settings && !settings.enabled) {
      console.info('[Resend] Email notifications disabled globally in settings.');
      return {
        success: false,
        error: 'Envio de e-mails desativado nas Configurações.',
      };
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const validRecipients = recipients.filter(
      (email) => email && email.includes('@') && email.trim().length > 3
    );

    if (validRecipients.length === 0) {
      return {
        success: false,
        error: 'Endereço de e-mail do destinatário inválido ou não fornecido.',
      };
    }

    const fromAddress = options.fromEmail || settings?.fromEmail || 'GestãoFO <notificacoes@resend.dev>';
    const replyToAddress = options.replyTo || settings?.replyTo || undefined;

    // Build payload according to Resend API spec
    const payload: Record<string, any> = {
      from: fromAddress,
      to: validRecipients,
      subject: options.subject,
      html: options.html,
    };

    if (options.text) {
      payload.text = options.text;
    }

    if (replyToAddress) {
      payload.reply_to = replyToAddress;
    }

    if (options.attachments && options.attachments.length > 0) {
      payload.attachments = options.attachments.map((att) => ({
        filename: att.filename,
        content: att.content.startsWith('data:')
          ? att.content.split(',')[1] // Extract base64 part if data URL
          : att.content,
      }));
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData?.message || responseData?.error || `HTTP ${response.status}`;
      console.error('[Resend] Failed to send email:', errorMsg, responseData);
      return {
        success: false,
        error: `Erro ao enviar e-mail via Resend: ${errorMsg}`,
      };
    }

    console.info('[Resend] Email sent successfully:', responseData.id, 'to:', validRecipients);
    return {
      success: true,
      id: responseData.id,
    };
  } catch (err: any) {
    const msg = err?.message || 'Falha de conexão com a API do Resend.';
    console.error('[Resend] Exception sending email:', err);
    return {
      success: false,
      error: msg,
    };
  }
}
