import React, { useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners,
  useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { motion } from 'motion/react';
import { ChevronDown, Plus } from 'lucide-react';
import type { Project } from '../../types';
import type { Task, TaskStatus } from '../../types/rbac';
import { TaskCard, PRIORITY_ORDER } from './TaskCard';

const COLUMNS: { id: TaskStatus; pt: string; en: string; dot: string }[] = [
  { id: 'Disponível', pt: 'Disponível', en: 'Available', dot: 'var(--aura-ink-300)' },
  { id: 'Aguardando', pt: 'Aguardando', en: 'Waiting', dot: 'var(--warning)' },
  { id: 'Em andamento', pt: 'Em andamento', en: 'In progress', dot: 'var(--info)' },
  { id: 'Em revisão', pt: 'Em revisão', en: 'In review', dot: 'var(--accent)' },
  { id: 'Concluída', pt: 'Concluída', en: 'Done', dot: 'var(--success)' },
];

function sortTasks(a: Task, b: Task) {
  const p = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
  if (p) return p;
  return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
}

function DraggableCard({ task, children }: { task: Task; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { status: task.status } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} aria-roledescription="tarefa arrastável" className={`touch-manipulation outline-none rounded-lg focus-visible:shadow-[var(--focus-ring)] ${isDragging ? 'opacity-35' : ''}`}>
      {children}
    </div>
  );
}

function Column({ col, count, lang, onCreate, children }: { col: (typeof COLUMNS)[number]; count: number; lang: 'pt' | 'en'; onCreate?: () => void; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const en = lang === 'en';
  return (
    <section
      ref={setNodeRef}
      aria-label={en ? col.en : col.pt}
      className={`snap-start shrink-0 w-[300px] lg:w-auto min-w-0 flex flex-col rounded-xl p-2.5 transition-colors duration-200 ${isOver ? 'bg-accent-soft ring-2 ring-[var(--accent-ring)]' : 'aura-glass aura-glass--subtle !rounded-xl'}`}
    >
      <header className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
        <span className="w-2 h-2 rounded-full" style={{ background: col.dot }} aria-hidden />
        <h3 className="m-0 text-[13.5px] font-semibold text-fg font-sans">{en ? col.en : col.pt}</h3>
        <span className="aura-count aura-count--muted">{count}</span>
        {onCreate && (
          <button type="button" onClick={onCreate} className="ml-auto aura-icon-btn aura-icon-btn--sm !w-7 !h-7 !bg-transparent !border-transparent !shadow-none hover:!bg-sunken" aria-label={en ? 'New task' : 'Nova tarefa'}>
            <Plus />
          </button>
        )}
      </header>
      <div className="flex-1 grid grid-cols-[minmax(0,1fr)] content-start gap-2.5 min-h-[120px]">{children}</div>
    </section>
  );
}

interface Props {
  tasks: Task[];
  projects: Project[];
  lang: 'pt' | 'en';
  onMove: (taskId: string, status: TaskStatus) => void;
  onOpen: (task: Task) => void;
  onCreate: () => void;
}

/** Quadro Kanban: arrastar muda o estado. Ordem na coluna = prioridade e depois prazo. */
export function TaskBoard({ tasks, projects, lang, onMove, onOpen, onCreate }: Props) {
  const en = lang === 'en';
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCanceled, setShowCanceled] = useState(false);
  const projectName = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const byStatus = useMemo(() => {
    const m = new Map<TaskStatus, Task[]>();
    tasks.forEach((t) => m.set(t.status, [...(m.get(t.status) || []), t]));
    m.forEach((list) => list.sort(sortTasks));
    return m;
  }, [tasks]);
  const active = activeId ? tasks.find((t) => t.id === activeId) : undefined;
  const canceled = byStatus.get('Cancelada') || [];

  const onStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const to = e.over?.id as TaskStatus | undefined;
    const from = e.active.data.current?.status as TaskStatus | undefined;
    if (to && from && to !== from) onMove(String(e.active.id), to);
  };

  const announcements = {
    onDragStart: ({ active: a }: { active: { id: string | number } }) => (en ? `Picked up task ${tasks.find((t) => t.id === a.id)?.title}.` : `Tarefa ${tasks.find((t) => t.id === a.id)?.title} selecionada.`),
    onDragOver: ({ over }: { over: { id: string | number } | null }) => (over ? (en ? `Over column ${over.id}.` : `Sobre a coluna ${over.id}.`) : ''),
    onDragEnd: ({ over }: { over: { id: string | number } | null }) => (over ? (en ? `Moved to ${over.id}.` : `Movida para ${over.id}.`) : (en ? 'Cancelled.' : 'Cancelado.')),
    onDragCancel: () => (en ? 'Cancelled.' : 'Cancelado.'),
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActiveId(null)} accessibility={{ announcements }}>
      <div className="flex lg:grid lg:grid-cols-5 gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 aura-scroll">
        {COLUMNS.map((col) => {
          const list = byStatus.get(col.id) || [];
          return (
            <Column key={col.id} col={col} count={list.length} lang={lang} onCreate={col.id === 'Disponível' || col.id === 'Em andamento' ? onCreate : undefined}>
              {list.map((t) => (
                <motion.div key={t.id} layout transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
                  <DraggableCard task={t}>
                    <TaskCard task={t} projectName={t.projectId ? projectName.get(t.projectId) : undefined} lang={lang} onOpen={() => onOpen(t)} />
                  </DraggableCard>
                </motion.div>
              ))}
              {list.length === 0 && (
                <div className="grid place-items-center rounded-lg border border-dashed border-[var(--border-dashed)] py-8 text-[12.5px] text-fg-muted">
                  {en ? 'Drop tasks here' : 'Largue tarefas aqui'}
                </div>
              )}
            </Column>
          );
        })}
      </div>

      {canceled.length > 0 && (
        <div className="mt-3">
          <button type="button" onClick={() => setShowCanceled((v) => !v)} className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg cursor-pointer">
            <ChevronDown className={`w-4 h-4 transition-transform ${showCanceled ? 'rotate-180' : ''}`} />
            {en ? `Cancelled (${canceled.length})` : `Canceladas (${canceled.length})`}
          </button>
          {showCanceled && (
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {canceled.map((t) => <TaskCard key={t.id} task={t} lang={lang} projectName={t.projectId ? projectName.get(t.projectId) : undefined} onOpen={() => onOpen(t)} />)}
            </div>
          )}
        </div>
      )}

      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        {active ? <TaskCard task={active} lang={lang} lifted projectName={active.projectId ? projectName.get(active.projectId) : undefined} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
