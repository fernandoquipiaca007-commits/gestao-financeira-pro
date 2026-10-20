import { Client, Project, Income, Expense, NotificationItem } from '../types';

import { getDaysDiff, isToday, formatDate, formatCurrency, generateWhatsAppLink } from './formatters';

export function computeNotifications(
  clients: Client[],
  projects: Project[],
  incomes: Income[],
  expenses: Expense[],
  lang: 'pt' | 'en' = 'pt'
): NotificationItem[] {
  const isEn = lang === 'en';
  const list: NotificationItem[] = [];

  const clientMap = new Map<string, Client>();
  clients.forEach((c) => clientMap.set(c.id, c));

  const projectMap = new Map<string, Project>();
  projects.forEach((p) => projectMap.set(p.id, p));

  // 1. Incomes due today or overdue
  incomes.forEach((inc) => {
    if (inc.status === 'Recebido') return;

    // Ignorar receitas cujo projeto está pausado ou cancelado
    if (inc.projectId) {
      const proj = projectMap.get(inc.projectId);
      if (proj?.status === 'Aguardando cliente' || proj?.status === 'Cancelado') return;
    }

    const diff = getDaysDiff(inc.dueDate);
    const client = clientMap.get(inc.clientId);
    const clientName = client?.name || (isEn ? 'Client' : 'Cliente');
    const clientPhone = client?.whatsapp || '';
    const formattedAmount = formatCurrency(inc.amount, inc.currency);

    if (diff === 0 || isToday(inc.dueDate)) {
      const text = isEn
        ? `Hello, ${clientName}! Hope you are doing well. Friendly reminder that the payment for "${inc.description}" in the amount of ${formattedAmount} is due today (${formatDate(inc.dueDate)}). Please find payment details attached. Let us know if you have any questions!`
        : `Olá, ${clientName}! Tudo bem? Gostaria de lembrar que o pagamento referentes a "${inc.description}" no valor de ${formattedAmount} vence hoje (${formatDate(inc.dueDate)}). Seguem os dados para pagamento. Qualquer dúvida estou à disposição!`;

      list.push({
        id: `inc-due-${inc.id}`,
        type: 'due_today',
        title: isEn ? 'Payment Due Today' : 'Vencimento Hoje',
        message: isEn
          ? `Today payment from ${clientName} (${formattedAmount}) is due.`
          : `Hoje vence o pagamento de ${clientName} (${formattedAmount}).`,
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
      const text = isEn
        ? `Hello, ${clientName}! Hope you are doing well. We noticed that invoice "${inc.description}" in the amount of ${formattedAmount} is overdue by ${daysOverdue} day(s) (due on ${formatDate(inc.dueDate)}). Could you please send us the payment confirmation at your earliest convenience? Thank you!`
        : `Olá, ${clientName}! Espero que esteja bem. Notei que a cobrança referentes a "${inc.description}" no valor de ${formattedAmount} está pendente há ${daysOverdue} dia(s) (venceu em ${formatDate(inc.dueDate)}). Poderia nos enviar o comprovante assim que possível? Obrigado!`;

      list.push({
        id: `inc-overdue-${inc.id}`,
        type: 'overdue',
        title: isEn ? 'Overdue Payment' : 'Pagamento Atrasado',
        message: isEn
          ? `Client ${clientName} has an overdue payment of ${formattedAmount} (${daysOverdue} day(s) overdue).`
          : `Cliente ${clientName} está com pagamento atrasado há ${daysOverdue} dia(s) (${formattedAmount}).`,
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
    if (proj.status === 'Concluído' || proj.status === 'Cancelado' || proj.status === 'Aguardando cliente') return;
    if (!proj.dueDate) return; // entrega sem data definida: nada a avisar

    const diff = getDaysDiff(proj.dueDate);
    const client = clientMap.get(proj.clientId);
    const clientName = client ? (client.company || client.name || (isEn ? 'Client' : 'Cliente')) : (isEn ? 'Client' : 'Cliente');
    const projName = proj.name || 'Projeto';

    if (diff === 1) {
      list.push({
        id: `proj-due-tomorrow-${proj.id}`,
        type: 'project_due',
        title: isEn ? 'Delivery Tomorrow' : 'Entrega Amanhã',
        message: isEn
          ? `Tomorrow: deliver ${proj.category || ''} (${projName}) for ${clientName}.`
          : `Amanhã entregar ${proj.category || ''} (${projName}) da ${clientName}.`,
        date: proj.dueDate,
        clientId: proj.clientId,
        projectId: proj.id,
        severity: 'high',
      });
    } else if (diff === 0) {
      list.push({
        id: `proj-due-today-${proj.id}`,
        type: 'project_due',
        title: isEn ? 'Delivery Today' : 'Entrega Hoje',
        message: isEn
          ? `Today is the delivery deadline for project "${projName}" (${clientName}).`
          : `Hoje é o prazo de entrega do projeto "${projName}" (${clientName}).`,
        date: proj.dueDate,
        clientId: proj.clientId,
        projectId: proj.id,
        severity: 'high',
      });
    } else if (diff > 0 && diff <= 3) {
      list.push({
        id: `proj-due-soon-${proj.id}`,
        type: 'project_due',
        title: isEn ? 'Upcoming Delivery' : 'Entrega Próxima',
        message: isEn
          ? `${diff} day(s) remaining for delivery of ${projName} (${clientName}).`
          : `Faltam ${diff} dia(s) para a entrega de ${projName} (${clientName}).`,
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
      const whenText = diff === 0
        ? (isEn ? 'today' : 'hoje')
        : diff === 1
        ? (isEn ? 'tomorrow' : 'amanhã')
        : (isEn ? `in ${diff} days` : `em ${diff} dias`);

      list.push({
        id: `exp-due-${exp.id}`,
        type: 'expense_due',
        title: isEn ? 'Upcoming Expense' : 'Despesa Próxima',
        message: isEn
          ? `${exp.description} (${formattedAmount}) is due ${whenText}.`
          : `${exp.description} (${formattedAmount}) vence ${whenText}.`,
        date: exp.date,
        expenseId: exp.id,
        severity: diff <= 1 ? 'high' : 'medium',
      });
    } else if (diff < 0) {
      list.push({
        id: `exp-overdue-${exp.id}`,
        type: 'expense_due',
        title: isEn ? 'Overdue Expense' : 'Despesa Vencida',
        message: isEn
          ? `Overdue expense: ${exp.description} (${formattedAmount}) on ${formatDate(exp.date)}.`
          : `Despesa vencida: ${exp.description} (${formattedAmount}) em ${formatDate(exp.date)}.`,
        date: exp.date,
        expenseId: exp.id,
        severity: 'high',
      });
    }
  });

  return list;
}
