import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  FolderKanban,
  Users,
  DollarSign,
  PieChart,
  Settings,
  Tag,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';
import {
  Client,
  Project,
  Income,
  Expense,
  CategoryItem,
  AgendaEvent,
  AppSettings,
  CurrencyCode,
  NotificationItem,
  UserSession,
} from './types';
import {
  getStoredClients,
  getStoredProjects,
  getStoredIncomes,
  getStoredExpenses,
  getStoredSettings,
  resetAllDataToDefault,
  clearAllData,
  exportBackupData,
  importBackupData,
  saveSettings,
} from './lib/storage';
import {
  fetchClientsFromDb,
  upsertClientToDb,
  deleteClientFromDb,
  fetchProjectsFromDb,
  upsertProjectToDb,
  deleteProjectFromDb,
  fetchIncomesFromDb,
  upsertIncomeToDb,
  deleteIncomeFromDb,
  fetchExpensesFromDb,
  upsertExpenseToDb,
  deleteExpenseFromDb,
  getStoredCategories,
  saveCategories,
  fetchAgendaEventsFromDb,
  upsertAgendaEventToDb,
  deleteAgendaEventFromDb,
} from './lib/db';
import { fetchLiveExchangeRates } from './lib/exchange';
import {
  registerServiceWorker,
  startBackgroundNotificationCheck,
  sendWebPushNotification,
} from './lib/webpush';
import { supabase } from './lib/supabase';
import { computeNotifications } from './lib/notifications';

import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { ProjectsView } from './components/ProjectsView';
import { ClientsView } from './components/ClientsView';
import { FinancialView } from './components/FinancialView';
import { CategoriesView } from './components/CategoriesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { NotificationsModal } from './components/NotificationsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

import { ClientModal } from './components/modals/ClientModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { IncomeModal } from './components/modals/IncomeModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { CategoryModal } from './components/modals/CategoryModal';
import { AgendaModal } from './components/modals/AgendaModal';

