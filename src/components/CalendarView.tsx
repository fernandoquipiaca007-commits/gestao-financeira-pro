import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
  Filter,
  Search,
} from 'lucide-react';
import { AgendaEvent, AgendaEventType, Client, Project, Income, Expense } from '../types';
import { requestNotificationPermission, sendWebPushNotification } from '../lib/webpush';

interface CalendarViewProps {
  agendaEvents: AgendaEvent[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  clients: Client[];
  onOpenNewEventModal: (date?: string) => void;
  onEditEvent: (event: AgendaEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleEventStatus: (eventId: string) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
}

export function CalendarView({
  agendaEvents,
  projects,
  incomes,
  expenses,
  clients,
  onOpenNewEventModal,
  onEditEvent,
  onDeleteEvent,
  onToggleEventStatus,
  onOpenWhatsAppCharge,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pushStatus, setPushStatus] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayIso = new Date().toISOString().split('T')[0];

  // Request Web Push Permission
  const handleEnablePush = async () => {
    const perm = await requestNotificationPermission();
    setPushStatus(perm);
    if (perm === 'granted') {
      sendWebPushNotification('Notificações Ativadas! 🔔', {
        body: 'O sistema de Gestão Financeira agora irá te alertar sobre compromissos e cobranças.',
      });
    }
  };

  // Build combined events map: manual AgendaEvents + auto generated events from Projects/Incomes/Expenses
  const allCombinedEvents = useMemo(() => {
    const list: Array<AgendaEvent & { isAuto?: boolean }> = [...agendaEvents];

    // Auto events from Incomes
    incomes.forEach((inc) => {
      const client = clients.find((c) => c.id === inc.clientId);
      const isOverdue = inc.status === 'Atrasado' || (inc.status === 'Pendente' && inc.dueDate < todayIso);
      list.push({
        id: `auto-inc-${inc.id}`,
        title: `Cobrança: ${inc.description}`,
        type: 'cobranca',
        date: inc.dueDate,
        clientId: inc.clientId,
        projectId: inc.projectId,
        description: `Valor: ${inc.currency} ${inc.amount.toLocaleString()} - Status: ${inc.status}`,
        status: inc.status === 'Recebido' ? 'completed' : 'pending',
        isAuto: true,
        createdAt: inc.createdAt,
      });
    });

    // Auto events from Projects
    projects.forEach((proj) => {
      if (proj.dueDate) {
        list.push({
          id: `auto-proj-${proj.id}`,
          title: `Entrega de Projeto: ${proj.name}`,
          type: 'entrega',
          date: proj.dueDate,
          clientId: proj.clientId,
          projectId: proj.id,
          description: `Categoria: ${proj.category} - Status: ${proj.status}`,
          status: proj.status === 'Concluído' ? 'completed' : 'pending',
          isAuto: true,
          createdAt: proj.createdAt,
        });
      }
    });

    // Auto events from Expenses
    expenses.forEach((exp) => {
      list.push({
        id: `auto-exp-${exp.id}`,
        title: `Vencimento Despesa: ${exp.description}`,
        type: 'pagamento',
        date: exp.date,
        description: `Categoria: ${exp.category} - Valor: ${exp.currency} ${exp.amount.toLocaleString()}`,
        status: exp.paid ? 'completed' : 'pending',
        isAuto: true,
        createdAt: exp.createdAt,
      });
    });

    return list;
  }, [agendaEvents, incomes, projects, expenses, clients, todayIso]);

  // Calendar Grid Days Calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: Array<{ dateIso: string; dayNum: number; isCurrentMonth: boolean }> = [];
    
    // Days from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const pDay = prevMonthDays - i;
      const pMonth = month === 0 ? 11 : month - 1;
      const pYear = month === 0 ? year - 1 : year;
      const dateIso = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
      days.push({ dateIso, dayNum: pDay, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateIso, dayNum: i, isCurrentMonth: true });
    }

    // Fill remaining days of 42 grid cells
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nMonth = month === 11 ? 0 : month + 1;
      const nYear = month === 11 ? year + 1 : year;
      const dateIso = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateIso, dayNum: i, isCurrentMonth: false });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth]);

  // Map events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof allCombinedEvents> = {};
    allCombinedEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [allCombinedEvents]);

  // Selected date filtered events
  const selectedDateEvents = useMemo(() => {
    let list = eventsByDate[selectedDate] || [];
    if (typeFilter !== 'ALL') {
      list = list.filter((e) => e.type === typeFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (e) => e.title.toLowerCase().includes(term) || (e.description && e.description.toLowerCase().includes(term))
      );
    }
    return list;
  }, [eventsByDate, selectedDate, typeFilter, searchTerm]);

  const getTypeBadgeStyle = (type: AgendaEventType) => {
    switch (type) {
      case 'cobranca':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'pagamento':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'entrega':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'alarme':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Push Notification Permission Banner */}
      {pushStatus !== 'granted' && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Ativar Notificações Web Push do Navegador</h4>
              <p className="text-xs text-slate-400">
                Receba alertas automáticos de cobrança, entregas e alarmes no seu computador mesmo minimizado.
              </p>
            </div>
          </div>
          <button
            onClick={handleEnablePush}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            Ativar Agora
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Agenda & Calendário Real</h2>
            <p className="text-xs text-slate-400">Sincronizado com cobranças, compromissos e prazos de entrega</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => onOpenNewEventModal(selectedDate)}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento / Alarme</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar left, Event List right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">
              {monthNames[month]} <span className="text-emerald-400">{year}</span>
            </h3>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedDate(todayIso)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all"
              >
                Hoje
              </button>
              <button
                onClick={prevMonth}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <span key={d} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const dayEvents = eventsByDate[cell.dateIso] || [];
              const isSelected = selectedDate === cell.dateIso;
              const isToday = cell.dateIso === todayIso;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(cell.dateIso)}
                  className={`min-h-[64px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all relative ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                      : cell.isCurrentMonth
                      ? 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/60'
                      : 'bg-slate-950/20 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[11px]'
                          : isSelected
                          ? 'text-emerald-400'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Dot Event Markers */}
                  <div className="flex items-center space-x-1 mt-1 flex-wrap gap-y-1">
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          ev.type === 'cobranca'
                            ? 'bg-amber-400'
                            : ev.type === 'pagamento'
                            ? 'bg-rose-400'
                            : ev.type === 'entrega'
                            ? 'bg-blue-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Event Details List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col">
          
          {/* Header & Filter */}
          <div className="pb-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Eventos de</span>
                <span className="text-emerald-400">{selectedDate.split('-').reverse().join('/')}</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* Type Filter dropdown */}
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="cobranca">🔔 Cobranças</option>
                <option value="pagamento">💰 Pagamentos</option>
                <option value="entrega">📦 Entregas</option>
                <option value="compromisso">📅 Compromissos</option>
                <option value="alarme">⏰ Alarmes</option>
              </select>
            </div>
          </div>

          {/* Events List Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-3 pt-4 max-h-[420px] pr-1">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl">
                <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-semibold">Nenhum evento para este dia.</p>
                <button
                  onClick={() => onOpenNewEventModal(selectedDate)}
                  className="mt-3 inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar evento para {selectedDate.split('-').reverse().join('/')}</span>
                </button>
              </div>
            ) : (
              selectedDateEvents.map((ev) => {
                const client = clients.find((c) => c.id === ev.clientId);

                return (
                  <div
                    key={ev.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      ev.status === 'completed'
                        ? 'bg-slate-950/30 border-slate-800 opacity-60'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getTypeBadgeStyle(
                              ev.type
                            )}`}
                          >
                            {ev.type}
                          </span>

                          {ev.time && (
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{ev.time}</span>
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-sm font-bold text-white ${
                            ev.status === 'completed' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {ev.title}
                        </h4>

                        {ev.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>
                        )}

                        {client && (
                          <div className="flex items-center space-x-2 pt-1">
                            <span className="text-[11px] text-slate-400">Cliente: {client.name}</span>
                            {client.whatsapp && (
                              <button
                                onClick={() =>
                                  onOpenWhatsAppCharge(
                                    client.whatsapp,
                                    `Olá ${client.name}! Lembrete sobre: ${ev.title}`
                                  )
                                }
                                className="text-[10px] font-bold text-emerald-400 hover:underline"
                              >
                                WhatsApp
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        {!ev.isAuto && (
                          <>
                            <button
                              onClick={() => onToggleEventStatus(ev.id)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                ev.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                              }`}
                              title={ev.status === 'completed' ? 'Marcar como pendente' : 'Marcar como concluído'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onEditEvent(ev)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDeleteEvent(ev.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
