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
  Handshake,
} from 'lucide-react';
import {
  Client,
  Project,
  ProjectStatus,
  Income,
  Expense,
  CategoryItem,
  AgendaEvent,
  AppSettings,
  CurrencyCode,
  NotificationItem,
  UserSession,
  Partner,
} from './types';
import {
  getStoredClients,
  getStoredProjects,
  getStoredIncomes,
  getStoredExpenses,
  getStoredSettings,
  getStoredPartners,
  getTodayIso,
  addDaysIso,
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
  fetchPartnersFromDb,
  upsertPartnerToDb,
  deletePartnerFromDb,
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
import { PartnersView } from './components/PartnersView';
import { NotificationsModal } from './components/NotificationsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

import { ClientModal } from './components/modals/ClientModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { IncomeModal } from './components/modals/IncomeModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { CategoryModal } from './components/modals/CategoryModal';
import { AgendaModal } from './components/modals/AgendaModal';
import { PartnerModal } from './components/modals/PartnerModal';

export default function App() {
  // Authentication State
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserSession({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Gestor',
          token: session.access_token,
        });
      } else {
        setUserSession(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserSession(null);
    // Clear local cache on logout
    localStorage.removeItem('gfo_clients_v1');
    localStorage.removeItem('gfo_projects_v1');
    localStorage.removeItem('gfo_incomes_v1');
    localStorage.removeItem('gfo_expenses_v1');
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
  const [partners, setPartners] = useState<Partner[]>(getStoredPartners);
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

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerToEdit, setPartnerToEdit] = useState<Partner | null>(null);

  // Fetch initial data from DB and Exchange Rates
  useEffect(() => {
    registerServiceWorker();

    async function loadDbData() {
      const [fetchedClients, fetchedProjects, fetchedIncomes, fetchedExpenses, fetchedEvents, fetchedPartners, rates] = await Promise.all([
        fetchClientsFromDb(),
        fetchProjectsFromDb(),
        fetchIncomesFromDb(),
        fetchExpensesFromDb(),
        fetchAgendaEventsFromDb(),
        fetchPartnersFromDb(),
        fetchLiveExchangeRates(),
      ]);

      // Reconcile and calculate paid amount for each project from linked incomes!
      const reconciledProjects = fetchedProjects.map((proj) => {
        const linkedIncomes = fetchedIncomes.filter((inc) => inc.projectId === proj.id);
        if (linkedIncomes.length > 0) {
          const totalReceived = linkedIncomes
            .filter((inc) => inc.status === 'Recebido')
            .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

          const finalPaid = Math.max(Number(proj.paidAmount) || 0, totalReceived);
          const isFullyPaid = finalPaid >= proj.totalAmount && proj.totalAmount > 0;
          const status: ProjectStatus = isFullyPaid
            ? 'Concluído'
            : (proj.status === 'Concluído' && !isFullyPaid ? 'Em andamento' : proj.status);

          return {
            ...proj,
            paidAmount: finalPaid,
            status,
          };
        }
        return proj;
      });

      // Always use DB data as source of truth
      setClients(fetchedClients);
      setProjects(reconciledProjects);
      setIncomes(fetchedIncomes);
      setExpenses(fetchedExpenses);
      setAgendaEvents(fetchedEvents);
      setPartners(fetchedPartners);

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
            tag: `inc-${inc.id}-${today}`,
          });
        }
      });

      // Check for project deliveries today
      projects.forEach((proj) => {
        if (proj.dueDate === today && proj.status !== 'Concluído') {
          sendWebPushNotification(`📦 Entrega de Projeto Hoje!`, {
            body: `Projeto: ${proj.name} deve ser entregue hoje.`,
            tag: `proj-${proj.id}-${today}`,
          });
        }
      });

      // Check for manual alarms/events today
      agendaEvents.forEach((ev) => {
        if (ev.date === today && ev.status === 'pending' && (ev.notifyPush ?? true)) {
          sendWebPushNotification(`⏰ Alerta de Agenda: ${ev.title}`, {
            body: ev.description || `Evento agendado para hoje.`,
            tag: `ev-${ev.id}-${today}`,
          });
        }
      });
    }, 60000); // Check every 60 seconds
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
    const isNew = !projectData.id;
    const targetId = projectData.id || `proj-${Date.now()}`;
    const newProj: Project = {
      ...projectData,
      id: targetId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await upsertProjectToDb(newProj);
    setProjects((prev) => [newProj, ...prev.filter((p) => p.id !== targetId)]);

    if (isNew) {
      const createdIncomes: Income[] = [];

      // 1. Paid portion (if any)
      if (newProj.paidAmount > 0) {
        const paidInc: Income = {
          id: `inc-paid-${Date.now()}`,
          clientId: newProj.clientId,
          projectId: newProj.id,
          description: `Pagamento Inicial - ${newProj.name}`,
          amount: newProj.paidAmount,
          currency: newProj.currency,
          dueDate: newProj.startDate || new Date().toISOString().split('T')[0],
          receivedDate: newProj.startDate || new Date().toISOString().split('T')[0],
          paymentMethod: 'PIX',
          status: 'Recebido',
          createdAt: new Date().toISOString().split('T')[0],
        };
        await upsertIncomeToDb(paidInc);
        createdIncomes.push(paidInc);
      }

      // 2. Remaining unpaid balance (if any)
      const remainingAmount = newProj.totalAmount - newProj.paidAmount;
      if (remainingAmount > 0) {
        const pendingInc: Income = {
          id: `inc-pend-${Date.now()}`,
          clientId: newProj.clientId,
          projectId: newProj.id,
          description: `Saldo Restante - ${newProj.name}`,
          amount: remainingAmount,
          currency: newProj.currency,
          dueDate: newProj.nextPaymentDate || newProj.dueDate || newProj.startDate || new Date().toISOString().split('T')[0],
          paymentMethod: 'PIX',
          status: 'Pendente',
          createdAt: new Date().toISOString().split('T')[0],
        };
        await upsertIncomeToDb(pendingInc);
        createdIncomes.push(pendingInc);
      }

      if (createdIncomes.length > 0) {
        setIncomes((prev) => [...createdIncomes, ...prev]);
      }
    } else {
      // EDITING EXISTING PROJECT:
      const existingIncomes = incomes.filter((i) => i.projectId === targetId);

      if (existingIncomes.length > 0) {
        if (newProj.paidAmount >= newProj.totalAmount && newProj.totalAmount > 0) {
          const updatedIncomesList: Income[] = [];
          for (const inc of existingIncomes) {
            if (inc.status !== 'Recebido') {
              const upd: Income = {
                ...inc,
                status: 'Recebido',
                receivedDate: inc.receivedDate || new Date().toISOString().split('T')[0],
              };
              await upsertIncomeToDb(upd);
              updatedIncomesList.push(upd);
            }
          }
          if (updatedIncomesList.length > 0) {
            const updatedMap = new Map(updatedIncomesList.map((i) => [i.id, i]));
            setIncomes((prev) => prev.map((i) => updatedMap.get(i.id) || i));
          }
        }
      } else {
        const createdIncomes: Income[] = [];
        if (newProj.paidAmount > 0) {
          const paidInc: Income = {
            id: `inc-paid-${Date.now()}`,
            clientId: newProj.clientId,
            projectId: newProj.id,
            description: `Pagamento - ${newProj.name}`,
            amount: newProj.paidAmount,
            currency: newProj.currency,
            dueDate: newProj.startDate || new Date().toISOString().split('T')[0],
            receivedDate: newProj.startDate || new Date().toISOString().split('T')[0],
            paymentMethod: 'PIX',
            status: 'Recebido',
            createdAt: new Date().toISOString().split('T')[0],
          };
          await upsertIncomeToDb(paidInc);
          createdIncomes.push(paidInc);
        }
        const remainingAmount = newProj.totalAmount - newProj.paidAmount;
        if (remainingAmount > 0) {
          const pendingInc: Income = {
            id: `inc-pend-${Date.now()}`,
            clientId: newProj.clientId,
            projectId: newProj.id,
            description: `Saldo Restante - ${newProj.name}`,
            amount: remainingAmount,
            currency: newProj.currency,
            dueDate: newProj.nextPaymentDate || newProj.dueDate || newProj.startDate || new Date().toISOString().split('T')[0],
            paymentMethod: 'PIX',
            status: 'Pendente',
            createdAt: new Date().toISOString().split('T')[0],
          };
          await upsertIncomeToDb(pendingInc);
          createdIncomes.push(pendingInc);
        }
        if (createdIncomes.length > 0) {
          setIncomes((prev) => [...createdIncomes, ...prev]);
        }
      }
    }
  };

  const handleMarkProjectAsPaid = async (project: Project) => {
    const updatedProj: Project = {
      ...project,
      paidAmount: project.totalAmount,
      status: 'Concluído',
    };
    await upsertProjectToDb(updatedProj);
    setProjects((prev) => prev.map((p) => (p.id === project.id ? updatedProj : p)));

    const linkedIncomes = incomes.filter((i) => i.projectId === project.id);
    if (linkedIncomes.length > 0) {
      const updatedIncomesList: Income[] = [];
      for (const inc of linkedIncomes) {
        const upd: Income = {
          ...inc,
          status: 'Recebido',
          receivedDate: inc.receivedDate || new Date().toISOString().split('T')[0],
        };
        await upsertIncomeToDb(upd);
        updatedIncomesList.push(upd);
      }
      const updatedMap = new Map(updatedIncomesList.map((i) => [i.id, i]));
      setIncomes((prev) => prev.map((i) => updatedMap.get(i.id) || i));
    } else {
      const newInc: Income = {
        id: `inc-paid-${Date.now()}`,
        clientId: project.clientId,
        projectId: project.id,
        description: `Pagamento Total - ${project.name}`,
        amount: project.totalAmount,
        currency: project.currency,
        dueDate: project.startDate || new Date().toISOString().split('T')[0],
        receivedDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'PIX',
        status: 'Recebido',
        createdAt: new Date().toISOString().split('T')[0],
      };
      await upsertIncomeToDb(newInc);
      setIncomes((prev) => [newInc, ...prev]);
    }
  };

  // PROJECT HELPER: Sync project paid amount and completion status from linked incomes
  const syncProjectPaidAmountFromIncomes = async (
    targetProjectId: string,
    currentIncomes: Income[],
    currentProjects: Project[]
  ) => {
    const proj = currentProjects.find((p) => p.id === targetProjectId);
    if (!proj) return;

    const totalReceived = currentIncomes
      .filter((i) => i.projectId === targetProjectId && i.status === 'Recebido')
      .reduce((sum, i) => sum + i.amount, 0);

    const isFullyPaidNow = totalReceived >= proj.totalAmount && proj.totalAmount > 0;
    const updatedStatus: ProjectStatus = isFullyPaidNow ? 'Concluído' : (proj.status === 'Concluído' && !isFullyPaidNow ? 'Em andamento' : proj.status);

    if (proj.paidAmount !== totalReceived || proj.status !== updatedStatus) {
      const updatedProj: Project = {
        ...proj,
        paidAmount: totalReceived,
        status: updatedStatus,
      };
      await upsertProjectToDb(updatedProj);
      setProjects((prev) => prev.map((p) => (p.id === targetProjectId ? updatedProj : p)));
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

  const handleDuplicateProject = (project: Project) => {
    const today = getTodayIso();
    const next15 = addDaysIso(15);
    const duplicated: Project = {
      ...project,
      id: '', // Empty ID so modal treats it as NEW project
      name: `${project.name} (Novo Mês)`,
      paidAmount: 0,
      startDate: today,
      dueDate: next15,
      nextPaymentDate: next15,
      status: 'Em andamento',
      rating: 0,
      createdAt: today,
    };
    setProjectToEdit(duplicated);
    setIsProjectModalOpen(true);
  };

  const handleRateProject = async (project: Project, rating: number) => {
    const updated: Project = { ...project, rating };
    await upsertProjectToDb(updated);
    setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
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
    const updatedIncomes = [newInc, ...incomes.filter((i) => i.id !== targetId)];
    setIncomes(updatedIncomes);

    // Auto-sync linked project
    if (newInc.projectId) {
      await syncProjectPaidAmountFromIncomes(newInc.projectId, updatedIncomes, projects);
    }
    // Also sync old project if projectId changed
    const oldIncome = incomes.find((i) => i.id === targetId);
    if (oldIncome?.projectId && oldIncome.projectId !== newInc.projectId) {
      await syncProjectPaidAmountFromIncomes(oldIncome.projectId, updatedIncomes, projects);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    const targetInc = incomes.find((i) => i.id === incomeId);
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      await deleteIncomeFromDb(incomeId);
      const updatedIncomes = incomes.filter((i) => i.id !== incomeId);
      setIncomes(updatedIncomes);
      if (targetInc?.projectId) {
        await syncProjectPaidAmountFromIncomes(targetInc.projectId, updatedIncomes, projects);
      }
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
    const updatedIncomes = incomes.map((i) => (i.id === income.id ? updated : i));
    setIncomes(updatedIncomes);
    if (updated.projectId) {
      await syncProjectPaidAmountFromIncomes(updated.projectId, updatedIncomes, projects);
    }
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

  // Clear local cache only
  const handleResetData = () => {
    if (window.confirm('Limpar cache local e recarregar dados do banco?')) {
      clearAllData();
      window.location.reload();
    }
  };

  const handleClearData = () => {
    if (window.confirm('Tem certeza que deseja limpar o cache local? Os dados no banco de dados não serão apagados.')) {
      clearAllData();
      setClients([]);
      setProjects([]);
      setIncomes([]);
      setExpenses([]);
      setAgendaEvents([]);
    }
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

  // PARTNER CRUD
  const handleSavePartner = async (partnerData: Omit<Partner, 'id' | 'createdAt'> & { id?: string }) => {
    const targetId = partnerData.id || `part-${Date.now()}`;
    const newPartner: Partner = {
      ...partnerData,
      id: targetId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await upsertPartnerToDb(newPartner);
    setPartners((prev) => [newPartner, ...prev.filter((p) => p.id !== targetId)]);
  };

  const handleDeletePartner = async (partnerId: string) => {
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) return;
    if (window.confirm(`Tem certeza que deseja excluir o parceiro "${partner.name}"?`)) {
      await deletePartnerFromDb(partnerId);
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    }
  };

  // ROUTE GUARD: Wait for auth check, then redirect if unauthenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#000000] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#747878] text-sm font-normal">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return <LoginView onLoginSuccess={(session) => setUserSession(session)} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Painel Financeiro', icon: LayoutDashboard },
    { id: 'calendar', label: 'Agenda & Prazos', icon: CalendarIcon, badge: agendaEvents.filter((e) => e.status === 'pending').length },
    { id: 'projects', label: 'Projetos & Operações', icon: FolderKanban, badge: projects.filter((p) => p.status === 'Em andamento').length },
    { id: 'clients', label: 'Clientes & Contas', icon: Users, badge: clients.length },
    { id: 'financial', label: 'Transações Financeiras', icon: DollarSign, badge: incomes.filter((i) => i.status === 'Pendente').length },
    { id: 'partners', label: 'Gestão de Parceiros', icon: Handshake, badge: partners.length },
    { id: 'categories', label: 'Categorias', icon: Tag },
    { id: 'reports', label: 'Relatórios Gerenciais', icon: PieChart },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fcf8f8] text-[#1c1b1b] flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
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
        onOpenNewPartnerModal={() => { setPartnerToEdit(null); setIsPartnerModalOpen(true); }}
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        userSession={userSession}
        onLogout={handleLogout}
      />

      {/* Main App Container */}
      <div className="flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-20 space-y-0.5 bg-white p-3 rounded-[22px] border border-[#c4c7c7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-[#747878] uppercase mb-1">
              Menu Principal
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigateTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#000000] text-white'
                      : 'text-[#444747] hover:text-[#1c1b1b] hover:bg-[#f1edec]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#747878]'}`} strokeWidth={1.5} />
                    <span className={`font-medium text-[13px] ${isActive ? '' : ''}`}>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#e5e2e1] text-[#444747]'
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-white border-r border-[#c4c7c7]/40 p-5 h-full flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#c4c7c7]/40">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#000000] flex items-center justify-center text-white shrink-0">
                    <span className="text-sm font-semibold">G</span>
                  </div>
                  <span className="font-semibold text-[#1c1b1b] text-base">Gestão<span className="text-[#0050d7]">FO</span></span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              <nav className="space-y-0.5 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigateTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#000000] text-white'
                          : 'text-[#444747] hover:text-[#1c1b1b] hover:bg-[#f1edec]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#747878]'}`} strokeWidth={1.5} />
                        <span className="font-medium text-[13px]">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-[#e5e2e1] text-[#444747]'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="mt-auto w-full flex items-center justify-center space-x-2 py-2.5 rounded-full bg-[#ffdad6] text-[#93000a] text-sm font-medium hover:opacity-85 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
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
              onOpenNewExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
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
              onDuplicateProject={handleDuplicateProject}
              onRateProject={handleRateProject}
              onDeleteProject={handleDeleteProject}
              onMarkProjectAsPaid={handleMarkProjectAsPaid}
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

          {activeTab === 'partners' && (
            <PartnersView
              partners={partners}
              projects={projects}
              settings={settings}
              currencyFilter={currencyFilter}
              onOpenNewPartnerModal={() => { setPartnerToEdit(null); setIsPartnerModalOpen(true); }}
              onEditPartner={(partner) => { setPartnerToEdit(partner); setIsPartnerModalOpen(true); }}
              onDeletePartner={handleDeletePartner}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
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
        partners={partners}
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
        partners={partners}
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

      <PartnerModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSave={handleSavePartner}
        partnerToEdit={partnerToEdit}
      />

    </div>
  );
}
