import { Client, Project, Income, Expense, NotificationItem } from '../types';

import { getDaysDiff, isToday, formatDate, formatCurrency, generateWhatsAppLink } from './formatters';

export function computeNotifications(
  clients: Client[],
  projects: Project[],
  incomes: Income[],
  expenses: Expense[]
): NotificationItem[] {
  const list: NotificationItem[] = [];

  const clientMap = new Map<string, Client>();
  clients.forEach((c) => clientMap.set(c.id, c));

  const projectMap = new Map<string, Project>();
  projects.forEach((p) => projectMap.set(p.id, p));

  // 1. Incomes due today or overdue
  incomes.forEach((inc) => {
    if (inc.status === 'Recebido') return;

    const diff = getDaysDiff(inc.dueDate);
    const client = clientMap.get(inc.clientId);
    const clientName = client?.name || 'Cliente';
    const clientPhone = client?.whatsapp || '';
    const formattedAmount = formatCurrency(inc.amount, inc.currency);

    if (diff === 0 || isToday(inc.dueDate)) {
      const text = `Olá, ${clientName}! Tudo bem? Gostaria de lembrar que o pagamento referentes a "${inc.description}" no valor de ${formattedAmount} vence hoje (${formatDate(inc.dueDate)}). Seguem os dados para pagamento. Qualquer dúvida estou à disposição!`;
      list.push({
        id: `inc-due-${inc.id}`,
        type: 'due_today',
        title: `Vencimento Hoje`,
        message: `🔔 Hoje vence o pagamento de ${clientName} (${formattedAmount}).`,
        date: inc.dueDate,
        clientId: inc.clientId,
        projectId: inc.projectId,
        incomeId: inc.id,
        whatsappMessage: text,
        whatsappPhone: clientPhone,
        severity: 'high',
      });
    } else if (diff < 0) {
      const daysOverdue = Math.abs(diff);
      const text = `Olá, ${clientName}! Espero que esteja bem. Notei que a cobrança referentes a "${inc.description}" no valor de ${formattedAmount} está pendente há ${daysOverdue} dia(s) (venceu em ${formatDate(inc.dueDate)}). Poderia nos enviar o comprovante assim que possível? Obrigado!`;
      list.push({
        id: `inc-overdue-${inc.id}`,
        type: 'overdue',
        title: `Pagamento Atrasado`,
        message: `🔔 Cliente ${clientName} está com pagamento atrasado há ${daysOverdue} dia(s) (${formattedAmount}).`,
        date: inc.dueDate,
        clientId: inc.clientId,
        projectId: inc.projectId,
        incomeId: inc.id,
        whatsappMessage: text,
        whatsappPhone: clientPhone,
        severity: 'high',
      });
    }
  });

  // 2. Project due dates (e.g. delivery tomorrow or due in <= 3 days)
  projects.forEach((proj) => {
    if (proj.status === 'Concluído' || proj.status === 'Cancelado') return;

    const diff = getDaysDiff(proj.dueDate);
    const client = clientMap.get(proj.clientId);
    const clientName = client ? (client.company || client.name) : 'Cliente';

    if (diff === 1) {
      list.push({
        id: `proj-due-tomorrow-${proj.id}`,
        type: 'project_due',
        title: `Entrega Amanhã`,
        message: `🔔 Amanhã entregar ${proj.category} (${proj.name}) da ${clientName}.`,
        date: proj.dueDate,
        clientId: proj.clientId,
        projectId: proj.id,
        severity: 'high',
      });
    } else if (diff === 0) {
      list.push({
        id: `proj-due-today-${proj.id}`,
        type: 'project_due',
        title: `Entrega Hoje`,
        message: `🔔 Hoje é o prazo de entrega do projeto "${proj.name}" (${clientName}).`,
        date: proj.dueDate,
        clientId: proj.clientId,
        projectId: proj.id,
        severity: 'high',
      });
    } else if (diff > 0 && diff <= 3) {
      list.push({
        id: `proj-due-soon-${proj.id}`,
        type: 'project_due',
        title: `Entrega Próxima`,
        message: `🔔 Faltam ${diff} dia(s) para a entrega de ${proj.name} (${clientName}).`,
        date: proj.dueDate,
        clientId: proj.clientId,
        projectId: proj.id,
        severity: 'medium',
      });
    }
  });

  // 3. Expenses upcoming or overdue
  expenses.forEach((exp) => {
    if (exp.paid) return;

    const diff = getDaysDiff(exp.date);
    const formattedAmount = formatCurrency(exp.amount, exp.currency);

    if (diff >= 0 && diff <= 7) {
      const whenText = diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : `em ${diff} dias`;
      list.push({
        id: `exp-due-${exp.id}`,
        type: 'expense_due',
        title: `Despesa Próxima`,
        message: `🔔 ${exp.description} (${formattedAmount}) vence ${whenText}.`,
        date: exp.date,
        expenseId: exp.id,
        severity: diff <= 1 ? 'high' : 'medium',
      });
    } else if (diff < 0) {
      list.push({
        id: `exp-overdue-${exp.id}`,
        type: 'expense_due',
        title: `Despesa Vencida`,
        message: `⚠️ Despesa vencida: ${exp.description} (${formattedAmount}) em ${formatDate(exp.date)}.`,
        date: exp.date,
        expenseId: exp.id,
        severity: 'high',
      });
    }
  });

  return list;
}
