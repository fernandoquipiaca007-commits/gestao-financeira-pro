import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  User,
  FolderKanban,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hand,
  Tag,
  LayoutList,
  LayoutGrid,
  Columns3,
} from 'lucide-react';
import {
  Task,
  TaskStatus,
  TASK_STATUS_COLORS,
  TASK_STATUS_BADGE_CLASSES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_BADGE_CLASSES,
  UserProfile,
  getTaskStatusLabel,
  getTaskPriorityLabel,
} from '../types/rbac';
import { Project, CategoryItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TaskBoard } from './tasks/TaskBoard';

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
  employees: UserProfile[];
  categories?: CategoryItem[];
  initialCategoryFilter?: string;
  onOpenNewTaskModal: (defaultProjectId?: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAssignToMe?: (taskId: string) => void;
}

export function TasksView({
  tasks,
  projects,
  employees,
  categories = [],
  initialCategoryFilter,
  onOpenNewTaskModal,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onAssignToMe,
}: TasksViewProps) {
  const { isOwner, hasPermission, userProfile } = useAuth();
  const { lang, isEn, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  // O filtro que chega de outros ecrãs (painel) pode ser: "task:<id>" (abrir essa tarefa),
  // "MINE"/"AVAILABLE"/um estado (filtro de estado) ou o nome de uma categoria.
  const STATUS_KEYS = ['MINE', 'AVAILABLE', 'Disponível', 'Aguardando', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];
  const incoming = initialCategoryFilter || '';
  const isStatusKey = STATUS_KEYS.includes(incoming);
  const isTaskKey = incoming.startsWith('task:');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MINE' | 'AVAILABLE' | TaskStatus>(isStatusKey ? (incoming as TaskStatus) : 'ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>(incoming && !isStatusKey && !isTaskKey ? incoming : 'ALL');
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'grouped'>('board');

  // Sync the incoming filter when it changes externally
  React.useEffect(() => {
    if (!incoming) return;
    if (incoming.startsWith('task:')) {
      const task = tasks.find((x) => x.id === incoming.slice('task:'.length));
      if (task) onEditTask(task);
    } else if (STATUS_KEYS.includes(incoming)) {
      setStatusFilter(incoming as TaskStatus);
    } else {
      setCategoryFilter(incoming);
    }
    // só reage a um filtro novo; a lista de tarefas pode mudar sem reabrir a tarefa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  const canCreate = isOwner || hasPermission('tasks.create');
  const canEdit = isOwner || hasPermission('tasks.edit');
  const canDelete = isOwner || hasPermission('tasks.delete');

  const projectMap = new Map((projects || []).filter(Boolean).map(p => [p.id, p]));
  const userMap = new Map((employees || []).filter(Boolean).map(e => [e.id, e?.name || '']));
  const categoryColorMap = new Map((categories || []).filter(c => c?.name).map(c => [c.name.toLowerCase(), c.color]));

  // Helper to resolve task category (explicit or inherited from project)
  const getTaskCategory = (task: Task): string => {
    if (task.category) return task.category;
    if (task.projectId) {
      const proj = projectMap.get(task.projectId);
      if (proj?.category) return proj.category;
    }
    return isEn ? 'Uncategorized' : 'Sem Categoria';
  };

  const getCategoryColor = (catName: string): string => {
    return categoryColorMap.get(catName.toLowerCase()) || '#0050d7';
  };

  // Filtering
  const filteredTasks = tasks.filter(t => {
    const taskCat = getTaskCategory(t);
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      taskCat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = projectFilter === 'ALL' || t.projectId === projectFilter;
    const matchesCategory = categoryFilter === 'ALL' || taskCat.toLowerCase() === categoryFilter.toLowerCase();

    let matchesStatus = true;
    if (statusFilter === 'MINE') {
      matchesStatus = t.assignedTo === userProfile?.id;
    } else if (statusFilter === 'AVAILABLE') {
      matchesStatus = t.status === 'Disponível' || !t.assignedTo;
    } else if (statusFilter !== 'ALL') {
      matchesStatus = t.status === statusFilter;
    }

    return matchesSearch && matchesProject && matchesCategory && matchesStatus;
  });

  const totalTasks = tasks.length;
  const inProgressCount = tasks.filter(t => t.status === 'Em andamento').length;
  const myTasksCount = tasks.filter(t => t.assignedTo === userProfile?.id && t.status !== 'Concluída').length;
  const availableCount = tasks.filter(t => t.status === 'Disponível' || !t.assignedTo).length;
  const completedCount = tasks.filter(t => t.status === 'Concluída').length;

  const statusOptions: TaskStatus[] = [
    'Disponível',
    'Aguardando',
    'Em andamento',
    'Em revisão',
    'Concluída',
    'Cancelada',
  ];

  // Distinct categories available in tasks or configured in system
  const allCategoryNames = Array.from(
    new Set([
      ...(categories || []).filter(c => c?.name && c.type !== 'expense').map(c => c.name),
      ...tasks.map(t => getTaskCategory(t)).filter(c => c !== 'Sem Categoria' && c !== 'Uncategorized'),
    ])
  );

  const renderTaskCard = (task: Task) => {
    const statusBadgeClass = TASK_STATUS_BADGE_CLASSES[task.status] || 'bg-surface-2 text-fg ';
    const priorityBadgeClass = TASK_PRIORITY_BADGE_CLASSES[task.priority] || 'bg-surface-2 text-fg ';
    const isAssignedToMe = task.assignedTo === userProfile?.id;
    const isAvailable = task.status === 'Disponível' || !task.assignedTo;
    const proj = task.projectId ? projectMap.get(task.projectId) : undefined;
    const projectName = proj?.name;
    const assigneeName = task.assignedTo ? userMap.get(task.assignedTo) || task.assignedToName : undefined;
    const taskCat = getTaskCategory(task);
    const catColor = getCategoryColor(taskCat);

    return (
      <div
        key={task.id}
        className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between"
      >
        <div>
          {/* Top tags: Priority + Status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${priorityBadgeClass}`}
            >
              {getTaskPriorityLabel(task.priority, lang)}
            </span>

            {/* Status dropdown / badge */}
            <select
              value={task.status}
              data-badge="true"
              onChange={e => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
              className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer transition-colors ${statusBadgeClass}`}
            >
              {statusOptions.map(s => (
                <option key={s} value={s} className="bg-glass-strong text-fg ">
                  {getTaskStatusLabel(s, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Description */}
          <h3 className="font-semibold text-fg text-base leading-snug mb-1">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed mb-3">
              {task.description}
            </p>
          )}

          {/* Category & Project Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {taskCat && taskCat !== 'Sem Categoria' && taskCat !== 'Uncategorized' && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  backgroundColor: `${catColor}15`,
                  color: catColor,
                  border: `1px solid ${catColor}35`,
                }}
              >
                <Tag className="w-3 h-3" />
                <span>{taskCat}</span>
              </span>
            )}

            {projectName && (
              <div className="inline-flex items-center space-x-1 text-xs text-accent-soft-fg font-medium bg-accent-soft/60 px-2.5 py-0.5 rounded-full">
                <FolderKanban className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[160px]">{projectName}</span>
              </div>
            )}
          </div>

          {/* Meta: Assignee + Due date */}
          <div className="space-y-1.5 pt-2 border-t border-line-subtle text-xs text-fg-muted ">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-fg-muted " />
                {assigneeName ? (
                  <span className="font-medium text-fg ">
                    {assigneeName} {isAssignedToMe && (isEn ? '(You)' : '(Tu)')}
                  </span>
                ) : (
                  <span className="text-accent-soft-fg font-medium">{isEn ? 'Available' : 'Disponível'}</span>
                )}
              </span>

              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-fg-muted " />
                  <span>
                    {new Date(task.dueDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-PT', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer action buttons */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-line-subtle ">
          {/* Assume task button if available */}
          {isAvailable && onAssignToMe && !isAssignedToMe ? (
            <button
              onClick={() => onAssignToMe(task.id)}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-accent-soft-fg hover:bg-accent-soft px-2.5 py-1 rounded-full cursor-pointer transition-colors"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>{isEn ? 'Take on Task' : 'Assumir Tarefa'}</span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center space-x-1 ml-auto">
            {/* Quick complete toggle */}
            <button
              onClick={() =>
                onUpdateTaskStatus(
                  task.id,
                  task.status === 'Concluída' ? 'Em andamento' : 'Concluída'
                )
              }
              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
 task.status === 'Concluída'
 ? 'text-success-fg bg-success-soft '
 : 'text-fg-muted hover:bg-sunken hover:text-success-fg'
 }`}
              title={task.status === 'Concluída' ? (isEn ? 'Reopen Task' : 'Reabrir Tarefa') : (isEn ? 'Complete Task' : 'Concluir Tarefa')}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>

            {/* Edit */}
            {canEdit && (
              <button
                onClick={() => onEditTask(task)}
                className="p-1.5 rounded-full text-fg-muted hover:bg-sunken hover:text-fg cursor-pointer transition-colors"
                title={isEn ? 'Edit task' : 'Editar tarefa'}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {/* Delete */}
            {canDelete && (
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-1.5 rounded-full text-danger-fg hover:bg-danger-soft cursor-pointer transition-colors"
                title={isEn ? 'Delete Task' : 'Eliminar Tarefa'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">
            {isEn ? 'Tasks' : 'Tarefas'}
          </h1>
          <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
            {isEn ? 'Drag cards between columns to update their status.' : 'Arraste os cartões entre colunas para atualizar o estado.'}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => onOpenNewTaskModal()}
            className="aura-btn aura-btn--primary inline-flex shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'New task' : 'Nova tarefa'}</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
          <span className="text-[13px] font-medium text-fg-secondary block mb-1">
            {isEn ? 'My tasks' : 'Minhas tarefas'}
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-accent-soft-fg ">{myTasksCount}</div>
        </div>

        <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
          <span className="text-[13px] font-medium text-fg-secondary block mb-1">
            {isEn ? 'In progress' : 'Em andamento'}
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-warning-fg ">{inProgressCount}</div>
        </div>

        <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
          <span className="text-[13px] font-medium text-fg-secondary block mb-1">
            {isEn ? 'Available' : 'Disponíveis'}
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-accent-soft-fg ">{availableCount}</div>
        </div>

        <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
          <span className="text-[13px] font-medium text-fg-secondary block mb-1">
            {isEn ? 'Completed' : 'Concluídas'}
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-success-fg ">{completedCount}</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-glass border border-line-subtle rounded-xl p-3 shadow-glass">
        {/* Search */}
        <div className="relative w-full sm:w-64 xl:w-72">
          <Search className="w-4 h-4 text-fg-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search tasks...' : 'Pesquisar tarefas...'}
            className="w-full bg-surface-2 border border-line-subtle rounded-full pl-10 pr-4 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
          />
        </div>

        {/* Category selector */}
        <div className="flex items-center space-x-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-48">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full bg-surface-2 border border-line-subtle rounded-full pl-8 pr-4 py-2 text-xs font-medium text-fg focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">{isEn ? 'All categories' : 'Todas as categorias'}</option>
              {allCategoryNames.map(cat => (
                <option key={cat} value={cat}>
                  ● {cat}
                </option>
              ))}
            </select>
            <Tag className="w-3.5 h-3.5 text-fg-muted absolute left-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Project selector */}
        {projects.length > 0 && (
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="w-full sm:w-48 bg-surface-2 border border-line-subtle rounded-full px-4 py-2 text-xs text-fg focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">{isEn ? 'All projects' : 'Todos os projetos'}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {/* Status filter pills */}
        <div className="order-last basis-full flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              { key: 'ALL', label: isEn ? 'All' : 'Todas' },
              { key: 'MINE', label: isEn ? 'Mine' : 'Minhas' },
              { key: 'AVAILABLE', label: isEn ? 'Available' : 'Disponíveis' },
              { key: 'Em andamento', label: isEn ? 'In progress' : 'Em andamento' },
              { key: 'Concluída', label: isEn ? 'Completed' : 'Concluídas' },
            ] as const
          ).map(tab => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
 isActive
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Vista: Quadro (Kanban) · Lista · Por categoria */}
        <div className="aura-segmented shrink-0 ml-auto" role="radiogroup" aria-label={isEn ? 'View' : 'Vista'}>
          {([
            { id: 'board', label: isEn ? 'Board' : 'Quadro', icon: Columns3 },
            { id: 'list', label: isEn ? 'List' : 'Lista', icon: LayoutList },
            { id: 'grouped', label: isEn ? 'By category' : 'Por categoria', icon: LayoutGrid },
          ] as const).map((v) => (
            <button key={v.id} type="button" role="radio" aria-checked={viewMode === v.id} onClick={() => setViewMode(v.id)} className="aura-segmented__item inline-flex items-center gap-1.5">
              <v.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo: Quadro, Por categoria ou Lista */}
      {viewMode === 'board' ? (
        <TaskBoard tasks={filteredTasks} projects={projects} lang={isEn ? 'en' : 'pt'} onMove={onUpdateTaskStatus} onOpen={onEditTask} onCreate={() => onOpenNewTaskModal()} />
      ) : viewMode === 'grouped' ? (
        <div className="space-y-6">
          {allCategoryNames.map(categoryName => {
            const categoryTasks = filteredTasks.filter(
              t => getTaskCategory(t).toLowerCase() === categoryName.toLowerCase()
            );
            if (categoryTasks.length === 0 && categoryFilter !== 'ALL') return null;
            const catColor = getCategoryColor(categoryName);

            return (
              <div
                key={categoryName}
                className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-line-subtle ">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                    <h3 className="font-semibold text-base text-fg ">{categoryName}</h3>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${catColor}15`, color: catColor }}
                    >
                      {categoryTasks.length} {categoryTasks.length === 1 ? (isEn ? 'task' : 'tarefa') : (isEn ? 'tasks' : 'tarefas')}
                    </span>
                  </div>
                  {canCreate && (
                    <button
                      onClick={() => onOpenNewTaskModal()}
                      className="inline-flex items-center space-x-1 text-xs font-medium text-accent-soft-fg hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isEn ? 'New in this category' : 'Nova nesta categoria'}</span>
                    </button>
                  )}
                </div>

                {categoryTasks.length === 0 ? (
                  <div className="py-6 text-center text-fg-muted text-xs">
                    {isEn ? 'No tasks in this category at the moment.' : 'Nenhuma tarefa nesta categoria no momento.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTasks.map(task => renderTaskCard(task))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Tasks without Category */}
          {(() => {
            const uncategorizedTasks = filteredTasks.filter(t => getTaskCategory(t) === 'Sem Categoria');
            if (uncategorizedTasks.length === 0) return null;
            return (
              <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-line-subtle ">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 bg-fg-muted" />
                    <h3 className="font-semibold text-base text-fg ">
                      {isEn ? 'Uncategorized' : 'Sem Categoria'}
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 text-fg-muted ">
                      {uncategorizedTasks.length} {uncategorizedTasks.length === 1 ? (isEn ? 'task' : 'tarefa') : (isEn ? 'tasks' : 'tarefas')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uncategorizedTasks.map(task => renderTaskCard(task))}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Regular List / Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-glass border border-line-subtle rounded-xl p-8">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 text-fg-disabled " strokeWidth={1.5} />
              <p className="font-semibold text-fg text-base">
                {isEn ? 'No tasks found' : 'Nenhuma tarefa encontrada'}
              </p>
              <p className="text-xs text-fg-muted mt-1">
                {isEn ? 'Create new tasks or adjust filters above' : 'Crie novas tarefas ou ajuste os filtros acima'}
              </p>
              {canCreate && (
                <button
                  onClick={() => onOpenNewTaskModal()}
                  className="aura-btn aura-btn--primary aura-btn--sm mt-4 inline-flex"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Create Task' : 'Criar Tarefa'}</span>
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map(task => renderTaskCard(task))
          )}
        </div>
      )}
    </div>
  );
}
