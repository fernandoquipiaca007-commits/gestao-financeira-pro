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
  Filter,
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
  const [searchTerm] = useState('');
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

  const handleTestPush = async () => {
    let currentPerm = pushStatus;
    if (currentPerm !== 'granted') {
      currentPerm = await requestNotificationPermission();
      setPushStatus(currentPerm);
    }
    if (currentPerm === 'granted') {
      const ok = await sendWebPushNotification('🔔 Teste de Notificação Web Push', {
        body: 'Se você está vendo este aviso, as notificações da agenda estão 100% operacionais!',
      });
      if (ok) {
        alert('Notificação enviada com sucesso!');
      } else {
        alert('O navegador ou o sistema operacional pode estar a bloquear as notificações popup. Verifica as definições do browser.');
      }
    } else {
      alert('Permissão de notificação negada pelo navegador. Permita notificações nas definições do navegador para utilizar esta função.');
    }
  };

  // Build combined events map: manual AgendaEvents + auto generated events from Projects/Incomes/Expenses
  const allCombinedEvents = useMemo(() => {
    const list: Array<AgendaEvent & { isAuto?: boolean }> = [...agendaEvents];

    // Auto events from Incomes
    incomes.forEach((inc) => {
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
  }, [agendaEvents, incomes, projects, expenses]);

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
        return 'bg-[#fff3d6] text-[#7a5400]';
      case 'pagamento':
        return 'bg-[#ffdad6] text-[#93000a]';
      case 'entrega':
        return 'bg-[#dbe1ff] text-[#003da9]';
      case 'alarme':
        return 'bg-[#f1edec] text-[#444747]';
      default:
        return 'bg-[#d4eddf] text-[#1a6b3a]';
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Push Notification Permission Banner */}
      {pushStatus !== 'granted' && (
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1c1b1b]">Ativar Notificações Web Push do Navegador</h4>
              <p className="text-xs text-[#747878] mt-0.5">
                Receba alertas automáticos de cobrança, entregas e alarmes no seu computador ou telemóvel.
              </p>
            </div>
          </div>
          <button
            onClick={handleEnablePush}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#000000] hover:opacity-85 text-white text-xs font-medium rounded-[29px] transition-all cursor-pointer whitespace-nowrap shrink-0 text-center"
          >
            Ativar Agora
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-[22px] border border-[#c4c7c7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1c1b1b] tracking-tight">Agenda &amp; Calendário Real</h2>
            <p className="text-xs text-[#747878] mt-0.5">Sincronizado com cobranças, compromissos e prazos de entrega</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleTestPush}
            title="Testar Notificação Push no Navegador"
            className="w-full sm:w-auto px-4 py-2.5 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] font-medium text-xs rounded-[29px] transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Bell className="w-4 h-4 text-[#747878]" />
            <span>Testar Push</span>
          </button>

          <button
            onClick={() => onOpenNewEventModal(selectedDate)}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#000000] hover:opacity-85 text-white font-medium text-sm rounded-[29px] transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar left, Event List right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#c4c7c7]/40">
            <h3 className="text-base font-semibold text-[#1c1b1b]">
              {monthNames[month]} <span className="text-[#0050d7]">{year}</span>
            </h3>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setSelectedDate(todayIso)}
                className="px-3.5 py-1.5 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-xs font-medium rounded-full transition-all cursor-pointer"
              >
                Hoje
              </button>
              <button
                onClick={prevMonth}
                className="p-1.5 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#747878] rounded-full transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#747878] rounded-full transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <span key={d} className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest py-1">
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
                  className={`min-h-[68px] p-2 rounded-[14px] border flex flex-col justify-between text-left transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-[#f1edec] border-[#000000] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                      : cell.isCurrentMonth
                      ? 'bg-white border-[#c4c7c7]/30 hover:border-[#c4c7c7] hover:bg-[#f7f3f2]'
                      : 'bg-[#f7f3f2]/60 border-[#c4c7c7]/20 text-[#c4c7c7]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[#000000] text-white flex items-center justify-center text-xs font-semibold'
                          : isSelected
                          ? 'text-[#000000] font-semibold'
                          : cell.isCurrentMonth
                          ? 'text-[#1c1b1b] font-medium'
                          : 'text-[#c4c7c7]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#e5e2e1] text-[#444747]">
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
                            ? 'bg-[#7a5400]'
                            : ev.type === 'pagamento'
                            ? 'bg-[#ba1a1a]'
                            : ev.type === 'entrega'
                            ? 'bg-[#0050d7]'
                            : 'bg-[#000000]'
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
        <div className="lg:col-span-5 bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
          
          {/* Header & Filter */}
          <div className="pb-4 border-b border-[#c4c7c7]/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1c1b1b] flex items-center space-x-2">
                <span>Eventos de</span>
                <span className="text-[#0050d7]">{selectedDate.split('-').reverse().join('/')}</span>
              </h3>
              <span className="text-xs text-[#747878] font-medium bg-[#f1edec] px-2.5 py-0.5 rounded-full">
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* Type Filter dropdown */}
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-[#747878]" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full px-3.5 py-1.5 text-xs text-[#1c1b1b] font-medium focus:outline-none cursor-pointer"
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
              <div className="text-center py-12 px-4 border border-dashed border-[#c4c7c7] rounded-[16px] bg-[#f7f3f2]/50">
                <CalendarIcon className="w-8 h-8 text-[#c4c7c7] mx-auto mb-2" />
                <p className="text-xs text-[#747878]">Nenhum evento para este dia.</p>
                <button
                  onClick={() => onOpenNewEventModal(selectedDate)}
                  className="mt-3 inline-flex items-center space-x-1.5 text-xs text-[#0050d7] font-medium hover:underline cursor-pointer"
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
                    className={`p-3.5 rounded-[16px] border transition-all ${
                      ev.status === 'completed'
                        ? 'bg-[#f7f3f2] border-[#c4c7c7]/20 opacity-70'
                        : 'bg-[#f7f3f2] border-[#c4c7c7]/30 hover:bg-[#f1edec]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getTypeBadgeStyle(
                              ev.type
                            )}`}
                          >
                            {ev.type}
                          </span>

                          {ev.time && (
                            <span className="text-[11px] text-[#747878] flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-[#747878]" />
                              <span>{ev.time}</span>
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-sm font-semibold text-[#1c1b1b] ${
                            ev.status === 'completed' ? 'line-through text-[#747878]' : ''
                          }`}
                        >
                          {ev.title}
                        </h4>

                        {ev.description && (
                          <p className="text-xs text-[#747878] line-clamp-2">{ev.description}</p>
                        )}

                        {client && (
                          <div className="flex items-center space-x-2 pt-1">
                            <span className="text-[11px] text-[#747878]">Cliente: {client.name}</span>
                            {client.whatsapp && (
                              <button
                                onClick={() =>
                                  onOpenWhatsAppCharge(
                                    client.whatsapp,
                                    `Olá ${client.name}! Lembrete sobre: ${ev.title}`
                                  )
                                }
                                className="text-[11px] font-medium text-[#0050d7] hover:underline cursor-pointer"
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
                              className={`p-1.5 rounded-full border text-xs transition-all cursor-pointer ${
                                ev.status === 'completed'
                                  ? 'bg-[#d4eddf] text-[#1a6b3a] border-[#1a6b3a]/20'
                                  : 'bg-[#f1edec] text-[#444747] hover:text-[#1c1b1b] border-[#c4c7c7]/35'
                              }`}
                              title={ev.status === 'completed' ? 'Marcar como pendente' : 'Marcar como concluído'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onEditEvent(ev)}
                              className="p-1.5 text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDeleteEvent(ev.id)}
                              className="p-1.5 text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
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
