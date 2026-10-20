import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { confirmAction, toast } from './lib/feedback';
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
  CheckSquare,
  UserCog,
  History,
  FileText,
  ChevronLeft,
  ChevronRight,
  Lock,
  Zap,
  Globe,
  BookOpen,
  Sun,
  Moon,
  RefreshCw,
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
  Partner,
  CashReserve,
} from './types';
import {
  UserProfile,
  Task,
  TaskStatus,
  UserRole,
  PermissionScope,
  BillingRequest,
  ROLE_LABELS,
} from './types/rbac';
import {
  getStoredClients,
  saveClients,
  getStoredProjects,
  saveProjects,
  getStoredIncomes,
  saveIncomes,
  getStoredExpenses,
  saveExpenses,
  getStoredSettings,
  saveSettings,
  getStoredPartners,
  savePartners,
  getStoredTasks,
  saveTasks,
  getTodayIso,
  addDaysIso,
  clearAllData,
  exportBackupData,
  importBackupData,
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
  fetchCashReservesFromDb,
  upsertCashReserveToDb,
  upsertPartnerToDb,
  deletePartnerFromDb,
  fetchCompanyUsers,
  createCompanyUser,
  updateUserProfile,
  updateUserStatus,
  fetchUserPermissions,
  setUserPermissions,
  fetchTasks,
  upsertTask,
  updateTaskStatus,
  deleteTask,
  assumeAvailableProject,
  fetchBillingRequests,
  createBillingRequest,
  reviewBillingRequest,
  deleteBillingRequest,
  fetchNotificationsFromDb,
  markNotificationAsReadInDb,
  deleteNotificationFromDb,
  fetchCategoriesFromDb,
  upsertCategoryToDb,
  deleteCategoryFromDb,
  fetchSettingsFromDb,
  upsertSettingsToDb,
  DEFAULT_CATEGORIES,
} from './lib/db';
import { fetchLiveExchangeRates } from './lib/exchange';
import {
  registerServiceWorker,
  startBackgroundNotificationCheck,
  sendWebPushNotification,
} from './lib/webpush';
import { supabase } from './lib/supabase';
import { computeNotifications } from './lib/notifications';
import { logAction } from './lib/audit';
import { checkFinancialIntegrity } from './lib/integrity';
import { formatCurrency } from './lib/formatters';
import { reconcileProjectWithIncomes, buildSettlementIncomes, paymentDeltaIncome } from './lib/finance/projectPayments';
import { buildPartnerDistribution } from './lib/finance/cashPosition';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { EmailAttachment } from './types/email';
import {
  sendClientPaymentReminderEmail,
  sendClientReceiptEmail,
  sendEmployeeWelcomeEmail,
  sendEmployeeProjectAssignedEmail,
  sendEmployeeTaskAssignedEmail,
  sendAdminBillingRequestEmail,
  sendEmployeeBillingStatusEmail,
} from './lib/emailTemplates';

import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { AppSidebar } from './components/shell/AppSidebar';
import { useHideOnScroll } from './components/shell/useHideOnScroll';
import { MobileNav } from './components/shell/MobileNav';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { ProjectsView } from './components/ProjectsView';
import { TasksView } from './components/TasksView';
import { BillingRequestsView } from './components/BillingRequestsView';
import { ClientsView } from './components/ClientsView';
import { FinancialView } from './components/FinancialView';
import { CategoriesView } from './components/CategoriesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PartnersView } from './components/PartnersView';
import { UsersView } from './components/UsersView';
import { AuditLogView } from './components/AuditLogView';
import { NotificationsModal } from './components/NotificationsModal';

