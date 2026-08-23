import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { AgendaEvent, AgendaEventType, Client, Project } from '../../types';
import { requestNotificationPermission } from '../../lib/webpush';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    if (notifyPush && 'Notification' in window && Notification.permission !== 'granted') {
      await requestNotificationPermission();
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm font-sans">
      <div className="bg-white border border-[#c4c7c7]/30 rounded-[24px] w-full max-w-lg shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#c4c7c7]/40 bg-[#f7f3f2]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="font-semibold text-[#1c1b1b] text-base">
              {eventToEdit ? 'Editar Evento da Agenda' : 'Novo Evento / Alarme'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Título do Evento *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cobrar cliente João, Entrega do Site..."
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Tipo de Evento
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AgendaEventType)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              >
                <option value="cobranca">🔔 Cobrança</option>
                <option value="pagamento">💰 Data de Pagamento</option>
                <option value="entrega">📦 Data de Entrega</option>
                <option value="compromisso">📅 Compromisso</option>
                <option value="alarme">⏰ Alarme / Lembrete</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Horário (Opcional)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#747878] absolute left-3 top-3" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Notificação Web Push
              </label>
              <label className="flex items-center space-x-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 px-3.5 py-2.5 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyPush}
                  onChange={(e) => setNotifyPush(e.target.checked)}
                  className="w-4 h-4 rounded text-[#000000] focus:ring-0 accent-[#000000]"
                />
                <span className="text-xs font-medium text-[#1c1b1b]">Ativar no Navegador</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Cliente Associado
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
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
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Projeto Associado
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
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
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Observações / Detalhes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções adicionais ou lembrete..."
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#c4c7c7]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[29px] bg-[#f1edec] text-[#1c1b1b] text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#000000] hover:opacity-85 text-white text-sm font-medium rounded-[29px] cursor-pointer active:scale-95 transition-all"
            >
              Salvar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