export default function App() {
  // Authentication State
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem('gfo_demo_session');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  // Check Supabase Auth session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserSession({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Gestor',
          token: session.access_token,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserSession({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Gestor',
          token: session.access_token,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('gfo_demo_session');
    await supabase.auth.signOut();
    setUserSession(null);
  };

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tabFilter, setTabFilter] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Currency Filter
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyCode | 'ALL'>('ALL');

  // Core Data State
  const [clients, setClients] = useState<Client[]>(getStoredClients);
  const [projects, setProjects] = useState<Project[]>(getStoredProjects);
  const [incomes, setIncomes] = useState<Income[]>(getStoredIncomes);
  const [expenses, setExpenses] = useState<Expense[]>(getStoredExpenses);
  const [categories, setCategories] = useState<CategoryItem[]>(getStoredCategories);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);

  // Modals & Drawers State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [agendaEventToEdit, setAgendaEventToEdit] = useState<AgendaEvent | null>(null);

  // Fetch initial data from DB and Exchange Rates
  useEffect(() => {
    registerServiceWorker();

    async function loadDbData() {
      const [fetchedClients, fetchedProjects, fetchedIncomes, fetchedExpenses, fetchedEvents, rates] = await Promise.all([
        fetchClientsFromDb(),
        fetchProjectsFromDb(),
        fetchIncomesFromDb(),
        fetchExpensesFromDb(),
        fetchAgendaEventsFromDb(),
        fetchLiveExchangeRates(),
      ]);

      if (fetchedClients.length > 0) setClients(fetchedClients);
      if (fetchedProjects.length > 0) setProjects(fetchedProjects);
      if (fetchedIncomes.length > 0) setIncomes(fetchedIncomes);
      if (fetchedExpenses.length > 0) setExpenses(fetchedExpenses);
      if (fetchedEvents.length > 0) setAgendaEvents(fetchedEvents);

      if (rates) {
        setSettings((prev) => {
          const updated = { ...prev, exchangeRates: rates };
          saveSettings(updated);
          return updated;
        });
      }
    }

    loadDbData();
  }, []);

  // Background Web Push Notification Check Interval
  useEffect(() => {
    startBackgroundNotificationCheck(() => {
      const today = new Date().toISOString().split('T')[0];
      
      // Check for pending due incomes today
      incomes.forEach((inc) => {
        if (inc.dueDate === today && inc.status === 'Pendente') {
          const client = clients.find((c) => c.id === inc.clientId);
          sendWebPushNotification(`🔔 Cobrança Hoje: ${inc.description}`, {
            body: `Cliente: ${client?.name || 'Cliente'} - Valor: ${inc.currency} ${inc.amount.toLocaleString()}`,
          });
        }
      });

      // Check for project deliveries today
      projects.forEach((proj) => {
        if (proj.dueDate === today && proj.status !== 'Concluído') {
          sendWebPushNotification(`📦 Entrega de Projeto Hoje!`, {
            body: `Projeto: ${proj.name} deve ser entregue hoje.`,
          });
        }
      });

      // Check for manual alarms/events today
      agendaEvents.forEach((ev) => {
        if (ev.date === today && ev.status === 'pending' && ev.notifyPush) {
          sendWebPushNotification(`⏰ Alerta de Agenda: ${ev.title}`, {
            body: ev.description || `Evento agendado para hoje.`,
          });
        }
      });
    }, 120000); // Check every 2 minutes
  }, [incomes, projects, agendaEvents, clients]);

  // Compute Notifications list
  const notifications: NotificationItem[] = React.useMemo(
    () => computeNotifications(clients, projects, incomes, expenses),
    [clients, projects, incomes, expenses]
  );

  // Navigation Helper
  const handleNavigateTab = (tab: string, filter?: string) => {
    setActiveTab(tab);
    setTabFilter(filter);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // WhatsApp Trigger Helper
  const handleOpenWhatsAppCharge = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // CLIENT CRUD
  const handleSaveClient = async (clientData: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => {
    const targetId = clientData.id || `cli-${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id: targetId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await upsertClientToDb(newClient);
    setClients((prev) => [newClient, ...prev.filter((c) => c.id !== targetId)]);
  };

  const handleDeleteClient = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
      await deleteClientFromDb(clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setProjects((prev) => prev.filter((p) => p.clientId !== clientId));
      setIncomes((prev) => prev.filter((i) => i.clientId !== clientId));
    }
  };

  // PROJECT CRUD
  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string }) => {
    const targetId = projectData.id || `proj-${Date.now()}`;
    const newProj: Project = {
      ...projectData,
      id: targetId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await upsertProjectToDb(newProj);
    setProjects((prev) => [newProj, ...prev.filter((p) => p.id !== targetId)]);

    // Automatically create initial Income entries if paidAmount > 0
    if (!projectData.id && newProj.paidAmount > 0) {
      const newInc: Income = {
        id: `inc-${Date.now()}`,
        clientId: newProj.clientId,
        projectId: newProj.id,
        description: `Pagamento Inicial - ${newProj.name}`,
        amount: newProj.paidAmount,
        currency: newProj.currency,
        dueDate: newProj.startDate,
        receivedDate: newProj.startDate,
        paymentMethod: 'PIX',
        status: 'Recebido',
        createdAt: new Date().toISOString().split('T')[0],
      };
      await upsertIncomeToDb(newInc);
      setIncomes((prev) => [newInc, ...prev]);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
      await deleteProjectFromDb(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setIncomes((prev) => prev.filter((i) => i.projectId !== projectId));
    }
  };

  // INCOME CRUD
  const handleSaveIncome = async (incomeData: Omit<Income, 'id' | 'createdAt'> & { id?: string }) => {
    const targetId = incomeData.id || `inc-${Date.now()}`;
    const newInc: Income = {
      ...incomeData,
      id: targetId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await upsertIncomeToDb(newInc);
    setIncomes((prev) => [newInc, ...prev.filter((i) => i.id !== targetId)]);
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      await deleteIncomeFromDb(incomeId);
      setIncomes((prev) => prev.filter((i) => i.id !== incomeId));
    }
  };

  const handleToggleIncomeStatus = async (income: Income) => {
    const nextStatus = income.status === 'Recebido' ? 'Pendente' : 'Recebido';
    const updated: Income = {
      ...income,
      status: nextStatus,
      receivedDate: nextStatus === 'Recebido' ? new Date().toISOString().split('T')[0] : undefined,
    };
    await upsertIncomeToDb(updated);
    setIncomes((prev) => prev.map((i) => (i.id === income.id ? updated : i)));
  };

  // EXPENSE CRUD
  const handleSaveExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'> & { id?: string }) => {
    const targetId = expenseData.id || `exp-${Date.now()}`;
    const newExp: Expense = {
      ...expenseData,
      id: targetId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await upsertExpenseToDb(newExp);
    setExpenses((prev) => [newExp, ...prev.filter((e) => e.id !== targetId)]);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      await deleteExpenseFromDb(expenseId);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    }
  };

  const handleToggleExpensePaid = async (expense: Expense) => {
    const updated: Expense = { ...expense, paid: !expense.paid };
    await upsertExpenseToDb(updated);
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? updated : e)));
  };

  // CATEGORY CRUD
  const handleSaveCategory = (catData: Omit<CategoryItem, 'id' | 'createdAt'> & { id?: string }) => {
    const targetId = catData.id || `cat-${Date.now()}`;
    const newCat: CategoryItem = {
      ...catData,
      id: targetId,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCat, ...categories.filter((c) => c.id !== targetId)];
    saveCategories(updated);
    setCategories(updated);
  };

  const handleDeleteCategory = (catId: string) => {
    if (window.confirm('Excluir esta categoria?')) {
      const updated = categories.filter((c) => c.id !== catId);
      saveCategories(updated);
      setCategories(updated);
    }
  };

  // AGENDA EVENT CRUD
  const handleSaveAgendaEvent = async (eventData: Omit<AgendaEvent, 'id' | 'createdAt'> & { id?: string }) => {
    const targetId = eventData.id || `ev-${Date.now()}`;
    const newEv: AgendaEvent = {
      ...eventData,
      id: targetId,
      createdAt: new Date().toISOString(),
    };
    await upsertAgendaEventToDb(newEv);
    setAgendaEvents((prev) => [newEv, ...prev.filter((e) => e.id !== targetId)]);
  };

  const handleDeleteAgendaEvent = async (eventId: string) => {
    if (window.confirm('Excluir este evento da agenda?')) {
      await deleteAgendaEventFromDb(eventId);
      setAgendaEvents((prev) => prev.filter((e) => e.id !== eventId));
    }
  };

  const handleToggleAgendaEventStatus = async (eventId: string) => {
    const ev = agendaEvents.find((e) => e.id === eventId);
    if (!ev) return;
    const updated: AgendaEvent = {
      ...ev,
      status: ev.status === 'completed' ? 'pending' : 'completed',
    };
    await upsertAgendaEventToDb(updated);
    setAgendaEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
  };

  // Reset Demo & Clear Data
  const handleResetData = () => {
    resetAllDataToDefault();
    setClients(getStoredClients());
    setProjects(getStoredProjects());
    setIncomes(getStoredIncomes());
    setExpenses(getStoredExpenses());
    setSettings(getStoredSettings());
    alert('Dados de demonstração restaurados!');
  };

  const handleClearData = () => {
    clearAllData();
    setClients([]);
    setProjects([]);
    setIncomes([]);
    setExpenses([]);
    setAgendaEvents([]);
    alert('Sistema limpo com sucesso!');
  };

  // Export & Import Backup
  const handleExportData = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gestao_financeira_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string) => {
    if (importBackupData(jsonStr)) {
      setClients(getStoredClients());
      setProjects(getStoredProjects());
      setIncomes(getStoredIncomes());
      setExpenses(getStoredExpenses());
      setSettings(getStoredSettings());
      alert('Backup restaurado com sucesso!');
    }
  };

  // ROUTE GUARD: If user is not authenticated, render LoginView
  if (!userSession) {
    return <LoginView onLoginSuccess={(session) => setUserSession(session)} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Agenda / Calendário', icon: CalendarIcon, badge: agendaEvents.filter((e) => e.status === 'pending').length },
    { id: 'projects', label: 'Projetos', icon: FolderKanban, badge: projects.filter((p) => p.status === 'Em andamento').length },
    { id: 'clients', label: 'Clientes', icon: Users, badge: clients.length },
    { id: 'financial', label: 'Financeiro', icon: DollarSign, badge: incomes.filter((i) => i.status === 'Pendente').length },
    { id: 'categories', label: 'Categorias', icon: Tag },
    { id: 'reports', label: 'Relatórios', icon: PieChart },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Header */}
      <Header
        activeCurrencyFilter={currencyFilter}
        setActiveCurrencyFilter={setCurrencyFilter}
        unreadNotificationsCount={notifications.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        onOpenNewClientModal={() => { setClientToEdit(null); setIsClientModalOpen(true); }}
        onOpenNewProjectModal={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
        onOpenNewIncomeModal={() => { setIncomeToEdit(null); setIsIncomeModalOpen(true); }}
        onOpenNewExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        userSession={userSession}
        onLogout={handleLogout}
      />

      {/* Main App Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-8">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-60 shrink-0">
          <nav className="sticky top-24 space-y-1.5 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 shadow-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigateTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-slate-950 text-emerald-400'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-slate-900 border-r border-slate-800 p-5 h-full flex flex-col z-50">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-white text-base">Menu Principal</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigateTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="mt-auto w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Sistema</span>
              </button>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 min-w-0">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              clients={clients}
              projects={projects}
              incomes={incomes}
              expenses={expenses}
              settings={settings}
              currencyFilter={currencyFilter}
              onNavigateTab={handleNavigateTab}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
              onOpenNewProjectModal={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
              onOpenNewIncomeModal={() => { setIncomeToEdit(null); setIsIncomeModalOpen(true); }}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              agendaEvents={agendaEvents}
              projects={projects}
              incomes={incomes}
              expenses={expenses}
              clients={clients}
              onOpenNewEventModal={() => { setAgendaEventToEdit(null); setIsAgendaModalOpen(true); }}
              onEditEvent={(ev) => { setAgendaEventToEdit(ev); setIsAgendaModalOpen(true); }}
              onDeleteEvent={handleDeleteAgendaEvent}
              onToggleEventStatus={handleToggleAgendaEventStatus}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              clients={clients}
              currencyFilter={currencyFilter}
              initialStatusFilter={tabFilter}
              onOpenNewProjectModal={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
              onEditProject={(p) => { setProjectToEdit(p); setIsProjectModalOpen(true); }}
              onDeleteProject={handleDeleteProject}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              clients={clients}
              projects={projects}
              incomes={incomes}
              currencyFilter={currencyFilter}
              onOpenNewClientModal={() => { setClientToEdit(null); setIsClientModalOpen(true); }}
              onEditClient={(c) => { setClientToEdit(c); setIsClientModalOpen(true); }}
              onDeleteClient={handleDeleteClient}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
            />
          )}

          {activeTab === 'financial' && (
            <FinancialView
              incomes={incomes}
              expenses={expenses}
              clients={clients}
              projects={projects}
              currencyFilter={currencyFilter}
              initialFilter={tabFilter}
              onOpenNewIncomeModal={() => { setIncomeToEdit(null); setIsIncomeModalOpen(true); }}
              onOpenNewExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
              onEditIncome={(inc) => { setIncomeToEdit(inc); setIsIncomeModalOpen(true); }}
              onDeleteIncome={handleDeleteIncome}
              onToggleIncomeStatus={handleToggleIncomeStatus}
              onEditExpense={(exp) => { setExpenseToEdit(exp); setIsExpenseModalOpen(true); }}
              onDeleteExpense={handleDeleteExpense}
              onToggleExpensePaid={handleToggleExpensePaid}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              categories={categories}
              onOpenNewCategoryModal={() => { setCategoryToEdit(null); setIsCategoryModalOpen(true); }}
              onEditCategory={(c) => { setCategoryToEdit(c); setIsCategoryModalOpen(true); }}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              clients={clients}
              projects={projects}
              incomes={incomes}
              expenses={expenses}
              settings={settings}
              currencyFilter={currencyFilter}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={setSettings}
              onResetData={handleResetData}
              onClearData={handleClearData}
              onExportData={handleExportData}
              onImportData={handleImportData}
            />
          )}

        </main>

      </div>

      {/* Drawers & Modals */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        clients={clients}
        projects={projects}
        incomes={incomes}
        onSelectClient={() => handleNavigateTab('clients')}
        onSelectProject={() => handleNavigateTab('projects')}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={clientToEdit}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
        clients={clients}
        defaultCurrency={settings.defaultCurrency}
      />

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSave={handleSaveIncome}
        incomeToEdit={incomeToEdit}
        clients={clients}
        projects={projects}
        defaultCurrency={settings.defaultCurrency}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        defaultCurrency={settings.defaultCurrency}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
      />

      <AgendaModal
        isOpen={isAgendaModalOpen}
        onClose={() => setIsAgendaModalOpen(false)}
        onSave={handleSaveAgendaEvent}
        eventToEdit={agendaEventToEdit}
        clients={clients}
        projects={projects}
      />

    </div>
  );
}