const getStoredDismissedNotifs = (): string[] => {
  try {
    const raw = localStorage.getItem('gestao_dismissed_notifications');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredDismissedNotifs = (ids: string[]) => {
  try {
    localStorage.setItem('gestao_dismissed_notifications', JSON.stringify(ids));
  } catch (e) {
    console.warn('Failed to save dismissed notifications:', e);
  }
};
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SendEmailModal } from './components/modals/SendEmailModal';
import { StripeInvoiceModal } from './components/modals/StripeInvoiceModal';

import { ClientModal } from './components/modals/ClientModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { TaskModal } from './components/modals/TaskModal';
import { BillingRequestModal } from './components/modals/BillingRequestModal';
import { IncomeModal } from './components/modals/IncomeModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { CategoryModal } from './components/modals/CategoryModal';
import { AgendaModal } from './components/modals/AgendaModal';
import { PartnerModal } from './components/modals/PartnerModal';
import { UserModal } from './components/modals/UserModal';
import { UserPermissionsModal } from './components/modals/UserPermissionsModal';
import { useLanguage } from './contexts/LanguageContext';
import { APP_CONFIG } from './config/app';

export default function App() {
  const { lang, setLang, t, toggleLang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const {
    userSession,
    userProfile,
    authLoading,
    isOwner,
    isAdmin,
    isEmployee,
    hasPermission,
    visibleTabs,
    login,
    logout,
    refreshProfile,
  } = useAuth();

  // Sync system language with userProfile language preference
  useEffect(() => {
    if (userProfile?.language && userProfile.language !== lang) {
      setLang(userProfile.language);
    }
  }, [userProfile?.language, lang, setLang]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [tabFilter, setTabFilter] = useState<string | undefined>(undefined);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gestao_sidebar_collapsed') === 'true';
    } catch {}
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gestao_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Barra superior: esconde ao descer, reaparece ao subir
  const { slotRef: headerSlotRef, onScroll: onMainScroll, reveal: revealHeader } = useHideOnScroll();
  // Cada módulo abre no topo, com a barra visível
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    revealHeader();
  }, [activeTab, revealHeader]);

  // Global Currency Filter
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyCode | 'ALL'>('ALL');

  // Core Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(() => getStoredCategories());
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [cashReserves, setCashReserves] = useState<CashReserve[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());

  // RBAC Data State
  const [companyUsers, setCompanyUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>(() => getStoredTasks());
  const [billingRequests, setBillingRequests] = useState<BillingRequest[]>([]);

  // Modals & Drawers State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingRequestToReview, setBillingRequestToReview] = useState<BillingRequest | null>(null);

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

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  const [isUserPermsModalOpen, setIsUserPermsModalOpen] = useState(false);
  const [userForPerms, setUserForPerms] = useState<UserProfile | null>(null);
  const [userPermsList, setUserPermsList] = useState<
    Array<{ permissionId: string; scope: PermissionScope; granted: boolean }>
  >([]);
  const [isDataSyncing, setIsDataSyncing] = useState(false);
  const [integrityWarnings, setIntegrityWarnings] = useState<string[]>([]);
  const [isIntegrityDismissed, setIsIntegrityDismissed] = useState(false);

  // Direct Resend Email Modal State
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [emailModalProps, setEmailModalProps] = useState<{
    recipientEmail?: string;
    recipientName?: string;
    subject?: string;
    message?: string;
    attachments?: EmailAttachment[];
  }>({});

  const handleOpenSendEmailModal = (props: {
    recipientEmail?: string;
    recipientName?: string;
    subject?: string;
    message?: string;
    attachments?: EmailAttachment[];
  }) => {
    setEmailModalProps(props);
    setIsSendEmailModalOpen(true);
  };


  const [dbNotifications, setDbNotifications] = useState<NotificationItem[]>([]);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => getStoredDismissedNotifs());

  const handleMarkNotificationAsRead = async (notifId: string) => {
    setDismissedNotifIds((prev) => {
      const next = Array.from(new Set([...prev, notifId]));
      saveStoredDismissedNotifs(next);
      return next;
    });
    setDbNotifications((prev) => prev.filter((n) => n.id !== notifId));
    await markNotificationAsReadInDb(notifId);
  };

  const handleMarkAllNotificationsAsRead = async () => {
    const computedNotifs = computeNotifications(clients, projects, incomes, expenses, lang);
    const combined = [...dbNotifications, ...computedNotifs];
    const allIds = combined.map((n) => n.id);

    setDismissedNotifIds(allIds);
    saveStoredDismissedNotifs(allIds);

    for (const n of dbNotifications) {
      await markNotificationAsReadInDb(n.id);
    }
    setDbNotifications([]);
  };

  // Active Computed & Database Notifications (filtered by non-dismissed & unread)
  const notifications: NotificationItem[] = useMemo(() => {
    const computedNotifs = computeNotifications(clients, projects, incomes, expenses, lang);
    const combined = [...dbNotifications, ...computedNotifs];
    return combined.filter((n) => !dismissedNotifIds.includes(n.id) && !n.read);
  }, [clients, projects, incomes, expenses, dbNotifications, dismissedNotifIds, lang]);

  // ------------------------------------------------------------------
  // Initial Data Fetch & Synchronization
  // ------------------------------------------------------------------
  // Faturas Stripe para clientes (só no sistema interno)
  const [isStripeInvoiceModalOpen, setIsStripeInvoiceModalOpen] = useState(false);
  const [projectForStripeInvoice, setProjectForStripeInvoice] = useState<Project | null>(null);

  const handleOpenStripeInvoiceModal = (p: Project) => {
    setProjectForStripeInvoice(p);
    setIsStripeInvoiceModalOpen(true);
  };

  const loadDbData = useCallback(async () => {
    setIsDataSyncing(true);
    try {
      registerServiceWorker();

      const cid = userProfile?.companyId;

      const [dbClients, dbProjects, dbIncomes, dbExpenses, dbEvents, dbPartners, liveRates, dbNotifs, dbCategories, dbSettings] =
        await Promise.all([
          fetchClientsFromDb(cid),
          fetchProjectsFromDb(cid),
          fetchIncomesFromDb(cid),
          fetchExpensesFromDb(cid),
          fetchAgendaEventsFromDb(cid),
          fetchPartnersFromDb(cid),
          fetchLiveExchangeRates(),
          fetchNotificationsFromDb(cid),
          cid ? fetchCategoriesFromDb(cid) : Promise.resolve([]),
          cid ? fetchSettingsFromDb(cid) : Promise.resolve(null),
        ]);

      if (dbClients) setClients(dbClients);
      if (dbIncomes) setIncomes(dbIncomes);
      if (dbExpenses) setExpenses(dbExpenses);
      if (dbEvents) setAgendaEvents(dbEvents);
      if (dbPartners) setPartners(dbPartners);
      if (dbNotifs) setDbNotifications(dbNotifs);
      if (cid) {
        const dbReserves = await fetchCashReservesFromDb(cid);
        if (dbReserves) setCashReserves(dbReserves);
      }

      // Sync categories from Supabase if available, otherwise keep localStorage
      if (dbCategories && dbCategories.length > 0) {
        const catMap = new Map(DEFAULT_CATEGORIES.filter((c) => c?.name).map((c) => [c.name.toLowerCase(), c]));
        dbCategories.filter((c) => c?.name).forEach((c) => catMap.set(c.name.toLowerCase(), c));
        const mergedCategories = Array.from(catMap.values());
        setCategories(mergedCategories);
        saveCategories(mergedCategories);
      }

      // Sync settings from Supabase if available
      if (dbSettings) {
        setSettings((prev) => {
          const merged = { ...prev, ...dbSettings };
          saveSettings(merged);
          return merged;
        });
      }

      // Só o valor pago acompanha as receitas recebidas. O estado e o valor do contrato ficam
      // como foram gravados: pagar tudo à cabeça não conclui um projeto que ainda está a decorrer.
      if (dbProjects && dbIncomes) {
        setProjects(dbProjects.map((p) => reconcileProjectWithIncomes(p, dbIncomes)));
      } else if (dbProjects) {
        setProjects(dbProjects);
      }

      if (liveRates) {
        setSettings((prev) => {
          const updated = {
            ...prev,
            exchangeRates: {
              ...prev.exchangeRates,
              AOA: liveRates.AOA,
              USD: liveRates.USD,
              EUR: liveRates.EUR,
            },
          };
          saveSettings(updated);
          return updated;
        });
      }

      // If user has companyId, fetch company users, tasks and billing requests
      if (userProfile?.companyId) {
        const [usersData, tasksData, billingData] = await Promise.all([
          fetchCompanyUsers(userProfile.companyId),
          fetchTasks(userProfile.companyId),
          fetchBillingRequests(userProfile.companyId, userProfile.id, isOwner || isAdmin),
        ]);
        if (usersData) setCompanyUsers(usersData);
        if (tasksData && tasksData.length > 0) {
          setTasks(tasksData);
          saveTasks(tasksData);
        }
        if (billingData) setBillingRequests(billingData);
      }

      // Run financial integrity check with freshly loaded data
      const freshIncomes  = dbIncomes  || [];
      const freshExpenses = dbExpenses || [];
      const freshProjects = (dbProjects || []).map((p) => reconcileProjectWithIncomes(p, freshIncomes));
      const integrityResult = checkFinancialIntegrity(
        freshIncomes,
        freshExpenses,
        freshProjects,
        settings.defaultCurrency,
        lang
      );
      if (!isIntegrityDismissed) {
        setIntegrityWarnings(integrityResult.warnings);
      }
      if (!integrityResult.isValid) {
        console.warn('[Integrity] Avisos de integridade financeira:', integrityResult.warnings);
      }
    } catch (err) {
      console.warn('Failed to sync data with Supabase on load:', err);
    } finally {
      setIsDataSyncing(false);
    }
  }, [userProfile?.companyId, userProfile?.id, isOwner, isAdmin, isIntegrityDismissed]);

  useEffect(() => {
    if (userSession) {
      loadDbData();
    }
  }, [userSession, userProfile?.companyId, loadDbData]);

  const handleStripeInvoiceCreated = (
    incomeId: string,
    stripeData: {
      stripeInvoiceId: string;
      stripeInvoiceUrl: string;
      stripeInvoicePdf: string;
      stripeCustomerId: string;
      stripeStatus: Income['stripeStatus'];
    }
  ) => {
    setIncomes((prev) => prev.map((inc) => (inc.id === incomeId ? { ...inc, ...stripeData } : inc)));
    loadDbData();
  };

  // Re-run integrity check when language changes so warnings match selected language
  useEffect(() => {
    if (!isIntegrityDismissed && (incomes.length > 0 || expenses.length > 0 || projects.length > 0)) {
      const integrityResult = checkFinancialIntegrity(
        incomes,
        expenses,
        projects,
        settings.defaultCurrency,
        lang
      );
      setIntegrityWarnings(integrityResult.warnings);
    }
  }, [lang, settings.defaultCurrency, incomes, expenses, projects, isIntegrityDismissed]);

  // Realtime Supabase Subscription for instant landing page leads & notifications
  // Eventos em tempo real chegam em rajadas (cada gravação gera um ou mais). Recarregar a
  // cada um, a meio de uma gravação em várias etapas, substituía o estado por dados
  // incompletos. Agrupamos e recarregamos uma vez, depois de a rajada acalmar.
  const loadDbDataRef = useRef(loadDbData);
  loadDbDataRef.current = loadDbData;
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      reloadTimerRef.current = null;
      loadDbDataRef.current();
    }, 1500);
  }, []);
  useEffect(() => () => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
  }, []);

  useEffect(() => {
    if (!userSession) return;

    // Gracefully ask for browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const playNotificationSound = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch {
        // audio context not allowed yet
      }
    };

    const channel = supabase
      .channel('realtime_landing_leads_and_notifs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clients' },
        (payload: any) => {
          console.log('[Realtime] Novo cliente recebido da Landing Page:', payload);
          scheduleReload();
          playNotificationSound();

          const clientName = payload.new?.name || 'Cliente';
          const clientType = payload.new?.type || 'Serviço';
          sendWebPushNotification(`Novo Lead na Landing Page: ${clientName}`, {
            body: `Solicitou [${clientType}]. WhatsApp: ${payload.new?.whatsapp || 'Disponível'}`,
            tag: `client-${payload.new?.id || Date.now()}`,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          console.log('[Realtime] Nova notificação recebida:', payload);
          scheduleReload();
          playNotificationSound();

          sendWebPushNotification(payload.new?.title || 'Notificação do Sistema', {
            body: payload.new?.message || 'Nova notificação recebida da Landing Page.',
            tag: `notif-${payload.new?.id || Date.now()}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userSession, scheduleReload]);

  // Background Push Notification Poller
  useEffect(() => {
    if (!userSession) return;
    startBackgroundNotificationCheck(() => {
      // Check overdue invoices & events and notify if needed
    }, 60000);
  }, [userSession]);

  // Realtime subscription for automatic Stripe webhook & database updates
  useEffect(() => {
    if (!userSession || !userProfile?.companyId) return;

    const channel = supabase
      .channel('stripe-db-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incomes', filter: `company_id=eq.${userProfile.companyId}` },
        scheduleReload
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `company_id=eq.${userProfile.companyId}` },
        scheduleReload
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles', filter: `company_id=eq.${userProfile.companyId}` },
        async () => {
          if (userProfile?.companyId) {
            const freshUsers = await fetchCompanyUsers(userProfile.companyId);
            setCompanyUsers(freshUsers);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userSession, userProfile?.companyId, scheduleReload]);

  // Adjust activeTab if current tab is not in visibleTabs
  useEffect(() => {
    if (activeTab === 'landing') return;
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0] || 'dashboard');
    }
  }, [visibleTabs, activeTab]);

  // ------------------------------------------------------------------
  // Tab Navigation Handler
  // ------------------------------------------------------------------
  const handleNavigateTab = (tab: string, filter?: string) => {
    setActiveTab(tab);
    setTabFilter(filter);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWhatsAppCharge = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // ------------------------------------------------------------------
  // CRUD Handlers: Clients
  // ------------------------------------------------------------------
  const handleSaveClient = async (
    clientData: Omit<Client, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const isNew = !clientData.id;
    const clientId = clientData.id || `cli-${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id: clientId,
      createdAt: isNew ? getTodayIso() : (clients.find((c) => c.id === clientId)?.createdAt || getTodayIso()),
    };

    if (userProfile?.companyId) {
      const result = await upsertClientToDb(newClient, userProfile.companyId);
      if (!result.success) {
        console.error('[App] handleSaveClient failed:', result.error);
        toast({ tone: 'danger', title: 'Não foi possível guardar o cliente', description: result.error || 'Verifique a ligação à internet e tente novamente.' });
        return;
      }
    }

    const updated = isNew
      ? [newClient, ...clients]
      : clients.map((c) => (c.id === clientId ? newClient : c));
    setClients(updated);
    saveClients(updated);

    if (userProfile) {
      logAction({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userName: userProfile.name,
        userRole: userProfile.role,
        action: isNew ? 'client.create' : 'client.edit',
        resourceType: 'client',
        resourceId: clientId,
      });
    }
  };


  const handleDeleteClient = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    // Um cliente com contratos ou receitas faz parte do histórico financeiro: apagá-lo
    // deixava projetos e receitas sem dono e os relatórios por cliente deixavam de os contar.
    const linkedProjects = projects.filter((p) => p.clientId === clientId || p.clientIds?.includes(clientId));
    const linkedIncomes = incomes.filter((i) => i.clientId === clientId);
    if (linkedProjects.length > 0 || linkedIncomes.length > 0) {
      toast({
        tone: 'warning',
        title: `"${client.name}" tem histórico e não pode ser eliminado`,
        description: `${linkedProjects.length} projeto(s) e ${linkedIncomes.length} receita(s) dependem deste cliente. Para encerrar a relação, marque os projetos como "Concluído" ou "Cancelado".`,
      });
      return;
    }

    if (await confirmAction({ title: `Eliminar o cliente "${client.name}"?`, description: 'Este cliente não tem projetos nem receitas.', confirmLabel: 'Eliminar cliente', danger: true })) {
      const result = await deleteClientFromDb(clientId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível eliminar o cliente', description: result.error });
        return;
      }
      const updatedClients = clients.filter((c) => c.id !== clientId);
      setClients(updatedClients);
      saveClients(updatedClients);

      if (userProfile) {
        logAction({
          companyId: userProfile.companyId,
          userId: userProfile.id,
          userName: userProfile.name,
          userRole: userProfile.role,
          action: 'client.delete',
          resourceType: 'client',
          resourceId: clientId,
        });
      }
    }
  };

  // ------------------------------------------------------------------
  // CRUD Handlers: Projects
  // ------------------------------------------------------------------
  // Grava primeiro no servidor; o ecrã só muda depois de confirmado.
  const persistProjectChange = async (updatedProject: Project): Promise<boolean> => {
    if (userProfile?.companyId) {
      const result = await upsertProjectToDb(updatedProject, userProfile.companyId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível atualizar o projeto', description: result.error || 'Tente novamente.' });
        return false;
      }
    }
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      saveProjects(next);
      return next;
    });
    return true;
  };

  const syncProjectPaidAmountFromIncomes = async (
    targetProjectId: string,
    currentIncomes: Income[],
    currentProjects: Project[]
  ) => {
    const project = currentProjects.find((p) => p.id === targetProjectId);
    if (!project) return;

    const updatedProject = reconcileProjectWithIncomes(project, currentIncomes);
    if (updatedProject !== project) {
      await persistProjectChange(updatedProject);
    }
  };

  const recordProjectIncomes = async (newIncomes: Income[], context: string) => {
    const saved: Income[] = [];
    for (const inc of newIncomes) {
      if (userProfile?.companyId) {
        const result = await upsertIncomeToDb(inc, userProfile.companyId);
        if (!result.success) {
          toast({ tone: 'danger', title: `${context} a receita "${inc.description}" não foi registada`, description: `${result.error || ''} Registe-a no Financeiro.`.trim() });
          continue;
        }
      }
      saved.push(inc);
    }
    if (saved.length > 0) {
      setIncomes((prev) => {
        const next = [...saved, ...prev];
        saveIncomes(next);
        return next;
      });
    }
  };

  const handleSaveProject = async (
    projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const isNew = !projectData.id;
    const projectId = projectData.id || `proj-${Date.now()}`;
    const newProject: Project = {
      ...projectData,
      id: projectId,
      createdAt: isNew
        ? getTodayIso()
        : (projects.find((p) => p.id === projectId)?.createdAt || getTodayIso()),
    };

    if (userProfile?.companyId) {
      const result = await upsertProjectToDb(newProject, userProfile.companyId);
      if (!result.success) {
        console.error('[App] handleSaveProject failed:', result.error);
        toast({ tone: 'danger', title: 'Não foi possível guardar o projeto', description: result.error || 'Verifique a ligação à internet e tente novamente.' });
        return;
      }
    }

    const updatedProjects = isNew
      ? [newProject, ...projects]
      : projects.map((p) => (p.id === projectId ? newProject : p));
    setProjects(updatedProjects);
    saveProjects(updatedProjects);

    if (isNew) {
      const initialIncomes: Income[] = [];

      if (newProject.paidAmount > 0) {
        const paidIncome: Income = {
          id: `inc-${Date.now()}-1`,
          clientId: newProject.clientId,
          projectId: newProject.id,
          description: `Entrada / Sinal - ${newProject.name}`,
          amount: newProject.paidAmount,
          currency: newProject.currency,
          dueDate: newProject.startDate,
          receivedDate: newProject.startDate,
          status: 'Recebido',
          paymentMethod: 'Transferência',
          createdAt: getTodayIso(),
        };
        initialIncomes.push(paidIncome);
      }

      const remainingAmount = newProject.totalAmount - newProject.paidAmount;
      if (remainingAmount > 0) {
        const pendingIncome: Income = {
          id: `inc-${Date.now()}-2`,
          clientId: newProject.clientId,
          projectId: newProject.id,
          description: `Saldo Restante - ${newProject.name}`,
          amount: remainingAmount,
          currency: newProject.currency,
          dueDate: newProject.nextPaymentDate || newProject.dueDate || newProject.startDate || getTodayIso(),
          status: 'Pendente',
          paymentMethod: 'Transferência',
          createdAt: getTodayIso(),
        };
        initialIncomes.push(pendingIncome);
      }

      await recordProjectIncomes(initialIncomes, 'O projeto foi guardado, mas');
    } else {
      // Aumentar o "valor pago" de um projeto existente é um pagamento recebido: regista-o no
      // financeiro. Antes ficava só no projeto e o saldo em caixa nunca o via.
      const payment = paymentDeltaIncome(projects.find((p) => p.id === projectId), newProject, getTodayIso(), `inc-${Date.now()}-p`);
      if (payment) {
        await recordProjectIncomes([payment], 'O projeto foi guardado, mas');
      }
    }

    if (userProfile) {
      logAction({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userName: userProfile.name,
        userRole: userProfile.role,
        action: isNew ? 'project.create' : 'project.edit',
        resourceType: 'project',
        resourceId: projectId,
      });
    }

    if (newProject.assignmentType === 'employee' && newProject.assignedTo) {
      const assignedEmployee = companyUsers.find((u) => u.id === newProject.assignedTo);
      if (assignedEmployee?.email) {
        const client = clients.find((c) => c.id === newProject.clientId);
        sendEmployeeProjectAssignedEmail({
          employeeEmail: assignedEmployee.email,
          employeeName: assignedEmployee?.name || 'Colaborador',
          projectName: newProject?.name || 'Projeto',
          clientName: client?.name || 'Cliente',
          dueDate: newProject.dueDate,
        }).catch((err) => console.warn('[Resend] Project assign email failed:', err));
      }
    }
  };

  // Quitar um contrato regista o dinheiro no financeiro: as receitas pendentes passam a
  // "Recebido" e, se não cobrirem o valor total, é criada uma receita com a diferença.
  // O estado do projeto não muda: o trabalho segue até ser entregue.
  const handleMarkProjectAsPaid = async (project: Project) => {
    const pending = project.totalAmount - project.paidAmount;
    const ok = await confirmAction({
      title: `Registar o recebimento de ${formatCurrency(pending, project.currency)}?`,
      description: `As receitas pendentes de "${project.name}" passam a "Recebido" e a diferença em falta é registada hoje. O estado do projeto não muda.`,
      confirmLabel: 'Registar recebimento',
    });
    if (!ok) return;

    const companyId = userProfile?.companyId;
    const changedIncomes = buildSettlementIncomes(project, incomes, getTodayIso(), `inc-${Date.now()}-q`);

    if (companyId) {
      for (const inc of changedIncomes) {
        const result = await upsertIncomeToDb(inc, companyId);
        if (!result.success) {
          toast({ tone: 'danger', title: `Não foi possível registar "${inc.description}"`, description: result.error });
          await loadDbData();
          return;
        }
      }
    }

    const changedById = new Map(changedIncomes.map((i) => [i.id, i]));
    const nextIncomes = [
      ...changedIncomes.filter((i) => !incomes.some((existing) => existing.id === i.id)),
      ...incomes.map((i) => changedById.get(i.id) || i),
    ];
    setIncomes(nextIncomes);
    saveIncomes(nextIncomes);

    await persistProjectChange({ ...project, paidAmount: project.totalAmount });
    toast({ tone: 'success', title: 'Recebimento registado', description: `${formatCurrency(pending, project.currency)} de "${project.name}".` });
  };

  const handleDuplicateProject = (project: Project) => {
    const duplicated: Project = {
      ...project,
      id: '',
      name: `${project.name} (Novo Mês)`,
      startDate: getTodayIso(),
      dueDate: addDaysIso(30),
      nextPaymentDate: addDaysIso(30),
      paidAmount: 0,
      status: 'Em andamento',
      createdAt: getTodayIso(),
    };
    setProjectToEdit(duplicated);
    setIsProjectModalOpen(true);
  };

  const handleRateProject = async (project: Project, rating: number) => {
    await persistProjectChange({ ...project, rating });
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    // Apagar um contrato com receitas desligava-as do projeto (e as tarefas eram apagadas em
    // cascata), por isso o histórico do contrato "desaparecia". Encerrar preserva tudo.
    const linkedIncomes = incomes.filter((i) => i.projectId === projectId);
    if (linkedIncomes.length > 0) {
      const closeInstead = await confirmAction({
        title: `"${project.name}" tem ${linkedIncomes.length} receita(s) e não pode ser eliminado`,
        description: 'Quer encerrá-lo como "Concluído"? O histórico financeiro e os relatórios ficam intactos.',
        confirmLabel: 'Marcar como Concluído',
      });
      if (closeInstead && project.status !== 'Concluído') {
        await persistProjectChange({ ...project, status: 'Concluído' });
      }
      return;
    }

    if (await confirmAction({ title: `Eliminar o projeto "${project.name}"?`, description: 'Este projeto não tem receitas. As tarefas dele também são eliminadas.', confirmLabel: 'Eliminar projeto', danger: true })) {
      const result = await deleteProjectFromDb(projectId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível eliminar o projeto', description: result.error });
        return;
      }
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      setTasks((prev) => prev.filter((t) => t.projectId !== projectId));

      if (userProfile) {
        logAction({
          companyId: userProfile.companyId,
          userId: userProfile.id,
          userName: userProfile.name,
          userRole: userProfile.role,
          action: 'project.delete',
          resourceType: 'project',
          resourceId: projectId,
        });
      }
    }
  };

  const handleAssumeProject = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
    const res = await assumeAvailableProject(projectId);
    if (res.success) {
      const dbProjects = await fetchProjectsFromDb(userProfile?.companyId);
      if (dbProjects) {
        setProjects(dbProjects);
        saveProjects(dbProjects);
      }
    }
    return res;
  };


  // ------------------------------------------------------------------
  // CRUD Handlers: Tasks
  // ------------------------------------------------------------------
  const handleSaveTask = async (
    taskData: Partial<Task> & { title: string; companyId: string; createdBy: string }
  ) => {
    // Ensure companyId fallback from userProfile
    const enrichedData = {
      ...taskData,
      companyId: taskData.companyId || userProfile?.companyId || 'company_default',
      createdBy: taskData.createdBy || userProfile?.id || 'anonymous',
    };

    const saved = await upsertTask(enrichedData);
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      const updated = exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev];
      saveTasks(updated);
      return updated;
    });

    if (userProfile) {
      logAction({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userName: userProfile.name,
        userRole: userProfile.role,
        action: taskData.id ? 'task.edit' : 'task.create',
        resourceType: 'task',
        resourceId: saved.id,
      });
    }

    if (saved.assignedTo) {
      const assignedEmployee = companyUsers.find((u) => u.id === saved.assignedTo);
      if (assignedEmployee?.email) {
        const project = projects.find((p) => p.id === saved.projectId);
        sendEmployeeTaskAssignedEmail({
          employeeEmail: assignedEmployee.email,
          employeeName: assignedEmployee?.name || 'Colaborador',
          taskTitle: saved.title,
          projectName: project?.name || 'Projeto',
          dueDate: saved.dueDate,
          priority: saved.priority,
        }).catch((err) => console.warn('[Resend] Task assign email failed:', err));
      }
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const previous = tasks.find((t) => t.id === taskId)?.status;
    // Atualização otimista (o cartão muda logo de coluna)…
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
      saveTasks(updated);
      return updated;
    });
    const ok = await updateTaskStatus(taskId, newStatus);
    // …e volta atrás se a base de dados recusar.
    if (!ok && previous) {
      setTasks((prev) => {
        const reverted = prev.map((t) => (t.id === taskId ? { ...t, status: previous } : t));
        saveTasks(reverted);
        return reverted;
      });
      return;
    }

    if (userProfile) {
      logAction({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userName: userProfile.name,
        userRole: userProfile.role,
        action: newStatus === 'Concluída' ? 'task.complete' : 'task.status_change',
        resourceType: 'task',
        resourceId: taskId,
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (await confirmAction({ title: 'Eliminar esta tarefa?', description: 'Esta ação não pode ser anulada.', confirmLabel: 'Eliminar tarefa', danger: true })) {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== taskId);
        saveTasks(updated);
        return updated;
      });
      await deleteTask(taskId);
    }
  };

  const handleAssignTaskToMe = async (taskId: string) => {
    if (!userProfile) return;
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId
          ? { ...t, assignedTo: userProfile.id, assignedToName: userProfile.name, status: 'Em andamento' as TaskStatus }
          : t
      );
      saveTasks(updated);
      return updated;
    });
    await upsertTask({
      id: taskId,
      companyId: userProfile.companyId,
      title: tasks.find((t) => t.id === taskId)?.title || '',
      assignedTo: userProfile.id,
      status: 'Em andamento',
      createdBy: userProfile.id,
    });
  };

  // ------------------------------------------------------------------
  // CRUD Handlers: Billing Requests (Fase 2)
  // ------------------------------------------------------------------
  const handleCreateBillingRequest = async (data: {
    projectId?: string;
    amount: number;
    currency: CurrencyCode;
    description: string;
  }) => {
    if (!userProfile?.companyId) return;
    const req = await createBillingRequest({
      companyId: userProfile.companyId,
      requestedBy: userProfile.id,
      projectId: data.projectId,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
    });

    if (req) {
      const enrichedReq: BillingRequest = {
        ...req,
        projectName: projects.find((p) => p.id === req.projectId)?.name,
        requestedByName: userProfile.name,
      };
      setBillingRequests((prev) => [enrichedReq, ...prev]);

      logAction({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userName: userProfile.name,
        userRole: userProfile.role,
        action: 'billing.request',
        resourceType: 'billing_request',
        resourceId: req.id,
      });

      const ownerAdmin = companyUsers.find((u) => u.role === 'owner' || u.role === 'admin');
      if (ownerAdmin?.email) {
        const project = projects.find((p) => p.id === req.projectId);
        sendAdminBillingRequestEmail({
          adminEmail: ownerAdmin.email,
          employeeName: userProfile.name,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          projectName: project?.name,
        }).catch((err) => console.warn('[Resend] Admin billing alert email failed:', err));
      }
    }
  };

  const handleReviewBillingRequest = async (data: {
    requestId: string;
    status: 'Aprovada' | 'Rejeitada' | 'Em análise';
    notes?: string;
  }) => {
    if (!userProfile) return;
    const res = await reviewBillingRequest({
      requestId: data.requestId,
      status: data.status,
      reviewerId: userProfile.id,
      notes: data.notes,
    });

    if (res.success) {
      // Reload billing requests
      const freshBilling = await fetchBillingRequests(
        userProfile.companyId,
        userProfile.id,
        isOwner || isAdmin
      );
      setBillingRequests(freshBilling);

      // Send email to requesting employee
      const req = billingRequests.find((r) => r.id === data.requestId);
      if (req) {
        const reqEmp = companyUsers.find((u) => u.id === req.requestedBy);
        if (reqEmp?.email && (data.status === 'Aprovada' || data.status === 'Rejeitada')) {
          sendEmployeeBillingStatusEmail({
            employeeEmail: reqEmp.email,
            employeeName: reqEmp?.name || 'Colaborador',
            description: req.description,
            amount: req.amount,
            currency: req.currency,
            status: data.status,
            notes: data.notes,
          }).catch((err) => console.warn('[Resend] Billing status email failed:', err));
        }
      }

      // If approved, also reload incomes and projects because a new Income was generated
      if (data.status === 'Aprovada') {
        const cid = userProfile.companyId;
        const [freshIncomes, freshProjects] = await Promise.all([
          fetchIncomesFromDb(cid),
          fetchProjectsFromDb(cid),
        ]);
        if (freshIncomes) {
          setIncomes(freshIncomes);
          saveIncomes(freshIncomes);
        }
        if (freshProjects) {
          setProjects(freshProjects);
          saveProjects(freshProjects);
        }
      }

      logAction({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userName: userProfile.name,
        userRole: userProfile.role,
        action: data.status === 'Aprovada' ? 'billing.approve' : 'billing.review',
        resourceType: 'billing_request',
        resourceId: data.requestId,
      });
    } else {
      throw new Error(res.error || 'Falha ao processar solicitação');
    }
  };

  const handleDeleteBillingRequest = async (requestId: string) => {
    setBillingRequests((prev) => prev.filter((r) => r.id !== requestId));
    await deleteBillingRequest(requestId);
  };

  // ------------------------------------------------------------------
  // CRUD Handlers: Users & Permissions
  // ------------------------------------------------------------------
  const handleSaveUser = async (data: {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    status: 'active' | 'suspended';
    language?: 'pt' | 'en';
  }) => {
    if (!userProfile?.companyId) return;

    if (!data.id) {
      const res = await createCompanyUser({
        email: data.email,
        password: data.password || 'Mudar123!',
        name: data.name,
        role: data.role,
        companyId: userProfile.companyId,
      });

      if (!res.success) {
        throw new Error(res.error || 'Erro ao criar utilizador');
      }

      const freshUsers = await fetchCompanyUsers(userProfile.companyId);
      setCompanyUsers(
        data.language
          ? freshUsers.map((u) => (u.id === res.userId || u.email === data.email ? { ...u, language: data.language } : u))
          : freshUsers
      );

      logAction({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userName: userProfile.name,
        userRole: userProfile.role,
        action: 'user.create',
        resourceType: 'user',
        resourceId: res.userId,
      });

      if (data.email) {
        sendEmployeeWelcomeEmail({
          employeeEmail: data.email,
          employeeName: data.name,
          roleName: ROLE_LABELS[data.role] || data.role,
          temporaryPassword: data.password || 'Mudar123!',
        }).catch((err) => console.warn('[Resend] Welcome email failed:', err));
      }
    } else {
      await updateUserProfile({
        id: data.id,
        companyId: userProfile.companyId,
        name: data.name,
        role: data.role,
        status: data.status,
        language: data.language,
      });

      const freshUsers = await fetchCompanyUsers(userProfile.companyId);
      setCompanyUsers(
        freshUsers.map((u) => (u.id === data.id ? { ...u, language: data.language || u.language } : u))
      );

      // If updating current user's profile, switch active language immediately
      if (data.language && userProfile.id === data.id) {
        setLang(data.language);
        await refreshProfile();
      }

      logAction({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userName: userProfile.name,
        userRole: userProfile.role,
        action: 'user.edit',
        resourceType: 'user',
        resourceId: data.id,
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    if (!userProfile?.companyId) return;
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await updateUserStatus(userId, newStatus);

    setCompanyUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    logAction({
      companyId: userProfile.companyId,
      userId: userProfile.id,
      userName: userProfile.name,
      userRole: userProfile.role,
      action: newStatus === 'suspended' ? 'user.suspend' : 'user.activate',
      resourceType: 'user',
      resourceId: userId,
    });
  };

  const handleOpenPermissionsModal = async (user: UserProfile) => {
    setUserForPerms(user);
    const perms = await fetchUserPermissions(user.id);
    setUserPermsList(perms);
    setIsUserPermsModalOpen(true);
  };

  const handleSaveUserPermissions = async (
    userId: string,
    permissions: Array<{ permissionId: string; scope: PermissionScope; granted: boolean }>
  ) => {
    if (!userProfile?.companyId) return;
    await setUserPermissions(userId, permissions, userProfile.id);

    logAction({
      companyId: userProfile.companyId,
      userId: userProfile.id,
      userName: userProfile.name,
      userRole: userProfile.role,
      action: 'permission.grant',
      resourceType: 'user',
      resourceId: userId,
    });

    if (userId === userProfile.id) {
      await refreshProfile();
    }
  };

  // ------------------------------------------------------------------
  // CRUD Handlers: Incomes & Expenses
  // ------------------------------------------------------------------
  const handleSaveIncome = async (
    incomeData: Omit<Income, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const isNew = !incomeData.id;
    const incomeId = incomeData.id || `inc-${Date.now()}`;
    const newIncome: Income = {
      ...incomeData,
      id: incomeId,
      createdAt: isNew
        ? getTodayIso()
        : (incomes.find((i) => i.id === incomeId)?.createdAt || getTodayIso()),
    };

    if (userProfile?.companyId) {
      const result = await upsertIncomeToDb(newIncome, userProfile.companyId);
      if (!result.success) {
        console.error('[App] handleSaveIncome failed:', result.error);
        toast({ tone: 'danger', title: 'Não foi possível guardar a receita', description: result.error || 'Verifique a ligação à internet e tente novamente.' });
        return;
      }
    }

    const updated = isNew
      ? [newIncome, ...incomes]
      : incomes.map((i) => (i.id === incomeId ? newIncome : i));
    setIncomes(updated);
    saveIncomes(updated);

    if (newIncome.projectId) {
      await syncProjectPaidAmountFromIncomes(newIncome.projectId, updated, projects);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    const income = incomes.find((i) => i.id === incomeId);
    if (!income) return;

    if (await confirmAction({ title: `Eliminar a receita "${income.description}"?`, confirmLabel: 'Eliminar receita', danger: true })) {
      const result = await deleteIncomeFromDb(incomeId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível eliminar a receita', description: result.error });
        return;
      }
      const updated = incomes.filter((i) => i.id !== incomeId);
      setIncomes(updated);
      saveIncomes(updated);

      if (income.projectId) {
        await syncProjectPaidAmountFromIncomes(income.projectId, updated, projects);
      }
    }
  };

  const handleToggleIncomeStatus = async (income: Income) => {
    const nextStatus = income.status === 'Recebido' ? 'Pendente' : 'Recebido';
    const updatedIncome: Income = {
      ...income,
      status: nextStatus,
      receivedDate: nextStatus === 'Recebido' ? (income.receivedDate || getTodayIso()) : undefined,
    };

    if (userProfile?.companyId) {
      const result = await upsertIncomeToDb(updatedIncome, userProfile.companyId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível atualizar a receita', description: result.error });
        return;
      }
    }
    const updated = incomes.map((i) => (i.id === income.id ? updatedIncome : i));
    setIncomes(updated);
    saveIncomes(updated);

    if (income.projectId) {
      await syncProjectPaidAmountFromIncomes(income.projectId, updated, projects);
    }

    if (nextStatus === 'Recebido') {
      const client = clients.find((c) => c.id === income.clientId);
      if (client?.email) {
        sendClientReceiptEmail({
          clientEmail: client.email,
          clientName: client?.name || 'Cliente',
          description: income.description,
          amount: income.amount,
          currency: income.currency,
          receivedDate: getTodayIso(),
          paymentMethod: income.paymentMethod,
        }).catch((err) => console.warn('[Resend] Client receipt email failed:', err));
      }
    }
  };

  const handleSaveExpense = async (
    expenseData: Omit<Expense, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const isNew = !expenseData.id;
    const expenseId = expenseData.id || `exp-${Date.now()}`;
    const newExpense: Expense = {
      ...expenseData,
      id: expenseId,
      createdAt: isNew
        ? getTodayIso()
        : (expenses.find((e) => e.id === expenseId)?.createdAt || getTodayIso()),
    };

    if (userProfile?.companyId) {
      const result = await upsertExpenseToDb(newExpense, userProfile.companyId);
      if (!result.success) {
        console.error('[App] handleSaveExpense failed:', result.error);
        toast({ tone: 'danger', title: 'Não foi possível guardar a despesa', description: result.error || 'Verifique a ligação à internet e tente novamente.' });
        return;
      }
    }

    const updated = isNew
      ? [newExpense, ...expenses]
      : expenses.map((e) => (e.id === expenseId ? newExpense : e));
    setExpenses(updated);
    saveExpenses(updated);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    if (await confirmAction({ title: `Eliminar a despesa "${expense.description}"?`, confirmLabel: 'Eliminar despesa', danger: true })) {
      const result = await deleteExpenseFromDb(expenseId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível eliminar a despesa', description: result.error });
        return;
      }
      const updated = expenses.filter((e) => e.id !== expenseId);
      setExpenses(updated);
      saveExpenses(updated);
    }
  };

  const handleToggleExpensePaid = async (expense: Expense) => {
    const updatedExpense: Expense = {
      ...expense,
      paid: !expense.paid,
    };

    if (userProfile?.companyId) {
      const result = await upsertExpenseToDb(updatedExpense, userProfile.companyId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível atualizar a despesa', description: result.error });
        return;
      }
    }
    const updated = expenses.map((e) => (e.id === expense.id ? updatedExpense : e));
    setExpenses(updated);
    saveExpenses(updated);
  };

  const handleToggleProjectCommissionPaid = async (project: Project) => {
    const nextPaid = !project.commissionPaid;
    await persistProjectChange({ ...project, commissionPaid: nextPaid });
  };

  // ------------------------------------------------------------------
  // CRUD Handlers: Categories, Agenda, Partners, Settings
  // ------------------------------------------------------------------
  const handleSaveCategory = async (categoryData: Omit<CategoryItem, 'id' | 'createdAt'> & { id?: string }) => {
    const isNew = !categoryData.id;
    const catId = categoryData.id || `cat-${Date.now()}`;
    const newCategory: CategoryItem = {
      ...categoryData,
      id: catId,
      createdAt: isNew ? getTodayIso() : (categories.find((c) => c.id === catId)?.createdAt || getTodayIso()),
    };
    if (userProfile?.companyId) {
      const result = await upsertCategoryToDb(newCategory, userProfile.companyId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível guardar a categoria', description: result.error });
        return;
      }
    }
    const updated = isNew
      ? [newCategory, ...categories]
      : categories.map((c) => (c.id === catId ? newCategory : c));
    setCategories(updated);
    saveCategories(updated);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const result = await deleteCategoryFromDb(categoryId);
    if (!result.success) {
      toast({ tone: 'danger', title: 'Não foi possível eliminar a categoria', description: result.error });
      return;
    }
    const updated = categories.filter((c) => c.id !== categoryId);
    setCategories(updated);
    saveCategories(updated);
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    if (userProfile?.companyId) {
      const result = await upsertSettingsToDb(newSettings, userProfile.companyId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível guardar as definições', description: result.error });
        return;
      }
    }
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSaveAgendaEvent = async (eventData: Omit<AgendaEvent, 'id' | 'createdAt'> & { id?: string }) => {
    const isNew = !eventData.id;
    const eventId = eventData.id || `evt-${Date.now()}`;
    const newEvent: AgendaEvent = {
      ...eventData,
      id: eventId,
      createdAt: isNew ? getTodayIso() : (agendaEvents.find((e) => e.id === eventId)?.createdAt || getTodayIso()),
    };
    if (userProfile?.companyId) {
      const result = await upsertAgendaEventToDb(newEvent, userProfile.companyId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível guardar o evento', description: result.error });
        return;
      }
    }
    setAgendaEvents((prev) => (isNew ? [newEvent, ...prev] : prev.map((e) => (e.id === eventId ? newEvent : e))));
  };

  const handleDeleteAgendaEvent = async (eventId: string) => {
    const result = await deleteAgendaEventFromDb(eventId);
    if (!result.success) {
      toast({ tone: 'danger', title: 'Não foi possível eliminar o evento', description: result.error });
      return;
    }
    setAgendaEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleToggleAgendaEventStatus = async (eventId: string) => {
    const evt = agendaEvents.find((e) => e.id === eventId);
    if (!evt) return;
    const nextStatus = evt.status === 'completed' ? 'pending' : 'completed';
    const updatedEvt: AgendaEvent = { ...evt, status: nextStatus };
    if (userProfile?.companyId) {
      const result = await upsertAgendaEventToDb(updatedEvt, userProfile.companyId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível atualizar o evento', description: result.error });
        return;
      }
    }
    setAgendaEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvt : e)));
  };

  // Reservas de caixa: escritas à mão; fechar uma reserva deixa de prender caixa.
  const handleSaveReserve = async (data: Omit<CashReserve, 'id' | 'createdAt'> & { id?: string }): Promise<boolean> => {
    if (!userProfile?.companyId) return false;
    const reserve: CashReserve = {
      ...data,
      id: data.id || `res-${Date.now()}`,
      createdAt: cashReserves.find((r) => r.id === data.id)?.createdAt || new Date().toISOString(),
    };
    const result = await upsertCashReserveToDb(reserve, userProfile.companyId);
    if (!result.success) {
      toast({ tone: 'danger', title: 'Não foi possível guardar a reserva', description: result.error });
      return false;
    }
    setCashReserves((prev) => (prev.some((r) => r.id === reserve.id) ? prev.map((r) => (r.id === reserve.id ? reserve : r)) : [...prev, reserve]));
    toast({ tone: 'success', title: reserve.closed ? `Reserva "${reserve.name}" fechada` : `Reserva "${reserve.name}" guardada` });
    return true;
  };

  // Divide um valor pelos sócios (percentagens das Definições). Cada parte é uma despesa
  // "Distribuição a sócios": enviada sai do caixa; por enviar fica no caixa até ser paga.
  const handleDistribute = async (params: { amount: number; date: string; reference: string; sent: Record<string, boolean> }): Promise<boolean> => {
    if (!userProfile?.companyId) return false;
    const shares = buildPartnerDistribution({
      ...params,
      currency: settings.defaultCurrency,
      split: settings.profitSplit || [],
      idPrefix: `dist-${Date.now()}`,
    });
    const saved: Expense[] = [];
    for (const share of shares) {
      const result = await upsertExpenseToDb(share, userProfile.companyId);
      if (!result.success) {
        toast({ tone: 'danger', title: `Não foi possível registar a parte de ${share.partnerName}`, description: `${result.error || ''} As restantes partes foram registadas; verifique em Despesas.`.trim() });
        break;
      }
      saved.push(share);
    }
    if (saved.length > 0) {
      setExpenses((prev) => {
        const next = [...saved, ...prev];
        saveExpenses(next);
        return next;
      });
    }
    if (saved.length === shares.length) {
      toast({ tone: 'success', title: 'Distribuição registada', description: `${formatCurrency(params.amount, settings.defaultCurrency)} · ${params.reference}` });
      return true;
    }
    return false;
  };

  const handleSavePartner = async (partnerData: Omit<Partner, 'id' | 'createdAt'> & { id?: string }) => {
    const isNew = !partnerData.id;
    const partnerId = partnerData.id || `part-${Date.now()}`;
    const newPartner: Partner = {
      ...partnerData,
      id: partnerId,
      createdAt: isNew ? getTodayIso() : (partners.find((p) => p.id === partnerId)?.createdAt || getTodayIso()),
    };

    if (userProfile?.companyId) {
      const result = await upsertPartnerToDb(newPartner, userProfile.companyId);
      if (!result.success) {
        console.error('[App] handleSavePartner failed:', result.error);
        toast({ tone: 'danger', title: 'Não foi possível guardar o parceiro', description: result.error || 'Verifique a ligação à internet e tente novamente.' });
        return;
      }
    }

    const updated = isNew
      ? [newPartner, ...partners]
      : partners.map((p) => (p.id === partnerId ? newPartner : p));
    setPartners(updated);
    savePartners(updated);
  };

  const handleDeletePartner = async (partnerId: string) => {
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) return;
    const linkedProjects = projects.filter((p) => p.partnerId === partnerId);
    if (linkedProjects.length > 0) {
      toast({
        tone: 'warning',
        title: `"${partner.name}" tem histórico e não pode ser eliminado`,
        description: `Está ligado a ${linkedProjects.length} projeto(s) e às comissões deles.`,
      });
      return;
    }
    if (await confirmAction({ title: `Eliminar o parceiro "${partner.name}"?`, confirmLabel: 'Eliminar parceiro', danger: true })) {
      const result = await deletePartnerFromDb(partnerId);
      if (!result.success) {
        toast({ tone: 'danger', title: 'Não foi possível eliminar o parceiro', description: result.error });
        return;
      }
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    }
  };

  const handleResetData = async () => {
    if (await confirmAction({ title: 'Recarregar e sincronizar?', description: 'A página é recarregada com os dados mais recentes do servidor.', confirmLabel: 'Recarregar' })) {
      clearAllData();
      window.location.reload();
    }
  };

  const handleClearData = async () => {
    if (
      await confirmAction({ title: 'Limpar os dados deste dispositivo?', description: 'Os dados no servidor ficam intactos. Antes de limpar é criada uma cópia de segurança.', confirmLabel: 'Limpar dados locais', danger: true })
    ) {
      // Auto-backup before clearing (uses current live state)
      exportBackupData({ clients, projects, incomes, expenses, partners });
      clearAllData();
      setClients([]);
      setProjects([]);
      setIncomes([]);
      setExpenses([]);
      setPartners([]);
      setAgendaEvents([]);
      setBillingRequests([]);
      setIntegrityWarnings([]);
    }
  };

  const handleExportData = () => {
    // Always export from live state (loaded from Supabase) — never stale localStorage
    exportBackupData({ clients, projects, incomes, expenses, partners });
  };

  const handleImportData = async (jsonStr: string) => {
    const success = importBackupData(jsonStr);
    if (success) {
      const importedClients = getStoredClients();
      const importedProjects = getStoredProjects();
      const importedIncomes = getStoredIncomes();
      const importedExpenses = getStoredExpenses();
      const importedPartners = getStoredPartners();

      setClients(importedClients);
      setProjects(importedProjects);
      setIncomes(importedIncomes);
      setExpenses(importedExpenses);
      setCategories(getStoredCategories());
      setPartners(importedPartners);
      setSettings(getStoredSettings());

      // Sincronizar dados importados diretamente com o banco Supabase
      const cid = userProfile?.companyId;
      if (cid) {
        try {
          for (const c of importedClients) await upsertClientToDb(c, cid);
          for (const p of importedProjects) await upsertProjectToDb(p, cid);
          for (const i of importedIncomes) await upsertIncomeToDb(i, cid);
          for (const e of importedExpenses) await upsertExpenseToDb(e, cid);
          for (const pa of importedPartners) await upsertPartnerToDb(pa, cid);
        } catch (err) {
          console.warn('[Import] Erro na sincronização com o banco:', err);
        }
      }
      toast({ tone: 'success', title: 'Cópia de segurança restaurada', description: 'Os dados foram sincronizados com o servidor.' });
    } else {
      toast({ tone: 'danger', title: 'Não foi possível importar a cópia de segurança', description: 'Confirme que escolheu um ficheiro .json exportado por esta app.' });
    }
  };


  // ------------------------------------------------------------------
  // ROUTE GUARD
  // ------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", letterSpacing: '-0.011em' }}>
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-fg border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-fg-muted text-sm font-normal">A carregar permissões...</p>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return <LoginView onLoginSuccess={login} />;
  }

  if (userProfile?.status === 'suspended') {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-neutral-50">
        <div className="max-w-md w-full rounded-3xl bg-white shadow-xl p-8 text-center space-y-4">
          <h1 className="text-xl font-semibold text-neutral-900">{lang === 'en' ? 'Account suspended' : 'Conta suspensa'}</h1>
          <p className="text-sm text-neutral-600">
            {lang === 'en'
              ? 'Access to this account has been suspended. Contact support to resolve it.'
              : 'O acesso a esta conta foi suspenso. Fale com o suporte para resolver.'}
          </p>
          <a className="block text-sm underline text-neutral-800" href={`mailto:${APP_CONFIG.supportEmail}`}>{APP_CONFIG.supportEmail}</a>
          <button type="button" onClick={logout} className="w-full rounded-full bg-neutral-900 text-white py-2.5 text-sm font-medium">
            {lang === 'en' ? 'Sign out' : 'Terminar sessão'}
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", letterSpacing: '-0.011em' }}>
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-fg border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-fg font-medium text-base">{t('common.loadingWorkspace', 'A preparar o seu espaço de trabalho...')}</p>
          <p className="text-fg-muted text-sm font-normal">{t('common.configuringWorkspace', 'A carregar os dados da empresa…')}</p>
        </div>
      </div>
    );
  }

  const pendingBillingCount = billingRequests.filter(
    (r) => r.status === 'Solicitada' || r.status === 'Em análise'
  ).length;

  // Badges só para o que pede ação (Regra 04): atrasado, para hoje ou pendente de decisão
  const _d = new Date();
  const todayISO = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
  const tasksNeedingAction = tasks.filter((t) => t.status !== 'Concluída' && t.status !== 'Cancelada' && !!t.dueDate && t.dueDate.slice(0, 10) <= todayISO).length;
  const overdueIncomesCount = incomes.filter((i) => i.status === 'Atrasado' || (i.status === 'Pendente' && i.dueDate.slice(0, 10) < todayISO)).length;
  const eventsTodayCount = agendaEvents.filter((e) => e.status === 'pending' && e.date <= todayISO).length;

  // Navigation Items Catalog
  const allNavItems = [
    { id: 'dashboard',  label: t('nav.dashboard', 'Painel'),       icon: LayoutDashboard },
    { id: 'calendar',   label: t('nav.calendar', 'Agenda'),     icon: CalendarIcon, badge: eventsTodayCount || undefined },
    { id: 'projects',   label: t('nav.projects', 'Projetos'), icon: FolderKanban, },
    { id: 'tasks',      label: t('nav.tasks', 'Tarefas'),  icon: CheckSquare,  badge: tasksNeedingAction || undefined },
    { id: 'billing',    label: t('nav.billing', 'Faturação'), icon: FileText,   badge: pendingBillingCount > 0 ? pendingBillingCount : undefined },
    { id: 'clients',    label: t('nav.clients', 'Clientes'),   icon: Users },
    { id: 'financial',  label: t('nav.financial', 'Financeiro'), icon: DollarSign, badge: overdueIncomesCount || undefined },
    { id: 'partners',   label: t('nav.partners', 'Parceiros'), icon: Handshake },
    { id: 'categories', label: t('nav.categories', 'Categorias'),          icon: Tag },
    { id: 'reports',    label: t('nav.reports', 'Relatórios'),          icon: PieChart },
    { id: 'users',      label: t('nav.users', 'Utilizadores'), icon: UserCog },
    { id: 'audit',      label: t('nav.audit', 'Auditoria'), icon: History },
    { id: 'settings',   label: t('nav.settings', 'Definições'),       icon: Settings },
  ];

  // Filter nav items by user permissions
  const navItems = allNavItems.filter((item) => {
    if (item.id === 'audit') return isOwner;
    return visibleTabs.includes(item.id);
  });

  return (
    <>
      <div className="aura-root aura-canvas aura-app h-screen overflow-hidden flex flex-col">
        <div className="aura-canvas__aurora" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="aura-canvas__grid" aria-hidden="true" />
        <div className="aura-canvas__vignette" aria-hidden="true" />
        <div className="aura-canvas__sheen" aria-hidden="true" />
        <div className="aura-canvas__noise" aria-hidden="true" />
        {/* Top Header — recolhe ao descer o conteúdo, volta ao subir */}
        <div
          ref={headerSlotRef}
          className="relative z-30 shrink-0 grid"
          style={{ gridTemplateRows: '1fr', transition: 'grid-template-rows 300ms ease-out, opacity 250ms ease-out' }}
        >
        <div style={{ minHeight: 0 }}>
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
          onOpenNewTaskModal={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
          onOpenNewUserModal={() => {
            setUserToEdit(null);
            setIsUserModalOpen(true);
          }}
          onOpenNewBillingModal={() => {
            setBillingRequestToReview(null);
            setIsBillingModalOpen(true);
          }}
          onSync={loadDbData}
          isSyncing={isDataSyncing}
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          userSession={userSession}
          onLogout={logout}
        />
        </div>
        </div>

      {/* Contentor principal — sidebar de vidro + conteúdo com scroll próprio */}
      <div className="flex-1 min-h-0 w-full px-3 sm:px-4 lg:pl-4 lg:pr-6 pt-4 lg:pt-5 flex gap-5 overflow-hidden">
        <AppSidebar
          items={navItems}
          active={activeTab}
          collapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
          onSelect={handleNavigateTab}
        />

        <MobileNav
          items={navItems}
          active={activeTab}
          onSelect={handleNavigateTab}
          moreOpen={isMobileMenuOpen}
          setMoreOpen={setIsMobileMenuOpen}
          onCreate={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onToggleLang={toggleLang}
          onSync={loadDbData}
          isSyncing={isDataSyncing}
          onLogout={logout}
        />

        {/* Main View Area */}
        <main ref={mainRef} onScroll={onMainScroll} className="aura-scroll aura-scroll-fade flex-1 min-w-0 max-w-[1640px] mx-auto h-full overflow-y-auto overflow-x-hidden pr-1 pt-1 pb-[calc(var(--layout-bottom-nav)+40px)] lg:pb-8">
          {/* Financial Integrity Warning Banner — only visible to owner when warnings exist */}
          {isOwner && !isIntegrityDismissed && integrityWarnings.length > 0 && (
            <div className="mb-4 bg-warning-soft border border-[#e8b54a]/40 rounded-lg p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f9e4b7] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-warning-fg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#92400e]">
                  {t('financial.integrityTitle', 'Avisos de Integridade Financeira')}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {integrityWarnings.map((w, i) => (
                    <li key={i} className="text-xs text-warning-fg">• {w}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-warning-fg/70 mt-2">
                  {t('financial.integritySubtitle', 'Aceda às Transações Financeiras para corrigir.')}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsIntegrityDismissed(true);
                  setIntegrityWarnings([]);
                }}
                className="text-warning-fg/60 hover:text-warning-fg p-1 rounded-full hover:bg-[#f9e4b7] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0"
          >
          {activeTab === 'dashboard' && (
            <DashboardView
              reserves={cashReserves}
              clients={clients}
              projects={projects}
              incomes={incomes}
              expenses={expenses}
              tasks={tasks}
              billingRequests={billingRequests}
              settings={settings}
              currencyFilter={currencyFilter}
              onNavigateTab={handleNavigateTab}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenNewProjectModal={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
              onOpenNewIncomeModal={() => { setIncomeToEdit(null); setIsIncomeModalOpen(true); }}
              onOpenNewExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
              onAssumeProject={handleAssumeProject}
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
              categories={categories}
              onOpenNewProjectModal={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
              onEditProject={(p) => { setProjectToEdit(p); setIsProjectModalOpen(true); }}
              onDuplicateProject={handleDuplicateProject}
              onRateProject={handleRateProject}
              onDeleteProject={handleDeleteProject}
              onMarkProjectAsPaid={handleMarkProjectAsPaid}
              onOpenStripeInvoiceModal={handleOpenStripeInvoiceModal}
              onAssumeProject={handleAssumeProject}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              projects={projects}
              employees={companyUsers}
              categories={categories}
              initialCategoryFilter={tabFilter}
              onOpenNewTaskModal={(defProjId) => {
                setTaskToEdit(defProjId ? { projectId: defProjId } as Task : null);
                setIsTaskModalOpen(true);
              }}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onAssignToMe={handleAssignTaskToMe}
            />
          )}

          {activeTab === 'billing' && (
            <BillingRequestsView
              requests={billingRequests}
              projects={projects}
              onOpenNewRequestModal={() => { setBillingRequestToReview(null); setIsBillingModalOpen(true); }}
              onOpenReviewModal={(r) => { setBillingRequestToReview(r); setIsBillingModalOpen(true); }}
              onDeleteRequest={handleDeleteBillingRequest}
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
              settings={settings}
              reserves={cashReserves}
              canEditCash={isOwner || hasPermission('financial.edit')}
              onSaveReserve={handleSaveReserve}
              onDistribute={handleDistribute}
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
              onOpenSendEmailModal={handleOpenSendEmailModal}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              categories={categories}
              projects={projects}
              tasks={tasks}
              onOpenNewCategoryModal={() => { setCategoryToEdit(null); setIsCategoryModalOpen(true); }}
              onEditCategory={(c) => { setCategoryToEdit(c); setIsCategoryModalOpen(true); }}
              onDeleteCategory={handleDeleteCategory}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'partners' && (
            <PartnersView
              partners={partners}
              projects={projects}
              expenses={expenses}
              settings={settings}
              currencyFilter={currencyFilter}
              initialFilter={tabFilter}
              onOpenNewPartnerModal={() => { setPartnerToEdit(null); setIsPartnerModalOpen(true); }}
              onEditPartner={(partner) => { setPartnerToEdit(partner); setIsPartnerModalOpen(true); }}
              onDeletePartner={handleDeletePartner}
              onToggleProjectCommissionPaid={handleToggleProjectCommissionPaid}
              onOpenNewExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
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
              reserves={cashReserves}
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              users={companyUsers}
              onOpenNewUserModal={() => {
                setUserToEdit(null);
                setIsUserModalOpen(true);
              }}
              onEditUser={(u) => { setUserToEdit(u); setIsUserModalOpen(true); }}
              onOpenPermissionsModal={handleOpenPermissionsModal}
              onToggleUserStatus={handleToggleUserStatus}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetData={handleResetData}
              onClearData={handleClearData}
              onExportData={handleExportData}
              onImportData={handleImportData}
            />
          )}
          </motion.div>
        </main>
      </div>

      {/* Drawers & Modals */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
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
        employees={companyUsers}
        categories={categories}
        defaultCurrency={settings.defaultCurrency}
      />

      {userProfile && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
          taskToEdit={taskToEdit}
          projects={projects}
          employees={companyUsers}
          categories={categories}
          companyId={userProfile.companyId}
          currentUserId={userProfile.id}
          canAssign={isOwner || hasPermission('tasks.assign')}
        />
      )}

      <BillingRequestModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        onSave={handleCreateBillingRequest}
        onReview={handleReviewBillingRequest}
        projects={projects}
        requestToReview={billingRequestToReview}
        defaultCurrency={settings.defaultCurrency}
        canApprove={isOwner || hasPermission('billing.approve')}
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
        categories={categories}
        reserves={cashReserves}
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

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        currentUserCount={companyUsers.length}
      />

      <UserPermissionsModal
        isOpen={isUserPermsModalOpen}
        onClose={() => setIsUserPermsModalOpen(false)}
        user={userForPerms}
        currentPermissions={userPermsList}
        onSave={handleSaveUserPermissions}
      />

      <SendEmailModal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        defaultRecipientEmail={emailModalProps.recipientEmail}
        defaultRecipientName={emailModalProps.recipientName}
        defaultSubject={emailModalProps.subject}
        defaultMessage={emailModalProps.message}
        defaultAttachments={emailModalProps.attachments}
      />

      {projectForStripeInvoice && isStripeInvoiceModalOpen && (
        <StripeInvoiceModal
          project={projectForStripeInvoice}
          client={clients.find((c) => c.id === projectForStripeInvoice.clientId)}
          incomes={incomes}
          onClose={() => {
            setIsStripeInvoiceModalOpen(false);
            setProjectForStripeInvoice(null);
          }}
          onInvoiceCreated={handleStripeInvoiceCreated}
        />
      )}

      </div>
  </>
  );
}
