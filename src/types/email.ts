import { CurrencyCode } from '../types';

export interface EmailNotificationToggles {
  clientPaymentReminder: boolean;     // Cobrança / Lembrete de Pagamento para Clientes
  clientReceipt: boolean;             // Comprovativo / Recibo de Pagamento para Clientes
  clientProjectUpdate: boolean;       // Atualizações do Projeto para Clientes
  employeeProjectAssigned: boolean;   // Notificação de Projeto Atribuído a Colaborador
  employeeTaskAssigned: boolean;      // Notificação de Tarefa Atribuída a Colaborador
  employeeTaskDueAlert: boolean;      // Alerta de Prazo de Tarefa para Colaborador
  employeeWelcome: boolean;           // Credenciais de Acesso a Novo Colaborador
  adminBillingRequestAlert: boolean;  // Alerta ao Admin sobre Solicitação de Faturamento
  employeeBillingStatusAlert: boolean; // Alerta ao Solicitante sobre Faturamento Aprovado/Rejeitado
  systemAlertDueDates: boolean;       // Alertas Automáticos de Vencimento
}

export interface ResendEmailSettings {
  apiKey: string;
  fromEmail: string;        // e.g. "GestãoFO <notificacoes@seudominio.com>"
  fromName?: string;        // e.g. "GestãoFO Studio"
  replyTo?: string;         // e.g. "suporte@seudominio.com"
  enabled: boolean;         // Ativar/Desativar globalmente o envio de e-mails
  toggles: EmailNotificationToggles;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded string or raw string
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}
