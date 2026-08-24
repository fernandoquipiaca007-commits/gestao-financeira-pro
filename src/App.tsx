import React, { useState, useEffect, useCallback } from 'react';
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
} from './types';
import {
  UserProfile,
  Task,
  TaskStatus,
  UserRole,
  PermissionScope,
  BillingRequest,
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
import { useAuth } from './contexts/AuthContext';

import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
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
import { GlobalSearchModal } from './components/GlobalSearchModal';

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

export default function App() {
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

  // RBAC Data State
  const [companyUsers, setCompanyUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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

  // Computed Notifications
  const notifications: NotificationItem[] = computeNotifications(clients, projects, incomes, expenses);

  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Initial Data Fetch & Synchronization
  // ------------------------------------------------------------------
  const loadDbData = useCallback(async () => {
    try {
      registerServiceWorker();

      const cid = userProfile?.companyId;

      const [dbClients, dbProjects, dbIncomes, dbExpenses, dbEvents, dbPartners, liveRates] =
        await Promise.all([
          fetchClientsFromDb(cid),
          fetchProjectsFromDb(cid),
          fetchIncomesFromDb(cid),
          fetchExpensesFromDb(cid),
          fetchAgendaEventsFromDb(cid),
          fetchPartnersFromDb(cid),
          fetchLiveExchangeRates(),
        ]);

      if (dbClients) setClients(dbClients);
      if (dbIncomes) setIncomes(dbIncomes);
      if (dbExpenses) setExpenses(dbExpenses);
      if (dbEvents) setAgendaEvents(dbEvents);
      if (dbPartners) setPartners(dbPartners);

      // Reconcile project paid amount with linked incomes
      if (dbProjects && dbIncomes) {
        const reconciled = dbProjects.map((p) => {
          const projectIncomes = dbIncomes.filter((i) => i.projectId === p.id);
          if (projectIncomes.length > 0) {
            const sumPaid = projectIncomes
              .filter((i) => i.status === 'Recebido')
              .reduce((acc, i) => acc + i.amount, 0);

            if (sumPaid > p.paidAmount) {
              const updatedStatus: ProjectStatus =
                sumPaid >= p.totalAmount && p.totalAmount > 0 ? 'Concluído' : p.status;
              return { ...p, paidAmount: sumPaid, status: updatedStatus };
            }
          }
          return p;
        });

        setProjects(reconciled);
        saveProjects(reconciled);
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
        if (tasksData) setTasks(tasksData);
        if (billingData) setBillingRequests(billingData);
      }
    } catch (err) {
      console.warn('Failed to sync data with Supabase on load:', err);
    }
  }, [userProfile?.companyId, userProfile?.id, isOwner, isAdmin]);

  useEffect(() => {
    if (userSession) {
      loadDbData();
    }
  }, [userSession, loadDbData]);

  // Background Push Notification Poller
  useEffect(() => {
    if (!userSession) return;
    startBackgroundNotificationCheck(() => {
      // Check overdue invoices & events and notify if needed
    }, 60000);
  }, [userSession]);

  // Adjust activeTab if current tab is not in visibleTabs
  useEffect(() => {
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

    const updated = isNew
      ? [newClient, ...clients]
      : clients.map((c) => (c.id === clientId ? newClient : c));

    setClients(updated);
    saveClients(updated);
    if (userProfile?.companyId) {
      await upsertClientToDb(newClient, userProfile.companyId);
    }

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

    if (
      window.confirm(
        `Tem certeza que deseja excluir o cliente "${client.name}"?\nTodos os projetos e faturas associados também serão afetados.`
      )
    ) {
      const updatedClients = clients.filter((c) => c.id !== clientId);
      const updatedProjects = projects.filter((p) => p.clientId !== clientId);
      const updatedIncomes = incomes.filter((i) => i.clientId !== clientId);

      setClients(updatedClients);
      saveClients(updatedClients);
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      setIncomes(updatedIncomes);
      saveIncomes(updatedIncomes);

      await deleteClientFromDb(clientId);

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
  const syncProjectPaidAmountFromIncomes = async (
    targetProjectId: string,
    currentIncomes: Income[],
    currentProjects: Project[]
  ) => {
    const project = currentProjects.find((p) => p.id === targetProjectId);
    if (!project) return;

    const projectIncomes = currentIncomes.filter((i) => i.projectId === targetProjectId);
    const sumPaid = projectIncomes
      .filter((i) => i.status === 'Recebido')
      .reduce((acc, i) => acc + i.amount, 0);

    const isFullyPaid = sumPaid >= project.totalAmount && project.totalAmount > 0;
    const updatedStatus: ProjectStatus = isFullyPaid ? 'Concluído' : project.status;

    if (project.paidAmount !== sumPaid || project.status !== updatedStatus) {
      const updatedProject: Project = {
        ...project,
        paidAmount: sumPaid,
        status: updatedStatus,
      };

      const updatedProjects = currentProjects.map((p) =>
        p.id === targetProjectId ? updatedProject : p
      );
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      if (userProfile?.companyId) {
        await upsertProjectToDb(updatedProject, userProfile.companyId);
      }
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

    const updatedProjects = isNew
      ? [newProject, ...projects]
      : projects.map((p) => (p.id === projectId ? newProject : p));

    setProjects(updatedProjects);
    saveProjects(updatedProjects);
    if (userProfile?.companyId) {
      await upsertProjectToDb(newProject, userProfile.companyId);
    }

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
        if (userProfile?.companyId) {
          await upsertIncomeToDb(paidIncome, userProfile.companyId);
        }
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
          dueDate: newProject.nextPaymentDate || newProject.dueDate,
          status: 'Pendente',
          paymentMethod: 'Transferência',
          createdAt: getTodayIso(),
        };
        initialIncomes.push(pendingIncome);
        if (userProfile?.companyId) {
          await upsertIncomeToDb(pendingIncome, userProfile.companyId);
        }
      }

      if (initialIncomes.length > 0) {
        const nextIncomes = [...initialIncomes, ...incomes];
        setIncomes(nextIncomes);
        saveIncomes(nextIncomes);
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
  };

  const handleMarkProjectAsPaid = async (project: Project) => {
    const updatedProject: Project = {
      ...project,
      paidAmount: project.totalAmount,
      status: 'Concluído',
    };

    const updatedProjects = projects.map((p) =>
      p.id === project.id ? updatedProject : p
    );
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
    if (userProfile?.companyId) {
      await upsertProjectToDb(updatedProject, userProfile.companyId);
    }

    // Update or create linked income as Recebido
    const projectIncomes = incomes.filter((i) => i.projectId === project.id);
    if (projectIncomes.length > 0) {
      const updatedIncomes = incomes.map((inc) => {
        if (inc.projectId === project.id && inc.status !== 'Recebido') {
          const updatedInc: Income = {
            ...inc,
            status: 'Recebido',
            receivedDate: inc.receivedDate || getTodayIso(),
          };
          if (userProfile?.companyId) {
            upsertIncomeToDb(updatedInc, userProfile.companyId);
          }
          return updatedInc;
        }
        return inc;
      });
      setIncomes(updatedIncomes);
      saveIncomes(updatedIncomes);
    }
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
    const updatedProject: Project = { ...project, rating };
    const updated = projects.map((p) => (p.id === project.id ? updatedProject : p));
    setProjects(updated);
    saveProjects(updated);
    if (userProfile?.companyId) {
      await upsertProjectToDb(updatedProject, userProfile.companyId);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    if (window.confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      const updatedIncomes = incomes.filter((i) => i.projectId !== projectId);

      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      setIncomes(updatedIncomes);
      saveIncomes(updatedIncomes);

      await deleteProjectFromDb(projectId);

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
    const saved = await upsertTask(taskData);
    if (saved) {
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === saved.id);
        return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev];
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
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    await updateTaskStatus(taskId, newStatus);

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
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      await deleteTask(taskId);
    }
  };

  const handleAssignTaskToMe = async (taskId: string) => {
    if (!userProfile) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assignedTo: userProfile.id, assignedToName: userProfile.name, status: 'Em andamento' }
          : t
      )
    );
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
      setCompanyUsers(freshUsers);

      logAction({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userName: userProfile.name,
        userRole: userProfile.role,
        action: 'user.create',
        resourceType: 'user',
        resourceId: res.userId,
      });
    } else {
      await updateUserProfile({
        id: data.id,
        companyId: userProfile.companyId,
        name: data.name,
        role: data.role,
        status: data.status,
      });

      const freshUsers = await fetchCompanyUsers(userProfile.companyId);
      setCompanyUsers(freshUsers);

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

    const updated = isNew
      ? [newIncome, ...incomes]
      : incomes.map((i) => (i.id === incomeId ? newIncome : i));

    setIncomes(updated);
    saveIncomes(updated);
    if (userProfile?.companyId) {
      await upsertIncomeToDb(newIncome, userProfile.companyId);
    }

    if (newIncome.projectId) {
      await syncProjectPaidAmountFromIncomes(newIncome.projectId, updated, projects);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    const income = incomes.find((i) => i.id === incomeId);
    if (!income) return;

    if (window.confirm(`Excluir a receita "${income.description}"?`)) {
      const updated = incomes.filter((i) => i.id !== incomeId);
      setIncomes(updated);
      saveIncomes(updated);
      await deleteIncomeFromDb(incomeId);

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

    const updated = incomes.map((i) => (i.id === income.id ? updatedIncome : i));
    setIncomes(updated);
    saveIncomes(updated);
    if (userProfile?.companyId) {
      await upsertIncomeToDb(updatedIncome, userProfile.companyId);
    }

    if (income.projectId) {
      await syncProjectPaidAmountFromIncomes(income.projectId, updated, projects);
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

    const updated = isNew
      ? [newExpense, ...expenses]
      : expenses.map((e) => (e.id === expenseId ? newExpense : e));

    setExpenses(updated);
    saveExpenses(updated);
    if (userProfile?.companyId) {
      await upsertExpenseToDb(newExpense, userProfile.companyId);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    if (window.confirm(`Excluir a despesa "${expense.description}"?`)) {
      const updated = expenses.filter((e) => e.id !== expenseId);
      setExpenses(updated);
      saveExpenses(updated);
      await deleteExpenseFromDb(expenseId);
    }
  };

  const handleToggleExpensePaid = async (expense: Expense) => {
    const updatedExpense: Expense = {
      ...expense,
      paid: !expense.paid,
    };

    const updated = expenses.map((e) => (e.id === expense.id ? updatedExpense : e));
    setExpenses(updated);
    saveExpenses(updated);
    if (userProfile?.companyId) {
      await upsertExpenseToDb(updatedExpense, userProfile.companyId);
    }
  };

  const handleToggleProjectCommissionPaid = async (project: Project) => {
    const nextPaid = !project.commissionPaid;
    const updatedProject: Project = { ...project, commissionPaid: nextPaid };

    const updated = projects.map((p) => (p.id === project.id ? updatedProject : p));
    setProjects(updated);
    saveProjects(updated);
    if (userProfile?.companyId) {
      await upsertProjectToDb(updatedProject, userProfile.companyId);
    }
  };

  // ------------------------------------------------------------------
  // CRUD Handlers: Categories, Agenda, Partners, Settings
  // ------------------------------------------------------------------
  const handleSaveCategory = (categoryData: Omit<CategoryItem, 'id' | 'createdAt'> & { id?: string }) => {
    const isNew = !categoryData.id;
    const catId = categoryData.id || `cat-${Date.now()}`;
    const newCategory: CategoryItem = {
      ...categoryData,
      id: catId,
      createdAt: isNew ? getTodayIso() : (categories.find((c) => c.id === catId)?.createdAt || getTodayIso()),
    };
    const updated = isNew
      ? [newCategory, ...categories]
      : categories.map((c) => (c.id === catId ? newCategory : c));
    setCategories(updated);
    saveCategories(updated);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updated = categories.filter((c) => c.id !== categoryId);
    setCategories(updated);
    saveCategories(updated);
  };

  const handleSaveAgendaEvent = async (eventData: Omit<AgendaEvent, 'id' | 'createdAt'> & { id?: string }) => {
    const isNew = !eventData.id;
    const eventId = eventData.id || `evt-${Date.now()}`;
    const newEvent: AgendaEvent = {
      ...eventData,
      id: eventId,
      createdAt: isNew ? getTodayIso() : (agendaEvents.find((e) => e.id === eventId)?.createdAt || getTodayIso()),
    };
    const updated = isNew
      ? [newEvent, ...agendaEvents]
      : agendaEvents.map((e) => (e.id === eventId ? newEvent : e));
    setAgendaEvents(updated);
    if (userProfile?.companyId) {
      await upsertAgendaEventToDb(newEvent, userProfile.companyId);
    }
  };

  const handleDeleteAgendaEvent = async (eventId: string) => {
    setAgendaEvents((prev) => prev.filter((e) => e.id !== eventId));
    await deleteAgendaEventFromDb(eventId);
  };

  const handleToggleAgendaEventStatus = async (eventId: string) => {
    const evt = agendaEvents.find((e) => e.id === eventId);
    if (!evt) return;
    const nextStatus = evt.status === 'completed' ? 'pending' : 'completed';
    const updatedEvt: AgendaEvent = { ...evt, status: nextStatus };
    setAgendaEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvt : e)));
    if (userProfile?.companyId) {
      await upsertAgendaEventToDb(updatedEvt, userProfile.companyId);
    }
  };

  const handleSavePartner = async (partnerData: Omit<Partner, 'id' | 'createdAt'> & { id?: string }) => {
    const isNew = !partnerData.id;
    const partnerId = partnerData.id || `part-${Date.now()}`;
    const newPartner: Partner = {
      ...partnerData,
      id: partnerId,
      createdAt: isNew ? getTodayIso() : (partners.find((p) => p.id === partnerId)?.createdAt || getTodayIso()),
    };
    const updated = isNew
      ? [newPartner, ...partners]
      : partners.map((p) => (p.id === partnerId ? newPartner : p));
    setPartners(updated);
    savePartners(updated);
    if (userProfile?.companyId) {
      await upsertPartnerToDb(newPartner, userProfile.companyId);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) return;
    if (window.confirm(`Tem certeza que deseja excluir o parceiro "${partner.name}"?`)) {
      await deletePartnerFromDb(partnerId);
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    }
  };

  const handleResetData = () => {
    if (window.confirm('Deseja recarregar o sistema e sincronizar com o servidor?')) {
      clearAllData();
      window.location.reload();
    }
  };

  const handleClearData = () => {
    if (
      window.confirm(
        'ATENÇÃO: Deseja realmente limpar os dados locais do cache deste dispositivo? Os dados salvos no servidor permanecerão intactos.'
      )
    ) {
      clearAllData();
      setClients([]);
      setProjects([]);
      setIncomes([]);
      setExpenses([]);
      setPartners([]);
      setAgendaEvents([]);
      setBillingRequests([]);
    }
  };

  const handleExportData = () => {
    exportBackupData();
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
      alert('Dados restaurados e sincronizados com a base de dados com sucesso!');
    } else {
      alert('Erro ao importar arquivo de backup.');
    }
  };


  // ------------------------------------------------------------------
  // ROUTE GUARD
  // ------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#000000] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#747878] text-sm font-normal">A carregar permissões...</p>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return <LoginView onLoginSuccess={login} />;
  }

  const pendingBillingCount = billingRequests.filter(
    (r) => r.status === 'Solicitada' || r.status === 'Em análise'
  ).length;

  // Navigation Items Catalog
  const allNavItems = [
    { id: 'dashboard',  label: 'Painel Geral',       icon: LayoutDashboard },
    { id: 'calendar',   label: 'Agenda & Prazos',     icon: CalendarIcon, badge: agendaEvents.filter((e) => e.status === 'pending').length },
    { id: 'projects',   label: 'Projetos & Operações', icon: FolderKanban, badge: projects.filter((p) => p.status === 'Em andamento').length },
    { id: 'tasks',      label: 'Tarefas & Entregas',  icon: CheckSquare,  badge: tasks.filter((t) => t.status !== 'Concluída').length },
    { id: 'billing',    label: 'Faturamento & Pedidos', icon: FileText,   badge: pendingBillingCount > 0 ? pendingBillingCount : undefined },
    { id: 'clients',    label: 'Clientes & Contas',   icon: Users,        badge: clients.length },
    { id: 'financial',  label: 'Transações Financeiras', icon: DollarSign, badge: incomes.filter((i) => i.status === 'Pendente').length },
    { id: 'partners',   label: 'Gestão de Parceiros', icon: Handshake,    badge: partners.length },
    { id: 'categories', label: 'Categorias',          icon: Tag },
    { id: 'reports',    label: 'Relatórios',          icon: PieChart },
    { id: 'users',      label: 'Utilizadores & Cargos', icon: UserCog,    badge: isOwner ? companyUsers.length : undefined },
    { id: 'audit',      label: 'Registo de Auditoria', icon: History },
    { id: 'settings',   label: 'Configurações',       icon: Settings },
  ];

  // Filter nav items by user permissions
  const navItems = allNavItems.filter((item) => {
    if (item.id === 'audit') return isOwner;
    return visibleTabs.includes(item.id);
  });

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
        onOpenNewTaskModal={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
        onOpenNewUserModal={() => { setUserToEdit(null); setIsUserModalOpen(true); }}
        onOpenNewBillingModal={() => { setBillingRequestToReview(null); setIsBillingModalOpen(true); }}
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        userSession={userSession}
        onLogout={logout}
      />

      {/* Main App Container */}
      <div className="flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-60 shrink-0">
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
                    <span className="font-medium text-[13px]">{item.label}</span>
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

              <nav className="space-y-0.5 flex-1 overflow-y-auto">
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
                onClick={logout}
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
              tasks={tasks}
              billingRequests={billingRequests}
              settings={settings}
              currencyFilter={currencyFilter}
              onNavigateTab={handleNavigateTab}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
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
              onOpenNewProjectModal={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
              onEditProject={(p) => { setProjectToEdit(p); setIsProjectModalOpen(true); }}
              onDuplicateProject={handleDuplicateProject}
              onRateProject={handleRateProject}
              onDeleteProject={handleDeleteProject}
              onMarkProjectAsPaid={handleMarkProjectAsPaid}
              onAssumeProject={handleAssumeProject}
              onOpenWhatsAppCharge={handleOpenWhatsAppCharge}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              projects={projects}
              employees={companyUsers}
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
              expenses={expenses}
              settings={settings}
              currencyFilter={currencyFilter}
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
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              users={companyUsers}
              onOpenNewUserModal={() => { setUserToEdit(null); setIsUserModalOpen(true); }}
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
        employees={companyUsers}
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
      />

      <UserPermissionsModal
        isOpen={isUserPermsModalOpen}
        onClose={() => setIsUserPermsModalOpen(false)}
        user={userForPerms}
        currentPermissions={userPermsList}
        onSave={handleSaveUserPermissions}
      />
    </div>
  );
}
