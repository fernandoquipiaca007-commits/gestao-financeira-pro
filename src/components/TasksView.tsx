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
} from 'lucide-react';
import {
  Task,
  TaskStatus,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  UserProfile,
} from '../types/rbac';
import { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
  employees: UserProfile[];
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
  onOpenNewTaskModal,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onAssignToMe,
}: TasksViewProps) {
  const { isOwner, hasPermission, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MINE' | 'AVAILABLE' | TaskStatus>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  const canCreate = isOwner || hasPermission('tasks.create');
  const canEdit = isOwner || hasPermission('tasks.edit');
  const canDelete = isOwner || hasPermission('tasks.delete');

  const projectMap = new Map(projects.map(p => [p.id, p.name]));
  const userMap = new Map(employees.map(e => [e.id, e.name]));

  // Filtering
  const filteredTasks = tasks.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProject = projectFilter === 'ALL' || t.projectId === projectFilter;

    let matchesStatus = true;
    if (statusFilter === 'MINE') {
      matchesStatus = t.assignedTo === userProfile?.id;
    } else if (statusFilter === 'AVAILABLE') {
      matchesStatus = t.status === 'Disponível' || !t.assignedTo;
    } else if (statusFilter !== 'ALL') {
      matchesStatus = t.status === statusFilter;
    }

    return matchesSearch && matchesProject && matchesStatus;
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

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1b1b] tracking-tight">Gestão de Tarefas</h1>
          <p className="text-sm text-[#747878] mt-1">
            Acompanhamento de entregas, atribuições e fluxo operacional
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => onOpenNewTaskModal()}
            className="inline-flex items-center space-x-2 bg-[#000000] hover:opacity-85 text-white px-5 py-2.5 rounded-[29px] text-sm font-medium transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Minhas Tarefas
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#0050d7]">{myTasksCount}</div>
        </div>

        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Em Andamento
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#7a5400]">{inProgressCount}</div>
        </div>

        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Disponíveis
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#003da9]">{availableCount}</div>
        </div>

        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Concluídas
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#1a6b3a]">{completedCount}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-[#c4c7c7]/40 rounded-[22px] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#747878] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar tarefas..."
            className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full pl-10 pr-4 py-2 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
          />
        </div>

        {/* Project selector */}
        {projects.length > 0 && (
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="w-full sm:w-48 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full px-4 py-2 text-xs text-[#1c1b1b] focus:outline-none focus:border-[#000000] cursor-pointer"
          >
            <option value="ALL">Todos os Projetos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {/* Status filter pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'ALL', label: 'Todas' },
              { key: 'MINE', label: 'Minhas' },
              { key: 'AVAILABLE', label: 'Disponíveis' },
              { key: 'Em andamento', label: 'Em Andamento' },
              { key: 'Concluída', label: 'Concluídas' },
            ] as const
          ).map(tab => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  isActive ? 'bg-[#000000] text-white' : 'text-[#444747] hover:bg-[#f1edec]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-[#c4c7c7]/40 rounded-[22px] p-8">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-[#c4c7c7]" strokeWidth={1.5} />
            <p className="font-semibold text-[#1c1b1b] text-base">Nenhuma tarefa encontrada</p>
            <p className="text-xs text-[#747878] mt-1">Crie novas tarefas ou ajuste os filtros acima</p>
            {canCreate && (
              <button
                onClick={() => onOpenNewTaskModal()}
                className="mt-4 inline-flex items-center space-x-2 bg-[#000000] text-white px-4 py-2 rounded-[29px] text-xs font-medium hover:opacity-85 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Tarefa</span>
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map(task => {
            const statusStyle = TASK_STATUS_COLORS[task.status] || { bg: '#f1edec', text: '#1c1b1b' };
            const priorityColor = TASK_PRIORITY_COLORS[task.priority] || { bg: '#f1edec', text: '#1c1b1b' };
            const isAssignedToMe = task.assignedTo === userProfile?.id;
            const isAvailable = task.status === 'Disponível' || !task.assignedTo;
            const projectName = task.projectId ? projectMap.get(task.projectId) : undefined;
            const assigneeName = task.assignedTo ? userMap.get(task.assignedTo) || task.assignedToName : undefined;

            return (
              <div
                key={task.id}
                className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top tags: Priority + Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: priorityColor.bg, color: priorityColor.text }}
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </span>

                    {/* Status dropdown / badge */}
                    <select
                      value={task.status}
                      onChange={e => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 border border-transparent focus:outline-none focus:border-[#000000] cursor-pointer"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-[#1c1b1b] text-base leading-snug mb-1">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-[#747878] line-clamp-2 leading-relaxed mb-3">
                      {task.description}
                    </p>
                  )}

                  {/* Project info */}
                  {projectName && (
                    <div className="inline-flex items-center space-x-1.5 text-xs text-[#0050d7] font-medium bg-[#dbe1ff]/60 px-2.5 py-1 rounded-full mb-3">
                      <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[200px]">{projectName}</span>
                    </div>
                  )}

                  {/* Meta: Assignee + Due date */}
                  <div className="space-y-1.5 pt-2 border-t border-[#c4c7c7]/30 text-xs text-[#747878]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#747878]" />
                        {assigneeName ? (
                          <span className="font-medium text-[#1c1b1b]">
                            {assigneeName} {isAssignedToMe && '(Tu)'}
                          </span>
                        ) : (
                          <span className="text-[#003da9] font-medium">Disponível</span>
                        )}
                      </span>

                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#747878]" />
                          <span>
                            {new Date(task.dueDate).toLocaleDateString('pt-PT', {
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
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#c4c7c7]/30">
                  {/* Assume task button if available */}
                  {isAvailable && onAssignToMe && !isAssignedToMe ? (
                    <button
                      onClick={() => onAssignToMe(task.id)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-[#0050d7] hover:bg-[#dbe1ff] px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                    >
                      <Hand className="w-3.5 h-3.5" />
                      <span>Assumir Tarefa</span>
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
                          ? 'text-[#1a6b3a] bg-[#d4eddf]'
                          : 'text-[#747878] hover:bg-[#f1edec] hover:text-[#1a6b3a]'
                      }`}
                      title={task.status === 'Concluída' ? 'Reabrir Tarefa' : 'Concluir Tarefa'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    {canEdit && (
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer transition-colors"
                        title="Editar Tarefa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete */}
                    {canDelete && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 rounded-full text-[#ba1a1a] hover:bg-[#ffdad6] cursor-pointer transition-colors"
                        title="Eliminar Tarefa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
