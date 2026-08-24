import { SendEmailOptions, SendEmailResult, EmailAttachment } from '../types/email';
import { sendResendEmail } from './resend';
import { getStoredSettings } from './storage';
import { formatCurrency, formatDate } from './formatters';
import { CurrencyCode } from '../types';

/**
 * Base HTML email template layout
 */
function wrapEmailHtml(contentHtml: string, title: string, businessName: string = 'GestãoFO Studio'): string {
  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f3f2; margin: 0; padding: 24px; color: #1c1b1b; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #c4c7c7; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .header { background-color: #000000; color: #ffffff; padding: 28px 32px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; font-weight: 500; }
    .content { padding: 32px; font-size: 14px; line-height: 1.6; color: #1c1b1b; }
    .card { background-color: #f7f3f2; border: 1px solid #e5e2e1; border-radius: 14px; padding: 18px 22px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .card-row:last-child { margin-bottom: 0; }
    .label { color: #747878; font-weight: 500; }
    .value { font-weight: 700; color: #1c1b1b; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-blue { background-color: #dbe1ff; color: #003da9; }
    .badge-green { background-color: #d4eddf; color: #1a6b3a; }
    .badge-amber { background-color: #fff3d6; color: #7a5400; }
    .btn { display: inline-block; background-color: #000000; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 26px; border-radius: 28px; font-size: 13px; margin-top: 16px; }
    .footer { padding: 20px 32px; background-color: #f1edec; border-top: 1px solid #e5e2e1; text-align: center; font-size: 11px; color: #747878; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${businessName}</h1>
      <p>Notificação de Gestão Operacional & Financeira</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin:0;">Mensagem enviada automaticamente pelo sistema ${businessName}.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ----------------------------------------------------------------------
// Email Trigger Functions
// ----------------------------------------------------------------------

/**
 * 1. Enviar Lembrete / Cobrança por E-mail ao Cliente
 */
export async function sendClientPaymentReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  dueDate: string;
  notes?: string;
  attachments?: EmailAttachment[];
}): Promise<SendEmailResult> {
  const settings = getStoredSettings();
  const toggles = settings.emailSettings?.toggles;

  if (settings.emailSettings?.enabled && toggles && !toggles.clientPaymentReminder) {
    return { success: false, error: 'Notificação de cobrança desativada nas configurações.' };
  }

  const formattedAmount = formatCurrency(params.amount, params.currency);
  const formattedDate = formatDate(params.dueDate);

  const html = wrapEmailHtml(`
    <h2 style="font-size: 18px; margin-top: 0; color: #1c1b1b;">Aviso de Pagamento Pendente</h2>
    <p>Olá, <strong>${params.clientName}</strong>,</p>
    <p>Esperamos que este e-mail o encontre bem. Passamos para lembrar sobre o pagamento pendente referente aos serviços prestados:</p>

    <div class="card">
      <div class="card-row">
        <span class="label">Descrição do Serviço:</span>
        <span class="value">${params.description}</span>
      </div>
      <div class="card-row">
        <span class="label">Valor Total:</span>
        <span class="value" style="color: #1a6b3a; font-size: 16px;">${formattedAmount}</span>
      </div>
      <div class="card-row">
        <span class="label">Data de Vencimento:</span>
        <span class="value">${formattedDate}</span>
      </div>
    </div>

    ${params.notes ? `<p style="font-style: italic; color: #747878; font-size: 12px; background: #f7f3f2; padding: 10px; border-radius: 8px;">"${params.notes}"</p>` : ''}

    <p>Qualquer dúvida ou caso necessite dos dados de pagamento novamente, por favor responda a este e-mail.</p>
    <p>Atenciosamente,<br><strong>${settings.businessName || 'Equipa GestãoFO'}</strong></p>
  `, 'Aviso de Pagamento Pendente', settings.businessName);

  return sendResendEmail({
    to: params.clientEmail,
    subject: `Lembrete de Pagamento: ${params.description} (${formattedAmount})`,
    html,
    attachments: params.attachments,
  });
}

/**
 * 2. Enviar Comprovativo / Recibo ao Cliente
 */
export async function sendClientReceiptEmail(params: {
  clientEmail: string;
  clientName: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethod?: string;
  receivedDate: string;
  attachments?: EmailAttachment[];
}): Promise<SendEmailResult> {
  const settings = getStoredSettings();
  const toggles = settings.emailSettings?.toggles;

  if (settings.emailSettings?.enabled && toggles && !toggles.clientReceipt) {
    return { success: false, error: 'Envio de recibos desativado nas configurações.' };
  }

  const formattedAmount = formatCurrency(params.amount, params.currency);
  const formattedDate = formatDate(params.receivedDate);

  const html = wrapEmailHtml(`
    <h2 style="font-size: 18px; margin-top: 0; color: #1a6b3a;">Confirmado! Pagamento Recebido com Sucesso</h2>
    <p>Olá, <strong>${params.clientName}</strong>,</p>
    <p>Confirmamos o recebimento do pagamento com sucesso. Agradecemos a confiança!</p>

    <div class="card" style="border-left: 4px solid #1a6b3a;">
      <div class="card-row">
        <span class="label">Serviço / Referência:</span>
        <span class="value">${params.description}</span>
      </div>
      <div class="card-row">
        <span class="label">Valor Pago:</span>
        <span class="value" style="color: #1a6b3a; font-size: 16px;">${formattedAmount}</span>
      </div>
      <div class="card-row">
        <span class="label">Método de Pagamento:</span>
        <span class="value">${params.paymentMethod || 'Transferência / PIX'}</span>
      </div>
      <div class="card-row">
        <span class="label">Data da Liquidação:</span>
        <span class="value">${formattedDate}</span>
      </div>
    </div>

    <p>O comprovativo foi emitido. Se desejar guardar uma cópia ou tiver dúvidas, conte conosco.</p>
    <p>Atenciosamente,<br><strong>${settings.businessName || 'Equipa GestãoFO'}</strong></p>
  `, 'Comprovativo de Pagamento', settings.businessName);

  return sendResendEmail({
    to: params.clientEmail,
    subject: `Comprovativo de Pagamento Recebido: ${params.description}`,
    html,
    attachments: params.attachments,
  });
}

/**
 * 3. Enviar Credenciais de Acesso a Novo Colaborador
 */
export async function sendEmployeeWelcomeEmail(params: {
  employeeEmail: string;
  employeeName: string;
  roleName: string;
  temporaryPassword?: string;
}): Promise<SendEmailResult> {
  const settings = getStoredSettings();
  const toggles = settings.emailSettings?.toggles;

  if (settings.emailSettings?.enabled && toggles && !toggles.employeeWelcome) {
    return { success: false, error: 'Envio de credenciais para novos utilizadores desativado.' };
  }

  const html = wrapEmailHtml(`
    <h2 style="font-size: 18px; margin-top: 0; color: #1c1b1b;">Bem-vindo à plataforma ${settings.businessName}!</h2>
    <p>Olá, <strong>${params.employeeName}</strong>,</p>
    <p>A tua conta de acesso ao sistema foi criada com sucesso. Abaixo estão os teus dados de acesso:</p>

    <div class="card">
      <div class="card-row">
        <span class="label">Função / Cargo:</span>
        <span class="value"><span class="badge badge-blue">${params.roleName}</span></span>
      </div>
      <div class="card-row">
        <span class="label">E-mail de Login:</span>
        <span class="value">${params.employeeEmail}</span>
      </div>
      ${params.temporaryPassword ? `
      <div class="card-row">
        <span class="label">Senha Provisória:</span>
        <span class="value" style="font-family: monospace; font-size: 15px; color: #0050d7;">${params.temporaryPassword}</span>
      </div>
      ` : ''}
    </div>

    <p>Recomendamos que faças login e alteres a tua senha provisória no primeiro acesso em Configurações.</p>
    <a href="${window.location.origin}" class="btn" target="_blank">Aceder à Plataforma &rarr;</a>
  `, 'Bem-vindo ao Sistema', settings.businessName);

  return sendResendEmail({
    to: params.employeeEmail,
    subject: `Acesso ao Sistema ${settings.businessName} - As tuas credenciais`,
    html,
  });
}

/**
 * 4. Enviar Notificação de Projeto Atribuído a Colaborador
 */
export async function sendEmployeeProjectAssignedEmail(params: {
  employeeEmail: string;
  employeeName: string;
  projectName: string;
  clientName?: string;
  dueDate?: string;
}): Promise<SendEmailResult> {
  const settings = getStoredSettings();
  const toggles = settings.emailSettings?.toggles;

  if (settings.emailSettings?.enabled && toggles && !toggles.employeeProjectAssigned) {
    return { success: false, error: 'Notificação de atribuição de projetos desativada.' };
  }

  const html = wrapEmailHtml(`
    <h2 style="font-size: 18px; margin-top: 0; color: #0050d7;">Novo Projeto Atribuído a Ti 📂</h2>
    <p>Olá, <strong>${params.employeeName}</strong>,</p>
    <p>Foste definido como responsável do seguinte projeto operacional:</p>

    <div class="card">
      <div class="card-row">
        <span class="label">Projeto:</span>
        <span class="value">${params.projectName}</span>
      </div>
      ${params.clientName ? `
      <div class="card-row">
        <span class="label">Cliente:</span>
        <span class="value">${params.clientName}</span>
      </div>
      ` : ''}
      ${params.dueDate ? `
      <div class="card-row">
        <span class="label">Prazo de Entrega:</span>
        <span class="value">${formatDate(params.dueDate)}</span>
      </div>
      ` : ''}
    </div>

    <a href="${window.location.origin}" class="btn" target="_blank">Ver Projeto na Plataforma &rarr;</a>
  `, 'Novo Projeto Atribuído', settings.businessName);

  return sendResendEmail({
    to: params.employeeEmail,
    subject: `Novo Projeto Atribuído: ${params.projectName}`,
    html,
  });
}

/**
 * 5. Enviar Notificação de Tarefa Atribuída a Colaborador
 */
export async function sendEmployeeTaskAssignedEmail(params: {
  employeeEmail: string;
  employeeName: string;
  taskTitle: string;
  projectName?: string;
  dueDate?: string;
  priority?: string;
}): Promise<SendEmailResult> {
  const settings = getStoredSettings();
  const toggles = settings.emailSettings?.toggles;

  if (settings.emailSettings?.enabled && toggles && !toggles.employeeTaskAssigned) {
    return { success: false, error: 'Notificação de tarefas desativada.' };
  }

  const html = wrapEmailHtml(`
    <h2 style="font-size: 18px; margin-top: 0; color: #0050d7;">Nova Tarefa Atribuída ✅</h2>
    <p>Olá, <strong>${params.employeeName}</strong>,</p>
    <p>Uma nova tarefa foi atribuída à tua fila de trabalho:</p>

    <div class="card">
      <div class="card-row">
        <span class="label">Tarefa:</span>
        <span class="value">${params.taskTitle}</span>
      </div>
      ${params.projectName ? `
      <div class="card-row">
        <span class="label">Projeto Relacionado:</span>
        <span class="value">${params.projectName}</span>
      </div>
      ` : ''}
      ${params.dueDate ? `
      <div class="card-row">
        <span class="label">Data Limite:</span>
        <span class="value">${formatDate(params.dueDate)}</span>
      </div>
      ` : ''}
      ${params.priority ? `
      <div class="card-row">
        <span class="label">Prioridade:</span>
        <span class="value"><span class="badge badge-amber">${params.priority}</span></span>
      </div>
      ` : ''}
    </div>

    <a href="${window.location.origin}" class="btn" target="_blank">Aceder às Minhas Tarefas &rarr;</a>
  `, 'Nova Tarefa Atribuída', settings.businessName);

  return sendResendEmail({
    to: params.employeeEmail,
    subject: `Nova Tarefa: ${params.taskTitle}`,
    html,
  });
}

/**
 * 6. Enviar Alerta ao Admin sobre Solicitação de Faturamento
 */
export async function sendAdminBillingRequestEmail(params: {
  adminEmail: string;
  employeeName: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  projectName?: string;
}): Promise<SendEmailResult> {
  const settings = getStoredSettings();
  const toggles = settings.emailSettings?.toggles;

  if (settings.emailSettings?.enabled && toggles && !toggles.adminBillingRequestAlert) {
    return { success: false, error: 'Alerta ao Admin de faturamento desativado.' };
  }

  const formattedAmount = formatCurrency(params.amount, params.currency);

  const html = wrapEmailHtml(`
    <h2 style="font-size: 18px; margin-top: 0; color: #7a5400;">Nova Solicitação de Faturamento Pendente 📄</h2>
    <p>Olá, Administrador,</p>
    <p>O colaborador <strong>${params.employeeName}</strong> submeteu um pedido de faturamento para revisão:</p>

    <div class="card" style="border-left: 4px solid #7a5400;">
      <div class="card-row">
        <span class="label">Solicitante:</span>
        <span class="value">${params.employeeName}</span>
      </div>
      <div class="card-row">
        <span class="label">Descrição:</span>
        <span class="value">${params.description}</span>
      </div>
      ${params.projectName ? `
      <div class="card-row">
        <span class="label">Projeto:</span>
        <span class="value">${params.projectName}</span>
      </div>
      ` : ''}
      <div class="card-row">
        <span class="label">Valor a Faturar:</span>
        <span class="value" style="color: #0050d7; font-size: 16px;">${formattedAmount}</span>
      </div>
    </div>

    <a href="${window.location.origin}" class="btn" target="_blank">Revisar Solicitação na Plataforma &rarr;</a>
  `, 'Solicitação de Faturamento', settings.businessName);

  return sendResendEmail({
    to: params.adminEmail,
    subject: `Solicitação de Faturamento: ${params.employeeName} (${formattedAmount})`,
    html,
  });
}

/**
 * 7. Enviar Alerta ao Colaborador sobre Status do Pedido de Faturamento (Aprovado/Rejeitado)
 */
export async function sendEmployeeBillingStatusEmail(params: {
  employeeEmail: string;
  employeeName: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  status: 'Aprovada' | 'Rejeitada';
  notes?: string;
}): Promise<SendEmailResult> {
  const settings = getStoredSettings();
  const toggles = settings.emailSettings?.toggles;

  if (settings.emailSettings?.enabled && toggles && !toggles.employeeBillingStatusAlert) {
    return { success: false, error: 'Notificação de status de faturamento desativada.' };
  }

  const isApproved = params.status === 'Aprovada';
  const formattedAmount = formatCurrency(params.amount, params.currency);

  const html = wrapEmailHtml(`
    <h2 style="font-size: 18px; margin-top: 0; color: ${isApproved ? '#1a6b3a' : '#ba1a1a'};">
      Pedido de Faturamento ${isApproved ? 'Aprovado! ✅' : 'Rejeitado ❌'}
    </h2>
    <p>Olá, <strong>${params.employeeName}</strong>,</p>
    <p>O teu pedido de faturamento foi revisado pelo Administrador:</p>

    <div class="card" style="border-left: 4px solid ${isApproved ? '#1a6b3a' : '#ba1a1a'};">
      <div class="card-row">
        <span class="label">Descrição:</span>
        <span class="value">${params.description}</span>
      </div>
      <div class="card-row">
        <span class="label">Valor:</span>
        <span class="value">${formattedAmount}</span>
      </div>
      <div class="card-row">
        <span class="label">Resultado:</span>
        <span class="value"><span class="badge ${isApproved ? 'badge-green' : 'badge-amber'}">${params.status}</span></span>
      </div>
    </div>

    ${params.notes ? `<p style="font-size: 12px; color: #747878;"><strong>Observações do Administrador:</strong> "${params.notes}"</p>` : ''}
  `, 'Resultado de Solicitação de Faturamento', settings.businessName);

  return sendResendEmail({
    to: params.employeeEmail,
    subject: `Solicitação de Faturamento ${params.status}: ${params.description}`,
    html,
  });
}

/**
 * 8. Enviar E-mail de Teste para o Admin
 */
export async function sendTestEmail(adminEmail: string): Promise<SendEmailResult> {
  const settings = getStoredSettings();

  const html = wrapEmailHtml(`
    <h2 style="font-size: 18px; margin-top: 0; color: #1a6b3a;">Conexão com Resend Configurada com Sucesso! 🎉</h2>
    <p>Olá, Administrador,</p>
    <p>Esta é uma mensagem de teste para confirmar que a tua integração com o <strong>Resend</strong> está 100% funcional no sistema <strong>${settings.businessName}</strong>.</p>
    
    <div class="card" style="border-left: 4px solid #1a6b3a;">
      <div class="card-row">
        <span class="label">Status:</span>
        <span class="value"><span class="badge badge-green">Conectado &amp; Ativo</span></span>
      </div>
      <div class="card-row">
        <span class="label">Remetente:</span>
        <span class="value">${settings.emailSettings?.fromEmail || 'Default Resend'}</span>
      </div>
      <div class="card-row">
        <span class="label">Data de Teste:</span>
        <span class="value">${new Date().toLocaleString('pt-PT')}</span>
      </div>
    </div>

    <p>A partir de agora, todas as notificações de cobranças, comprovativos, projetos, tarefas e alertas do sistema serão enviadas normalmente por e-mail.</p>
  `, 'Teste de Conexão Resend', settings.businessName);

  return sendResendEmail({
    to: adminEmail,
    subject: `[Teste Resend] Conexão E-mail ${settings.businessName}`,
    html,
  });
}
