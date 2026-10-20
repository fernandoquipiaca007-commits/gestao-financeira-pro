import React, { useState, useEffect } from 'react';
import { EditorPage } from '../shell/EditorPage';
import { X, CheckSquare, Loader2, Tag } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, UserProfile, getTaskPriorityLabel, getTaskStatusLabel } from '../../types/rbac';
import { Project, CategoryItem } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { RichTextField } from '../editor/RichTextField';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task> & { title: string; companyId: string; createdBy: string; category?: string }) => Promise<void>;
  taskToEdit?: Task | null;
  projects: Project[];
  employees: UserProfile[];
  categories?: CategoryItem[];
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
  categories = [],
  companyId,
  currentUserId,
  canAssign = true,
}: TaskModalProps) {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const isEditing = !!taskToEdit;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
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
        setCategory(taskToEdit.category || '');
        setProjectId(taskToEdit.projectId || '');
        setStatus(taskToEdit.status);
        setPriority(taskToEdit.priority);
        setAssignedTo(taskToEdit.assignedTo || '');
        setDueDate(taskToEdit.dueDate || '');
        setNotes(taskToEdit.notes || '');
      } else {
        setTitle('');
        setDescription('');
        setCategory('');
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
      setError(isEn ? 'Title is required' : 'O título é obrigatório');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave({
        id: taskToEdit?.id,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        projectId: projectId || undefined,
        status,
        priority,
        assignedTo: assignedTo || undefined,
        assignedBy: assignedTo ? currentUserId : undefined,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        companyId: companyId || 'default_company',
        createdBy: taskToEdit?.createdBy || currentUserId || 'anonymous',
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? 'Error saving task' : 'Erro ao guardar tarefa');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: TaskStatus[] = ['Disponível', 'Aguardando', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];
  const priorityOptions: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

  const handleProjectSelect = (pId: string) => {
    setProjectId(pId);
    if (pId && !category) {
      const selectedProj = projects.find(p => p.id === pId);
      if (selectedProj?.category) {
        setCategory(selectedProj.category);
      }
    }
  };

  return (
    <EditorPage
      title={<>{isEditing ? (isEn ? 'Edit task' : 'Editar tarefa') : (isEn ? 'New task' : 'Nova tarefa')}</>}
      trail={[isEn ? 'Tasks' : 'Tarefas']}
      
      icon={<CheckSquare className="w-5 h-5" />}
      onClose={onClose}
      actions={<>
          <button
            type="button"
            onClick={onClose}
            className="aura-btn aura-btn--ghost"
          >
            {isEn ? 'Cancel' : 'Cancelar'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="aura-btn aura-btn--primary"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? (isEn ? 'Saving...' : 'A guardar...') : isEditing ? (isEn ? 'Save' : 'Guardar') : (isEn ? 'Create Task' : 'Criar Tarefa')}</span>
          </button>
        </>}
    >
      <form id="task-form" className="space-y-6 text-fg" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-danger-soft border border-danger/20 rounded-md text-danger-fg text-sm">{error}</div>
          )}

          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Title *' : 'Título *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isEn ? 'Task title' : 'Descrição da tarefa'}
              required
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>

          {/* Categoria do Sistema */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent-soft-fg " />
              {isEn ? 'Category' : 'Categoria'}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg font-medium focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
            >
              <option value="" className="bg-glass-strong text-fg ">
                {isEn ? 'No category set' : 'Sem categoria definida'}
              </option>
              {categories.map(c => (
                <option key={c.id} value={c.name} className="bg-glass-strong text-fg ">
                  ● {c.name} ({c.type === 'income' ? (isEn ? 'Income' : 'Receita') : c.type === 'expense' ? (isEn ? 'Expense' : 'Despesa') : (isEn ? 'Project' : 'Projeto')})
                </option>
              ))}
              {/* Presets if no custom category created yet */}
              {categories.length === 0 && (
                <>
                  <option value="Tráfego Pago" className="bg-glass-strong text-fg ">● {isEn ? 'Paid Traffic' : 'Tráfego Pago'}</option>
                  <option value="Desenvolvimento Web" className="bg-glass-strong text-fg ">● {isEn ? 'Web Development' : 'Desenvolvimento Web'}</option>
                  <option value="Consultoria" className="bg-glass-strong text-fg ">● {isEn ? 'Consulting' : 'Consultoria'}</option>
                  <option value="Hospedagem" className="bg-glass-strong text-fg ">● {isEn ? 'Hosting' : 'Hospedagem'}</option>
                  <option value="Domínio" className="bg-glass-strong text-fg ">● {isEn ? 'Domain' : 'Domínio'}</option>
                  <option value="Design" className="bg-glass-strong text-fg ">● Design</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Status' : 'Estado'}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                {statusOptions.map(s => (
                  <option key={s} value={s} className="bg-glass-strong text-fg ">
                    {getTaskStatusLabel(s, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Priority' : 'Prioridade'}
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                {priorityOptions.map(p => (
                  <option key={p} value={p} className="bg-glass-strong text-fg ">
                    {getTaskPriorityLabel(p, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Project (Optional)' : 'Projeto (Opcional)'}
              </label>
              <select
                value={projectId}
                onChange={e => handleProjectSelect(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                <option value="" className="bg-glass-strong text-fg ">
                  {isEn ? 'No specific project' : 'Sem projeto específico'}
                </option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-glass-strong text-fg ">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canAssign && employees.length > 0 && (
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Assign to (Optional)' : 'Atribuir a (Opcional)'}
              </label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                <option value="" className="bg-glass-strong text-fg ">
                  {isEn ? 'Available to any employee' : 'Disponível para qualquer funcionário'}
                </option>
                {employees.map(e => (
                  <option key={e.id} value={e.id} className="bg-glass-strong text-fg ">
                    {e.name} ({e.role === 'admin' ? (isEn ? 'Admin' : 'Admin') : (isEn ? 'Employee' : 'Funcionário')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Due Date' : 'Prazo'}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>

          <RichTextField
            id="task-description"
            label={isEn ? 'Description' : 'Descrição'}
            value={description}
            onChange={setDescription}
            lang={isEn ? 'en' : 'pt'}
            template="task"
          />
        </form>
    </EditorPage>
  );
}
