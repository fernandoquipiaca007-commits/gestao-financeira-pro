// Edge Function: send-email
// Dispara e-mails via API do Resend de forma segura no servidor,
// eliminando bloqueios de CORS no navegador e mantendo a compatibilidade
// com a chave Resend guardada nas Definições da empresa.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { apiKey, from, to, subject, html, text, replyTo, attachments } = body;

    // A chave pode vir da requisição (chave customizada do tenant) ou do ambiente da Edge Function
    const resendApiKey = apiKey?.trim() || Deno.env.get('RESEND_API_KEY') || '';

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Chave da API do Resend não informada e não encontrada no ambiente.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    const validRecipients = recipients.filter(
      (email: string) => email && typeof email === 'string' && email.includes('@') && email.trim().length > 3
    );

    if (validRecipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum destinatário de e-mail válido foi fornecido.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subject || !html) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Assunto (subject) e conteúdo HTML (html) são obrigatórios.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remetente padrão do Resend para contas sem domínio verificado é onboarding@resend.dev
    let fromAddress = from?.trim() || 'CodeEngine <onboarding@resend.dev>';
    
    // Se o remetente tentar usar notificacoes@resend.dev (que não é permitido pelo Resend), corrigimos para onboarding@resend.dev
    if (fromAddress.includes('notificacoes@resend.dev')) {
      fromAddress = fromAddress.replace('notificacoes@resend.dev', 'onboarding@resend.dev');
    }

    const payload: Record<string, any> = {
      from: fromAddress,
      to: validRecipients,
      subject: subject.trim(),
      html: html,
    };

    if (text) {
      payload.text = text;
    }

    if (replyTo && replyTo.trim()) {
      payload.reply_to = replyTo.trim();
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: att.content?.startsWith('data:')
          ? att.content.split(',')[1]
          : att.content,
      }));
    }

    console.log(`[send-email] Enviando e-mail para ${validRecipients.join(', ')} via Resend...`);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      const errorMsg = resendData?.message || resendData?.error || `HTTP ${resendResponse.status}`;
      console.error('[send-email] Resend API error:', errorMsg, resendData);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro retornado pelo Resend: ${errorMsg}`,
          details: resendData,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-email] E-mail enviado com sucesso. ID:', resendData.id);

    return new Response(
      JSON.stringify({
        success: true,
        id: resendData.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[send-email] Internal error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Erro interno ao processar envio de e-mail.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
