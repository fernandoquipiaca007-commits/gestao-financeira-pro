import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Lang = 'pt' | 'en';

export interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
  isEn: boolean;
  isPt: boolean;
}

export const SYSTEM_TRANSLATIONS: Record<string, Record<Lang, string>> = {
  // Navigation
  'nav.dashboard': { pt: 'Painel', en: 'Dashboard' },
  'nav.calendar': { pt: 'Agenda', en: 'Schedule' },
  'nav.projects': { pt: 'Projetos', en: 'Projects' },
  'nav.tasks': { pt: 'Tarefas', en: 'Tasks' },
  'nav.billing': { pt: 'Faturação', en: 'Billing' },
  'nav.clients': { pt: 'Clientes', en: 'Clients' },
  'nav.financial': { pt: 'Financeiro', en: 'Finance' },
  'nav.partners': { pt: 'Parceiros', en: 'Partners' },
  'nav.categories': { pt: 'Categorias', en: 'Categories' },
  'nav.reports': { pt: 'Relatórios', en: 'Reports' },
  'nav.plans': { pt: 'Planos', en: 'Plans' },
  'nav.users': { pt: 'Utilizadores', en: 'Users' },
  'nav.audit': { pt: 'Auditoria', en: 'Audit log' },
  'nav.docs': { pt: 'Ajuda', en: 'Help' },
  'nav.settings': { pt: 'Definições', en: 'Settings' },
  'nav.mainMenu': { pt: 'Menu Principal', en: 'Main Menu' },
  'nav.logout': { pt: 'Sair do Sistema', en: 'Sign Out' },
  'nav.expandMenu': { pt: 'Expandir Menu Principal', en: 'Expand Main Menu' },
  'nav.collapseMenu': { pt: 'Encolher Menu Principal', en: 'Collapse Main Menu' },
  'common.loadingWorkspace': { pt: 'A preparar o seu espaço de trabalho...', en: 'Preparing your workspace...' },
  'common.configuringWorkspace': { pt: 'Estamos a configurar a sua empresa e período de trial.', en: 'We are setting up your company and trial period.' },

  // Header
  'header.searchPlaceholder': { pt: 'Pesquisar clientes, projetos, faturas...', en: 'Search clients, projects, invoices...' },
  'header.new': { pt: 'Novo', en: 'New' },
  'header.newProject': { pt: 'Novo Projeto', en: 'New Project' },
  'header.newClient': { pt: 'Novo cliente', en: 'New client' },
  'header.newIncome': { pt: 'Nova Receita', en: 'New Income' },
  'header.newExpense': { pt: 'Nova Despesa', en: 'New Expense' },
  'header.newTask': { pt: 'Nova tarefa', en: 'New task' },
  'header.newBilling': { pt: 'Pedido de Faturação', en: 'Billing Request' },
  'header.newPartner': { pt: 'Novo parceiro', en: 'New partner' },
  'header.newUser': { pt: 'Novo Utilizador', en: 'New User' },
  'header.allCurrencies': { pt: 'Todas as Moedas', en: 'All Currencies' },
  'header.filterCurrency': { pt: 'Filtrar por moeda', en: 'Filter by currency' },
  'header.notifications': { pt: 'Notificações e Alertas', en: 'Notifications & Alerts' },
  'header.sync': { pt: 'Sincronizar dados com o banco de dados', en: 'Sync data with database' },
  'header.themeLight': { pt: 'Alternar para Modo Claro', en: 'Switch to Light Mode' },
  'header.themeDark': { pt: 'Alternar para Modo Escuro', en: 'Switch to Dark Mode' },
  'header.logout': { pt: 'Sair do Sistema', en: 'Sign Out' },

  // Common Actions
  'common.save': { pt: 'Guardar', en: 'Save' },
  'common.saving': { pt: 'A guardar...', en: 'Saving...' },
  'common.saveChanges': { pt: 'Guardar Alterações', en: 'Save Changes' },
  'common.cancel': { pt: 'Cancelar', en: 'Cancel' },
  'common.delete': { pt: 'Eliminar', en: 'Delete' },
  'common.edit': { pt: 'Editar', en: 'Edit' },
  'common.create': { pt: 'Criar', en: 'Create' },
  'common.all': { pt: 'Todos', en: 'All' },
  'common.actions': { pt: 'Ações', en: 'Actions' },
  'common.status': { pt: 'Estado', en: 'Status' },
  'common.name': { pt: 'Nome', en: 'Name' },
  'common.email': { pt: 'E-mail', en: 'Email' },
  'common.role': { pt: 'Cargo', en: 'Role' },
  'common.search': { pt: 'Pesquisar', en: 'Search' },
  'common.active': { pt: 'Ativo', en: 'Active' },
  'common.suspended': { pt: 'Suspenso', en: 'Suspended' },
  'common.invited': { pt: 'Convidado', en: 'Invited' },
  'common.close': { pt: 'Fechar', en: 'Close' },
  'common.back': { pt: 'Voltar', en: 'Back' },
  'common.confirm': { pt: 'Confirmar', en: 'Confirm' },
  'common.language': { pt: 'Idioma', en: 'Language' },
  'common.systemLanguage': { pt: 'Idioma do Sistema', en: 'System Language' },
  'common.portuguese': { pt: 'Português', en: 'Portuguese' },
  'common.english': { pt: 'Inglês', en: 'English' },
  'common.loading': { pt: 'A carregar...', en: 'Loading...' },
  'common.success': { pt: 'Sucesso', en: 'Success' },
  'common.error': { pt: 'Erro', en: 'Error' },

  // User Management
  'users.title': { pt: 'Utilizadores', en: 'Users' },
  'users.subtitle': { pt: 'Quem tem acesso e com que cargo.', en: 'Who has access and with which role.' },
  'users.newUser': { pt: 'Novo Utilizador', en: 'New User' },
  'users.editUser': { pt: 'Editar Utilizador', en: 'Edit User' },
  'users.totalMembers': { pt: 'Total Membros', en: 'Total Members' },
  'users.admins': { pt: 'Administradores', en: 'Administrators' },
  'users.employees': { pt: 'Funcionários', en: 'Employees' },
  'users.activeAccounts': { pt: 'Contas Ativas', en: 'Active Accounts' },
  'users.searchPlaceholder': { pt: 'Pesquisar por nome ou email...', en: 'Search by name or email...' },
  'users.filterAll': { pt: 'Todos', en: 'All' },
  'users.editSubtitle': { pt: 'Alterar dados e cargo', en: 'Change details and role' },
  'users.newSubtitle': { pt: 'Criar conta com palavra-passe temporária', en: 'Create account with temporary password' },
  'users.fullName': { pt: 'Nome Completo', en: 'Full Name' },
  'users.fullNamePlaceholder': { pt: 'Nome do utilizador', en: 'User full name' },
  'users.emailPlaceholder': { pt: 'email@empresa.com', en: 'email@company.com' },
  'users.tempPassword': { pt: 'Palavra-passe temporária', en: 'Temporary password' },
  'users.minChars': { pt: 'Mínimo 6 caracteres', en: 'Minimum 6 characters' },
  'users.tempPasswordHint': { pt: 'O utilizador poderá alterar a palavra-passe no primeiro acesso.', en: 'User will be able to change password upon first login.' },
  'users.roleLabel': { pt: 'Cargo', en: 'Role' },
  'users.roleDescAdmin': { pt: 'Acesso administrativo amplo conforme permissões', en: 'Broad administrative access per permissions' },
  'users.roleDescEmployee': { pt: 'Acesso operacional limitado ao seu escopo', en: 'Operational access limited to their scope' },
  'users.systemLanguage': { pt: 'Idioma do Sistema', en: 'System Language' },
  'users.systemLanguageDesc': { pt: 'Idioma preferido para a interface e notificações deste utilizador', en: 'Preferred language for interface and notifications for this user' },
  'users.systemLanguageHint': { pt: 'Ao selecionar Inglês, o sistema apresentará menus, relatórios e telas em inglês.', en: 'Selecting English will render menus, reports, and views in English.' },
  'users.state': { pt: 'Estado', en: 'Status' },
  'users.btnSave': { pt: 'Guardar', en: 'Save' },
  'users.btnCreate': { pt: 'Criar Utilizador', en: 'Create User' },
  'users.btnSaving': { pt: 'A guardar...', en: 'Saving...' },
  'users.permissions': { pt: 'Permissões', en: 'Permissions' },
  'users.suspend': { pt: 'Suspender', en: 'Suspend' },
  'users.activate': { pt: 'Ativar', en: 'Activate' },
  'users.delete': { pt: 'Eliminar', en: 'Delete' },
  'users.lastLogin': { pt: 'Último Acesso', en: 'Last Login' },
  'users.neverLoggedIn': { pt: 'Nunca acedeu', en: 'Never logged in' },

  // Settings View
  'settings.title': { pt: 'Definições', en: 'Settings' },
  'settings.subtitleAdmin': { pt: 'Personalize o idioma, moeda padrão, cotações de câmbio, dados da empresa e segurança', en: 'Customize language, default currency, exchange rates, company info and security' },
  'settings.subtitleEmployee': { pt: 'Faça a gestão de seu perfil pessoal, preferências de idioma e acesso', en: 'Manage your personal profile, language preferences and access' },
  'settings.userProfile': { pt: 'Perfil', en: 'Profile' },
  
  // Dedicated Language & Translations Section
  'settings.languageAreaTitle': { pt: 'Idioma', en: 'Language' },
  'settings.languageAreaDesc': { pt: 'Selecione o idioma em que deseja navegar pelo sistema. Todos os menus, painéis, cabeçalhos e formulários serão adaptados.', en: 'Select the language you want to use across the entire platform. All menus, dashboards, headers, and forms will adapt.' },
  'settings.langPt': { pt: 'Português', en: 'Portuguese' },
  'settings.langPtDesc': { pt: 'Interface completa em língua portuguesa', en: 'Full interface in Portuguese language' },
  'settings.langEn': { pt: 'English', en: 'English' },
  'settings.langEnDesc': { pt: 'Complete interface in English language', en: 'Complete interface in English language' },
  'settings.activeLangNotice': { pt: 'Idioma ativo no momento', en: 'Currently active language' },
  'settings.langHint': { pt: 'Também pode mudar o idioma no menu da sua conta, no canto superior direito.', en: 'You can also switch language from your account menu, top right.' },

  // Settings: Theme & Appearance
  'settings.appearance': { pt: 'Aparência', en: 'Appearance' },
  'settings.appearanceDesc': { pt: 'Tema da interface', en: 'Interface theme' },
  'settings.viewMode': { pt: 'Tema', en: 'Theme' },
  'settings.modeLight': { pt: 'Claro', en: 'Light' },
  'settings.modeDark': { pt: 'Escuro', en: 'Dark' },
  'settings.modeSystem': { pt: 'Automático', en: 'Automatic' },

  // Settings: Password
  'settings.changePassword': { pt: 'Alterar palavra-passe', en: 'Change password' },
  'settings.newPassword': { pt: 'Nova palavra-passe', en: 'New password' },
  'settings.confirmPassword': { pt: 'Confirmar palavra-passe', en: 'Confirm password' },
  'settings.updatePassword': { pt: 'Atualizar palavra-passe', en: 'Update password' },
  'settings.passwordMin': { pt: 'Mínimo 6 caracteres', en: 'Minimum 6 characters' },
  'settings.repeatPassword': { pt: 'Repita a nova palavra-passe', en: 'Repeat the new password' },

  // Settings: Company & Financial
  'settings.companyDetails': { pt: 'Dados da Empresa', en: 'Company Details' },
  'settings.companyName': { pt: 'Nome da Empresa', en: 'Company Name' },
  'settings.defaultCurrency': { pt: 'Moeda por defeito da empresa', en: 'Company default currency' },
  'settings.defaultCurrencyDesc': { pt: 'Esta moeda é usada por defeito ao criar novos projetos e clientes.', en: 'This currency is used by default when you create new projects and clients.' },
  'settings.exchangeRates': { pt: 'Taxas de Câmbio em Relação ao Real (BRL)', en: 'Exchange Rates Relative to Real (BRL)' },
  'settings.exchangeRatesDesc': { pt: 'Usadas para conversão automática em relatórios consolidados e dashboard.', en: 'Used for automatic conversion in consolidated reports and dashboard.' },
  'settings.emailSettings': { pt: 'Envio de E-mails Transacionais & Notificações (Resend API)', en: 'Transactional Email Delivery & Notifications (Resend API)' },
  'settings.emailSettingsDesc': { pt: 'Configure a sua chave API do Resend e escolha que eventos enviam emails automáticos.', en: 'Configure your Resend API key and choose which events send automatic emails.' },
  'settings.saveCompanySettings': { pt: 'Guardar Alterações da Empresa', en: 'Save Company Settings' },
  'settings.savedSuccess': { pt: 'Configurações salvas com sucesso!', en: 'Settings saved successfully!' },

  // Settings: Backup
  'settings.backup': { pt: 'Exportar & Importar Dados (Backup Seguro)', en: 'Export & Import Data (Secure Backup)' },
  'settings.backupDesc': { pt: 'Faça um backup completo dos seus clientes, projetos e finanças para ficheiro ou migração entre dispositivos.', en: 'Make a full backup of your clients, projects and finances for archival or device migration.' },
  'settings.exportBackup': { pt: 'Exportar Backup', en: 'Export Backup' },
  'settings.exportDesc': { pt: 'Baixe um ficheiro .json contendo todos os registros.', en: 'Download a .json file containing all records.' },
  'settings.downloadJson': { pt: 'Baixar Ficheiro JSON', en: 'Download JSON File' },
  'settings.restoreBackup': { pt: 'Restaurar Backup', en: 'Restore Backup' },
  'settings.restoreDesc': { pt: 'Carregue um ficheiro .json anteriormente exportado.', en: 'Upload a previously exported .json file.' },
  'settings.selectBackupFile': { pt: 'Selecionar Ficheiro Backup', en: 'Select Backup File' },

  // Dashboard
  'dashboard.hello': { pt: 'Olá', en: 'Hello' },
  'dashboard.teamMember': { pt: 'Membro da Equipa', en: 'Team Member' },
  'dashboard.operationalSubtitle': { pt: 'Os seus projetos, tarefas e entregas.', en: 'Your projects, tasks and deliveries.' },
  'dashboard.executiveSubtitle': { pt: 'O estado do seu negócio, hoje.', en: 'Your business, today.' },
  'dashboard.myProjects': { pt: 'Meus Projetos', en: 'My Projects' },
  'dashboard.inProgress': { pt: 'em andamento', en: 'in progress' },
  'dashboard.myTasks': { pt: 'Minhas tarefas', en: 'My tasks' },
  'dashboard.pending': { pt: 'pendentes', en: 'pending' },
  'dashboard.availableProjects': { pt: 'Projetos Disponíveis', en: 'Available Projects' },
  'dashboard.forAssuming': { pt: 'para assumir', en: 'to take on' },
  'dashboard.myClients': { pt: 'Meus Clientes', en: 'My Clients' },
  'dashboard.assigned': { pt: 'atribuídos', en: 'assigned' },
  'dashboard.myAssignedProjects': { pt: 'Meus Projetos Atribuídos', en: 'My Assigned Projects' },
  'dashboard.viewAll': { pt: 'Ver todos', en: 'View all' },
  'dashboard.noProjects': { pt: 'Não tens projetos atribuídos no momento', en: 'You have no assigned projects at the moment' },
  'dashboard.assume': { pt: 'Assumir', en: 'Take on' },
  'dashboard.noAvailableProjects': { pt: 'Nenhum projeto disponível para assumir', en: 'No available projects to take on' },
  'dashboard.toReceive': { pt: 'Total a Receber', en: 'Total Receivables' },
  'dashboard.receivedMonth': { pt: 'Recebido no Mês', en: 'Received This Month' },
  'dashboard.costsMonth': { pt: 'Custos do Mês', en: 'Costs This Month' },
  'dashboard.netProfit': { pt: 'Lucro Líquido', en: 'Net Profit' },
  'dashboard.activeProjectsCount': { pt: 'Projetos Ativos', en: 'Active Projects' },
  'dashboard.pendingInvoices': { pt: 'Faturas Pendentes', en: 'Pending Invoices' },
  'dashboard.recentTransactions': { pt: 'Transações Recentes', en: 'Recent Transactions' },
  'dashboard.evolutionChart': { pt: 'Evolução Semestral (Receitas vs Despesas)', en: '6-Month Evolution (Income vs Expenses)' },
  'dashboard.incomes': { pt: 'Receitas', en: 'Income' },
  'dashboard.expenses': { pt: 'Despesas', en: 'Expenses' },
  'dashboard.profit': { pt: 'Lucro', en: 'Profit' },
  'dashboard.pendingBillingRequests': { pt: 'solicitações de faturação pendentes', en: 'pending billing requests' },
  'dashboard.pendingBillingDesc': { pt: 'Há pedidos de faturação da equipa à espera da sua aprovação.', en: 'Team members submitted billing requests awaiting your approval.' },
  'dashboard.reviewRequests': { pt: 'Rever pedidos', en: 'Review requests' },

  // Financial Module
  'financial.title': { pt: 'Financeiro', en: 'Finance' },
  'financial.subtitle': { pt: 'Receitas, despesas e cobranças.', en: 'Income, expenses and collections.' },
  'financial.newIncome': { pt: 'Nova receita', en: 'New income' },
  'financial.newExpense': { pt: 'Nova despesa', en: 'New expense' },
  'financial.registerWithdrawal': { pt: 'Registar levantamento', en: 'Record withdrawal' },
  'financial.tabIncomes': { pt: 'Receitas', en: 'Income' },
  'financial.tabExpenses': { pt: 'Despesas', en: 'Expenses' },
  'financial.tabCalendar': { pt: 'Agenda financeira', en: 'Financial calendar' },
  'financial.searchPlaceholder': { pt: 'Pesquisar por cliente ou descrição...', en: 'Search by client or description...' },
  'financial.allStatuses': { pt: 'Todos os estados', en: 'All statuses' },
  'financial.receivables': { pt: 'A receber (pendentes)', en: 'Receivable (pending)' },
  'financial.dueTodayOverdue': { pt: 'Para cobrar hoje / em atraso', en: 'Due today / overdue' },
  'financial.overdue': { pt: 'Em atraso', en: 'Overdue' },
  'financial.receivedIncomes': { pt: 'Receitas recebidas', en: 'Received income' },
  'financial.filterAll': { pt: 'Todas', en: 'All' },
  'financial.filterReceivables': { pt: 'A receber', en: 'Receivable' },
  'financial.filterDueToday': { pt: 'Cobrar hoje', en: 'Due today' },
  'financial.filterOverdue': { pt: 'Em atraso', en: 'Overdue' },
  'financial.filterReceived': { pt: 'Recebidas', en: 'Received' },
  'financial.colClientProject': { pt: 'Cliente e projeto', en: 'Client and project' },
  'financial.colDescription': { pt: 'Descrição', en: 'Description' },
  'financial.colAmount': { pt: 'Valor', en: 'Amount' },
  'financial.colDueDate': { pt: 'Data prevista', en: 'Due date' },
  'financial.colPaymentMethod': { pt: 'Pagamento', en: 'Payment' },
  'financial.colStatus': { pt: 'Estado', en: 'Status' },
  'financial.colActions': { pt: 'Ações', en: 'Actions' },
  'financial.colCategory': { pt: 'Categoria', en: 'Category' },
  'financial.colDate': { pt: 'Data', en: 'Date' },
  'financial.colPaid': { pt: 'Pago?', en: 'Paid?' },
  'financial.noIncomesFound': { pt: 'Nenhuma receita encontrada para os filtros selecionados', en: 'No income entries found for selected filters' },
  'financial.noExpensesFound': { pt: 'Nenhuma despesa encontrada para os filtros selecionados', en: 'No expenses found for selected filters' },
  'financial.allExpenseCategories': { pt: 'Todas as categorias', en: 'All categories' },
  'financial.totalPaidMonth': { pt: 'Pago este mês', en: 'Paid this month' },
  'financial.totalPendingExpenses': { pt: 'Despesas por pagar', en: 'Expenses to pay' },
  'financial.monthSummary': { pt: 'Resumo do mês', en: 'Monthly summary' },
  'financial.chargeViaWhatsApp': { pt: 'Cobrar via WhatsApp', en: 'Charge via WhatsApp' },
  'financial.sendEmail': { pt: 'Enviar E-mail com Fatura', en: 'Send Email with Invoice' },
  'financial.markAsReceived': { pt: 'Marcar como recebido', en: 'Mark as received' },
  'financial.markAsPending': { pt: 'Marcar como pendente', en: 'Mark as pending' },
  'financial.markAsPaid': { pt: 'Marcar como pago', en: 'Mark as paid' },
  'financial.markAsUnpaid': { pt: 'Marcar como não pago', en: 'Mark as unpaid' },
  'financial.integrityTitle': { pt: 'Avisos de Integridade Financeira', en: 'Financial Integrity Notices' },
  'financial.integritySubtitle': { pt: 'Aceda às Transações Financeiras para corrigir.', en: 'Access Financial Transactions to resolve.' },

  // Plans & Pricing
  'pricing.title': { pt: 'Planos que melhor se adaptam ao seu Negócio', en: 'Plans that best fit your Business' },
  'pricing.subtitle': { pt: 'Experimente 7 dias grátis. Cancele quando quiser ou continue gerindo o seu negócio sem interrupções.', en: 'Try 7 days free. Cancel anytime or continue managing your business without interruptions.' },
  'pricing.monthlyBilling': { pt: 'Faturação Mensal', en: 'Monthly Billing' },
  'pricing.annualBilling': { pt: 'Anual', en: 'Annual' },
  'pricing.save20': { pt: 'Economize 20%', en: 'Save 20%' },
  'pricing.perMonth': { pt: '/mês', en: '/mo' },
  'pricing.billedAnnually': { pt: 'Faturado anualmente', en: 'Billed annually' },
  'pricing.mostPopular': { pt: 'Mais Vendido', en: 'Most Popular' },
  'pricing.currentPlan': { pt: 'Plano Atual', en: 'Current Plan' },
  'pricing.startFreeTrial': { pt: 'Começar 7 Dias Grátis', en: 'Start 7-Day Free Trial' },
  'pricing.contactSales': { pt: 'Falar com Consultor', en: 'Contact Sales' },
  'pricing.upgradeNow': { pt: 'Fazer Upgrade', en: 'Upgrade Now' },
  'pricing.includesInPlan': { pt: 'Inclui no plano', en: 'Included in' },
  'pricing.everythingIn': { pt: 'Tudo no', en: 'Everything in' },
  'pricing.andMore': { pt: ', e mais:', en: ', plus:' },

  // MCP API Keys
  'mcp.title': { pt: 'Chaves de API e MCP', en: 'API keys & MCP' },
  'mcp.subtitle': { pt: 'Ligue o Claude, o Cursor e outros agentes de IA aos seus dados com segurança.', en: 'Connect Claude, Cursor and other AI agents to your data securely.' },
  'mcp.serverUrlBanner': { pt: 'URL do Servidor MCP:', en: 'MCP Server URL:' },
  'mcp.newKey': { pt: 'Nova Chave de API', en: 'New API Key' }  ,
  'mcp.keyName': { pt: 'Nome da Chave / Identificador', en: 'Key Name / Identifier' },
  'mcp.keyNamePlaceholder': { pt: 'ex: Claude Desktop, Cursor IDE, Agente N8N...', en: 'e.g. Claude Desktop, Cursor IDE, N8N Agent...' },
  'mcp.expiration': { pt: 'Validade / Expiração', en: 'Expiration' },
  'mcp.exp30Days': { pt: '30 dias', en: '30 days' },
  'mcp.exp90Days': { pt: '90 dias', en: '90 days' },
  'mcp.exp1Year': { pt: '1 ano', en: '1 year' },
  'mcp.expNever': { pt: 'Nunca expira', en: 'Never expires' },
  'mcp.permissions': { pt: 'Permissões e Escopos de Acesso', en: 'Permissions & Access Scopes' },
  'mcp.btnGenerate': { pt: 'Gerar Chave de API', en: 'Generate API Key' },
  'mcp.activeKeys': { pt: 'Chaves Ativas', en: 'Active Keys' },
  'mcp.noKeys': { pt: 'Nenhuma chave de API gerada até o momento', en: 'No API keys generated yet' },
  'mcp.keyCreatedSuccess': { pt: 'Chave de API gerada com sucesso! Copie-a agora, pois ela não será exibida novamente.', en: 'API Key generated successfully! Copy it now, as it will not be shown again.' },
  'mcp.copy': { pt: 'Copiar Chave', en: 'Copy Key' },
  'mcp.copied': { pt: 'Copiado!', en: 'Copied!' },
  'mcp.revoke': { pt: 'Revogar', en: 'Revoke' },
  'mcp.confirmRevoke': { pt: 'Tem certeza que deseja revogar esta chave? Qualquer integração vinculada perderá acesso imediatamente.', en: 'Are you sure you want to revoke this key? Any connected integration will immediately lose access.' },

  // Notifications
  'notif.title': { pt: 'Notificações', en: 'Notifications' },
  'notif.tabAll': { pt: 'Todas', en: 'All' },
  'notif.tabUnread': { pt: 'Não Lidas', en: 'Unread' },
  'notif.tabSystem': { pt: 'Sistema', en: 'System' },
  'notif.tabLeads': { pt: 'Leads', en: 'Leads' },
  'notif.tabBilling': { pt: 'Cobranças', en: 'Billing' },
  'notif.tabDeadlines': { pt: 'Prazos', en: 'Deadlines' },
  'notif.markAllRead': { pt: 'Marcar todas como lidas', en: 'Mark all as read' },
  'notif.clearRead': { pt: 'Limpar lidas', en: 'Clear read' },
  'notif.empty': { pt: 'Nenhuma notificação no momento', en: 'No notifications at the moment' },
  'notif.emptySubtitle': { pt: 'Está tudo em dia.', en: 'You are all caught up.' },
  'notif.justNow': { pt: 'agora mesmo', en: 'just now' },
  'notif.minAgo': { pt: 'min atrás', en: 'min ago' },
  'notif.hoursAgo': { pt: 'h atrás', en: 'h ago' },
  'notif.yesterday': { pt: 'ontem', en: 'yesterday' },
  'notif.daysAgo': { pt: 'dias atrás', en: 'days ago' },

  // Projects
  'projects.title': { pt: 'Projetos', en: 'Projects' },
  'projects.subtitle': { pt: 'Entregas, valores e progresso.', en: 'Deliveries, value and progress.' },
  'projects.newProject': { pt: 'Novo projeto', en: 'New project' },
  'projects.allCategories': { pt: 'Todas as categorias', en: 'All categories' },
  'projects.allStatuses': { pt: 'Todos os estados', en: 'All statuses' },
  'projects.searchPlaceholder': { pt: 'Pesquisar projetos...', en: 'Search projects...' },
  'projects.colName': { pt: 'Projeto', en: 'Project' },
  'projects.colClient': { pt: 'Cliente', en: 'Client' },
  'projects.colTotal': { pt: 'Valor total', en: 'Total amount' },
  'projects.colPaid': { pt: 'Recebido', en: 'Received' },
  'projects.colDueDate': { pt: 'Prazo', en: 'Due date' },
  'projects.colStatus': { pt: 'Estado', en: 'Status' },
  'projects.colActions': { pt: 'Ações', en: 'Actions' },
  'projects.empty': { pt: 'Nenhum projeto encontrado', en: 'No projects found' },

  // Tasks
  'tasks.title': { pt: 'Tarefas', en: 'Tasks' },
  'tasks.subtitle': { pt: 'Arraste os cartões para mudar o estado.', en: 'Drag cards to change their status.' },
  'tasks.newTask': { pt: 'Nova tarefa', en: 'New task' },
  'tasks.allTasks': { pt: 'Todas as Tarefas', en: 'All Tasks' },
  'tasks.searchPlaceholder': { pt: 'Pesquisar tarefas...', en: 'Search tasks...' },
  'tasks.priority': { pt: 'Prioridade', en: 'Priority' },
  'tasks.assignedTo': { pt: 'Responsável', en: 'Assignee' },
  'tasks.dueDate': { pt: 'Prazo', en: 'Due Date' },
  'tasks.noTasks': { pt: 'Nenhuma tarefa encontrada', en: 'No tasks found' },

  // Clients
  'clients.title': { pt: 'Clientes', en: 'Clients' },
  'clients.subtitle': { pt: 'Contactos, condições e histórico de cada cliente.', en: 'Contacts, terms and history for each client.' },
  'clients.newClient': { pt: 'Novo cliente', en: 'New client' },
  'clients.searchPlaceholder': { pt: 'Pesquisar clientes por nome, empresa ou WhatsApp...', en: 'Search clients by name, company or WhatsApp...' },
  'clients.allNiches': { pt: 'Todos os Nichos', en: 'All Niches' },
  'clients.colClient': { pt: 'CLIENTE / EMPRESA', en: 'CLIENT / COMPANY' },
  'clients.colContact': { pt: 'CONTACTO', en: 'CONTACT' },
  'clients.colNiche': { pt: 'NICHO', en: 'NICHE' },
  'clients.colCountry': { pt: 'PAÍS / MOEDA', en: 'COUNTRY / CURRENCY' },
  'clients.colActiveProjects': { pt: 'PROJETOS ATIVOS', en: 'ACTIVE PROJECTS' },
  'clients.colTotalBilled': { pt: 'TOTAL FATURADO', en: 'TOTAL BILLED' },
  'clients.colActions': { pt: 'AÇÕES', en: 'ACTIONS' },
  'clients.noClients': { pt: 'Ainda não tem clientes', en: 'No clients yet' },

  // Billing Requests
  'billing.title': { pt: 'Faturação', en: 'Billing' },
  'billing.subtitle': { pt: 'Pedidos de faturação da equipa para aprovar.', en: 'Billing requests from your team to approve.' },
  'billing.newRequest': { pt: 'Nova Solicitação', en: 'New Request' },
  'billing.pendingReview': { pt: 'Em Análise', en: 'Under Review' },
  'billing.approved': { pt: 'Aprovadas', en: 'Approved' },
  'billing.rejected': { pt: 'Rejeitadas', en: 'Rejected' },
  'billing.invoiced': { pt: 'Faturadas', en: 'Invoiced' },
  'billing.empty': { pt: 'Nenhuma solicitação de faturação encontrada', en: 'No billing requests found' },

  // Partners
  'partners.title': { pt: 'Parceiros', en: 'Partners' },
  'partners.subtitle': { pt: 'Indicações e comissões a pagar.', en: 'Referrals and commissions to pay.' },
  'partners.newPartner': { pt: 'Novo parceiro', en: 'New partner' },
  'partners.searchPlaceholder': { pt: 'Pesquisar parceiros...', en: 'Search partners...' },
  'partners.colPartner': { pt: 'PARCEIRO', en: 'PARTNER' },
  'partners.colContact': { pt: 'CONTACTO', en: 'CONTACT' },
  'partners.colCommission': { pt: 'COMISSÃO PADRÃO', en: 'DEFAULT COMMISSION' },
  'partners.colProjects': { pt: 'PROJETOS VINCULADOS', en: 'LINKED PROJECTS' },
  'partners.colTotalPaid': { pt: 'TOTAL PAGO', en: 'TOTAL PAID' },
  'partners.colActions': { pt: 'AÇÕES', en: 'ACTIONS' },

  // Categories
  'categories.title': { pt: 'Categorias', en: 'Categories' },
  'categories.subtitle': { pt: 'Organize receitas, despesas e projetos.', en: 'Organise income, expenses and projects.' },
  'categories.newCategory': { pt: 'Nova categoria', en: 'New category' },
  'categories.tabIncomes': { pt: 'Categorias de Receitas', en: 'Income Categories' },
  'categories.tabExpenses': { pt: 'Categorias de Despesas', en: 'Expense Categories' },
  'categories.tabProjects': { pt: 'Categorias de Projetos', en: 'Project Categories' },

  // Reports
  'reports.title': { pt: 'Relatórios', en: 'Reports' },
  'reports.subtitle': { pt: 'Lucro, fluxo de caixa e desempenho por período.', en: 'Profit, cash flow and performance by period.' },
  'reports.period': { pt: 'Período', en: 'Period' },
  'reports.allPeriods': { pt: 'Todo o Histórico', en: 'Full History' },
  'reports.thisMonth': { pt: 'Este Mês', en: 'This Month' },
  'reports.lastMonth': { pt: 'Mês Passado', en: 'Last Month' },
  'reports.thisYear': { pt: 'Este Ano', en: 'This Year' },
  'reports.exportPdf': { pt: 'Exportar PDF', en: 'Export PDF' },
  'reports.exportCsv': { pt: 'Exportar CSV', en: 'Export CSV' },

  // Audit Log
  'audit.title': { pt: 'Auditoria', en: 'Audit log' },
  'audit.subtitle': { pt: 'Registo das ações sensíveis na sua empresa.', en: 'A record of sensitive actions in your company.' },
  'audit.searchPlaceholder': { pt: 'Pesquisar por ação, utilizador ou recurso...', en: 'Search by action, user or resource...' },
  'audit.colUser': { pt: 'UTILIZADOR', en: 'USER' },
  'audit.colAction': { pt: 'AÇÃO', en: 'ACTION' },
  'audit.colResource': { pt: 'RECURSO', en: 'RESOURCE' },
  'audit.colDate': { pt: 'DATA & HORA', en: 'DATE & TIME' },
  'audit.colStatus': { pt: 'RESULTADO', en: 'RESULT' },
  'audit.colDetails': { pt: 'DETALHES', en: 'DETAILS' },
};

const STORAGE_KEY = 'gfo_system_language';

const LanguageContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  isEn: false,
  isPt: true,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'pt') return saved;
    } catch {}
    return 'pt';
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'pt' ? 'en' : 'pt');
  }, [lang, setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const entry = SYSTEM_TRANSLATIONS[key];
      if (entry && entry[lang]) {
        return entry[lang];
      }
      if (entry && entry.pt) {
        return entry.pt;
      }
      return fallback !== undefined ? fallback : key;
    },
    [lang]
  );

  const value: LanguageContextType = {
    lang,
    setLang,
    toggleLang,
    t,
    isEn: lang === 'en',
    isPt: lang === 'pt',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
