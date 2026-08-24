import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Loader2 } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TASK_PRIORITY_LABELS, UserProfile } from '../../types/rbac';
import { Project } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task> & { title: string; companyId: string; createdBy: string }) => Promise<void>;
  taskToEdit?: Task | null;
  projects: Project[];
  employees: UserProfile[];
  companyId: string;
  currentUserId: string;
  canAssign?: boolean;
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  projects,
  employees,
  companyId,
  currentUserId,
  canAssign = true,
}: TaskModalProps) {
  const isEditing = !!taskToEdit;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Disponível');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setProjectId(taskToEdit.projectId || '');
        setStatus(taskToEdit.status);
        setPriority(taskToEdit.priority);
        setAssignedTo(taskToEdit.assignedTo || '');
        setDueDate(taskToEdit.dueDate || '');
        setNotes(taskToEdit.notes || '');
      } else {
        setTitle('');
        setDescription('');
        setProjectId('');
        setStatus('Disponível');
        setPriority('normal');
        setAssignedTo('');
        setDueDate('');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, taskToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave({
        id: taskToEdit?.id,
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: projectId || undefined,
        status,
        priority,
        assignedTo: assignedTo || undefined,
        assignedBy: assignedTo ? currentUserId : undefined,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        companyId,
        createdBy: taskToEdit?.createdBy || currentUserId,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar tarefa');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: TaskStatus[] = ['Disponível', 'Aguardando', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];
  const priorityOptions: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[24px] border border-[#c4c7c7]/30 shadow-[0_8px_40px_rgba(0,0,0,0.06)] w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#f7f3f2] p-5 border-b border-[#c4c7c7]/40 rounded-t-[24px] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-[#1c1b1b] text-base">{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-[#93000a] text-sm">{error}</div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Descrição da tarefa"
              required
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Estado
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all cursor-pointer"
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all cursor-pointer"
              >
                {priorityOptions.map(p => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Projeto (Opcional)
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Sem projeto específico</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canAssign && employees.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Atribuir a (Opcional)
              </label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Disponível para qualquer funcionário</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.role === 'admin' ? 'Admin' : 'Funcionário'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Prazo
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Descrição / Observações
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalhes da tarefa..."
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all resize-none"
            />
          </div>
        </form>

        <div className="p-5 border-t border-[#c4c7c7]/40 flex space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-[29px] bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-sm font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-5 py-2 bg-[#000000] hover:opacity-85 disabled:opacity-40 text-white font-medium text-sm rounded-[29px] flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'A guardar...' : isEditing ? 'Guardar' : 'Criar Tarefa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
