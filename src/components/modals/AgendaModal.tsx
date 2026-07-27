import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Bell, User, FolderKanban } from 'lucide-react';
import { AgendaEvent, AgendaEventType, Client, Project } from '../../types';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<AgendaEvent, 'id' | 'createdAt'> & { id?: string }) => void;
  eventToEdit?: AgendaEvent | null;
  clients: Client[];
  projects: Project[];
}

export function AgendaModal({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  clients,
  projects,
}: AgendaModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AgendaEventType>('compromisso');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [notifyPush, setNotifyPush] = useState(true);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setType(eventToEdit.type);
      setDate(eventToEdit.date);
      setTime(eventToEdit.time || '09:00');
      setClientId(eventToEdit.clientId || '');
      setProjectId(eventToEdit.projectId || '');
      setDescription(eventToEdit.description || '');
      setNotifyPush(eventToEdit.notifyPush ?? true);
    } else {
      setTitle('');
      setType('compromisso');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('09:00');
      setClientId('');
      setProjectId('');
      setDescription('');
      setNotifyPush(true);
    }
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    onSave({
      id: eventToEdit?.id,
      title: title.trim(),
      type,
      date,
      time: time || undefined,
      clientId: clientId || undefined,
      projectId: projectId || undefined,
      description: description.trim() || undefined,
      status: eventToEdit?.status || 'pending',
      notifyPush,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-lg">
              {eventToEdit ? 'Editar Evento da Agenda' : 'Novo Evento / Alarme'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Título do Evento *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cobrar cliente João, Entrega do Site..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tipo de Evento
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AgendaEventType)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all"
              >
                <option value="cobranca">🔔 Cobrança</option>
                <option value="pagamento">💰 Data de Pagamento</option>
                <option value="entrega">📦 Data de Entrega</option>
                <option value="compromisso">📅 Compromisso</option>
                <option value="alarme">⏰ Alarme / Lembrete</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Horário (Opcional)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Notificação Web Push
              </label>
              <label className="flex items-center space-x-2.5 bg-slate-950/80 border border-slate-800 px-3 py-2.5 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyPush}
                  onChange={(e) => setNotifyPush(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-300">Ativar no Navegador</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Cliente Associado
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all"
              >
                <option value="">-- Nenhum --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company || 'Pessoa Física'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Projeto Associado
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all"
              >
                <option value="">-- Nenhum --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Observações / Detalhes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções adicionais ou lembrete..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Salvar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
