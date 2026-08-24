import { LeadSubmission, COUNTRIES } from '../types';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';

export async function sendLeadNotificationEmail(lead: LeadSubmission): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const country = COUNTRIES[lead.country] || COUNTRIES.AO;
    const cleanPhone = lead.whatsapp.replace(/\D/g, '');
    const waLink = `https://wa.me/${cleanPhone}`;
    const comboServices = [lead.service, ...lead.additionalServices].filter(Boolean).join(', ');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f3f2; margin: 0; padding: 24px; color: #1c1b1b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid rgba(196,199,199,0.3); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .header { background: #000000; color: #ffffff; padding: 24px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #a1a1aa; }
    .body { padding: 30px; }
    .badge { display: inline-block; background: #dbe1ff; color: #003da9; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table tr { border-bottom: 1px solid #f1edec; }
    .table td { padding: 12px 6px; font-size: 13px; vertical-align: top; }
    .table td.label { font-weight: 600; color: #747878; width: 35%; }
    .table td.value { font-weight: 500; color: #1c1b1b; }
    .notes-box { background: #f7f3f2; border-radius: 12px; padding: 14px; margin-top: 20px; font-size: 13px; color: #1c1b1b; line-height: 1.5; }
    .btn-container { text-align: center; margin-top: 28px; }
    .btn { display: inline-block; background: #0050d7; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,80,215,0.25); }
    .footer { text-align: center; font-size: 11px; color: #747878; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1edec; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚀 Novo Lead Captado na Landing Page</h1>
      <p>Codeengine &bull; Notificação Instantânea de Oportunidade</p>
    </div>
    <div class="body">
      <div style="text-align: center;">
        <span class="badge">NOVO CONTATO RECEBIDO</span>
      </div>

      <table class="table">
        <tr>
          <td class="label">👤 Nome do Cliente:</td>
          <td class="value"><strong>${lead.name}</strong></td>
        </tr>
        <tr>
          <td class="label">🏢 Empresa:</td>
          <td class="value">${lead.company || 'Pessoa Física / Não informado'}</td>
        </tr>
        <tr>
          <td class="label">📱 WhatsApp:</td>
          <td class="value"><a href="${waLink}" style="color: #0050d7; text-decoration: none; font-weight: 600;">${lead.whatsapp}</a></td>
        </tr>
        <tr>
          <td class="label">✉️ E-mail:</td>
          <td class="value">${lead.email || 'Não informado'}</td>
        </tr>
        <tr>
          <td class="label">🌍 País &amp; Moeda:</td>
          <td class="value">${country.flag} ${country.name} (${country.defaultCurrency})</td>
        </tr>
        <tr>
          <td class="label">🎯 Serviço Solicitado:</td>
          <td class="value"><strong>${lead.service}</strong></td>
        </tr>
        ${lead.additionalServices.length > 0 ? `
        <tr>
          <td class="label">📦 Serviços Combinados:</td>
          <td class="value">${lead.additionalServices.join(', ')}</td>
        </tr>` : ''}
        ${lead.budgetRange ? `
        <tr>
          <td class="label">💰 Faixa de Orçamento:</td>
          <td class="value">${lead.budgetRange}</td>
        </tr>` : ''}
      </table>

      ${lead.notes ? `
      <div class="notes-box">
        <strong>📝 Mensagem do Cliente:</strong><br>
        ${lead.notes.replace(/\n/g, '<br>')}
      </div>` : ''}

      <div class="btn-container">
        <a href="${waLink}" class="btn" target="_blank">Abrir Conversa no WhatsApp &rarr;</a>
      </div>

      <div class="footer">
        Este lead foi cadastrado automaticamente no sistema de gestão Codeengine.<br>
        Data de recebimento: ${new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Send to both addresses
    const recipients = ['codeengine2@gmail.com', 'fernandoquipiaca007@gmail.com'];

    // Try sending to all recipients
    let res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Codeengine Leads <onboarding@resend.dev>',
        to: recipients,
        subject: `🚀 Novo Lead: ${lead.name} (${comboServices}) - Codeengine`,
        html: htmlContent,
      }),
    });

    // If sandbox restriction occurs, fallback to verified account owner email
    if (!res.ok) {
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Codeengine Leads <onboarding@resend.dev>',
          to: ['fernandoquipiaca007@gmail.com'],
          subject: `🚀 Novo Lead: ${lead.name} (${comboServices}) - Codeengine`,
          html: htmlContent,
        }),
      });
    }

    const data = await res.json();
    if (res.ok) {
      console.log('[Email Notification] Sent successfully:', data.id);
      return { success: true, id: data.id };
    } else {
      console.warn('[Email Notification] Resend warning:', data);
      return { success: false, error: data?.message };
    }
  } catch (err: any) {
    console.warn('[Email Notification] Exception:', err);
    return { success: false, error: err?.message };
  }
}
