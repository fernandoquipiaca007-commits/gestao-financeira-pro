import React, { useState, useMemo } from 'react';
import { confirmAction, toast } from '../lib/feedback';
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
  X,
  Loader2,
} from 'lucide-react';
import { AgendaEvent, AgendaEventType, Client, Project, Income, Expense, getIncomeStatusLabel, getProjectStatusLabel, getAgendaEventTypeLabel } from '../types';
import { requestNotificationPermission, sendWebPushNotification } from '../lib/webpush';
import { useLanguage } from '../contexts/LanguageContext';
import { PendingEventsPanel } from './agenda/PendingEventsPanel';

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
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm] = useState('');
  const [pushStatus, setPushStatus] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [isPushBannerDismissed, setIsPushBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gfo_dismiss_push_banner') === 'true';
    } catch {
      return false;
    }
  });
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [pushDeniedNotice, setPushDeniedNotice] = useState(false);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNames = isEn ? monthNamesEn : monthNamesPt;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayIso = new Date().toISOString().split('T')[0];

  // Request Web Push Permission
  const handleEnablePush = async () => {
    setIsEnablingPush(true);
    setPushDeniedNotice(false);
    try {
      const perm = await requestNotificationPermission();
      setPushStatus(perm);
      if (perm === 'granted') {
        try {
          localStorage.setItem('gfo_dismiss_push_banner', 'true');
        } catch {}
        setIsPushBannerDismissed(true);
        sendWebPushNotification(
          isEn ? 'Notifications Enabled!' : 'Notificações Ativadas!',
          {
            body: isEn
              ? 'The Financial Management system will now alert you about appointments and collections.'
              : 'O sistema de Gestão Financeira agora irá te alertar sobre compromissos e cobranças.',
          }
        );
      } else if (perm === 'denied') {
        setPushDeniedNotice(true);
      }
    } catch (err) {
      console.warn('Error enabling push notifications:', err);
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleDismissPushBanner = () => {
    setIsPushBannerDismissed(true);
    try {
      localStorage.setItem('gfo_dismiss_push_banner', 'true');
    } catch {}
  };

  const handleTestPush = async () => {
    let currentPerm = pushStatus;
    if (currentPerm !== 'granted') {
      currentPerm = await requestNotificationPermission();
      setPushStatus(currentPerm);
    }
    if (currentPerm === 'granted') {
      const ok = await sendWebPushNotification(
        isEn ? 'Web Push Notification Test' : 'Teste de Notificação Web Push',
        {
          body: isEn
            ? 'If you are seeing this notice, calendar notifications are 100% operational!'
            : 'Se está a ver este aviso, as notificações da agenda estão a funcionar.',
        }
      );
      if (ok) {
        toast({ tone: 'success', title: isEn ? 'Notification sent successfully!' : 'Notificação enviada com sucesso!' });
      } else {
        toast({ tone: 'danger', title: isEn
            ? 'The browser or operating system may be blocking pop-up notifications. Check your browser settings.'
            : 'O navegador ou o sistema operacional pode estar a bloquear as notificações popup. Verifica as definições do browser.' });
      }
    } else {
      toast({ tone: 'danger', title: isEn
          ? 'Notification permission denied by the browser. Allow notifications in browser settings to use this feature.'
          : 'Permissão de notificação negada pelo navegador. Permita notificações nas definições do navegador para utilizar esta função.' });
    }
  };

  // Build combined events map: manual AgendaEvents + auto generated events from Projects/Incomes/Expenses
  const allCombinedEvents = useMemo(() => {
    const list: Array<AgendaEvent & { isAuto?: boolean }> = [...agendaEvents];

    // Auto events from Incomes
    incomes.forEach((inc) => {
      list.push({
        id: `auto-inc-${inc.id}`,
        title: `${isEn ? 'Collection' : 'Cobrança'}: ${inc.description}`,
        type: 'cobranca',
        date: inc.dueDate,
        clientId: inc.clientId,
        projectId: inc.projectId,
        description: `${isEn ? 'Amount' : 'Valor'}: ${inc.currency} ${inc.amount.toLocaleString()} - Status: ${getIncomeStatusLabel(inc.status, lang)}`,
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
          title: `${isEn ? 'Project Delivery' : 'Entrega de Projeto'}: ${proj.name}`,
          type: 'entrega',
          date: proj.dueDate,
          clientId: proj.clientId,
          projectId: proj.id,
          description: `${isEn ? 'Category' : 'Categoria'}: ${proj.category} - Status: ${getProjectStatusLabel(proj.status, lang)}`,
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
        title: `${isEn ? 'Expense Due' : 'Vencimento Despesa'}: ${exp.description}`,
        type: 'pagamento',
        date: exp.date,
        description: `${isEn ? 'Category' : 'Categoria'}: ${exp.category} - ${isEn ? 'Amount' : 'Valor'}: ${exp.currency} ${exp.amount.toLocaleString()}`,
        status: exp.paid ? 'completed' : 'pending',
        isAuto: true,
        createdAt: exp.createdAt,
      });
    });

    return list;
  }, [agendaEvents, incomes, projects, expenses, isEn, lang]);

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
        return 'bg-warning-soft text-warning-fg';
      case 'pagamento':
        return 'bg-danger-soft text-danger-fg';
      case 'entrega':
        return 'bg-accent-soft text-accent-soft-fg';
      case 'alarme':
        return 'bg-surface-2 text-fg-secondary';
      default:
        return 'bg-success-soft text-success-fg';
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      <PendingEventsPanel events={agendaEvents} clients={clients} isEn={isEn} onToggle={onToggleEventStatus} onEdit={onEditEvent} />
      
      {/* Push Notification Permission Banner */}
      {!isPushBannerDismissed && pushStatus !== 'granted' && (
        <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center space-x-3">
              <div>
                <h4 className="text-sm font-semibold text-fg ">
                  {isEn ? 'Enable Browser Web Push Notifications' : 'Ativar Notificações Web Push do Navegador'}
                </h4>
                <p className="text-xs text-fg-muted mt-0.5">
                  {isEn
                    ? 'Receive automatic alerts for collections, deliveries, and reminders on your computer or mobile.'
                    : 'Receba alertas automáticos de cobrança, entregas e alarmes no seu computador ou telemóvel.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleEnablePush}
              disabled={isEnablingPush}
              className="aura-btn aura-btn--primary aura-btn--sm w-full sm:w-auto disabled:opacity-50 shrink-0 justify-center gap-1.5"
            >
              {isEnablingPush && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEn ? 'Enable Now' : 'Ativar Agora'}</span>
            </button>
          </div>

          {pushDeniedNotice && (
            <div className="mt-3 pt-3 border-t border-line-subtle text-xs text-warning-fg flex items-start justify-between gap-2">
              <span>
                {isEn
                  ? 'Notifications are blocked in your browser. Click the lock icon next to the URL in the address bar and change Notifications to "Allow".'
                  : 'As notificações estão bloqueadas no seu navegador. Clique no ícone de cadeado/definições ao lado do endereço do site (URL) e mude Notificações para "Permitir".'}
              </span>
              <button
                onClick={handleDismissPushBanner}
                className="text-xs underline font-semibold shrink-0 cursor-pointer"
              >
                {isEn ? 'Dismiss' : 'Dispensar'}
              </button>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleDismissPushBanner}
            className="absolute top-4 right-4 p-1 text-fg-muted hover:text-fg rounded-full hover:bg-sunken transition-colors cursor-pointer"
            title={isEn ? 'Dismiss' : 'Fechar'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-surface-2 text-fg flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">
              {isEn ? 'Schedule' : 'Agenda'}
            </h1>
            <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
              {isEn
                ? 'Collections, appointments and deadlines in one place.'
                : 'Cobranças, compromissos e prazos num só lugar.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleTestPush}
            title={isEn ? 'Test Push Notification in Browser' : 'Testar Notificação Push no Navegador'}
            className="w-full sm:w-auto px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-fg font-medium text-xs rounded-full transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Bell className="w-4 h-4 text-fg-muted " />
            <span>{isEn ? 'Test Push' : 'Testar Push'}</span>
          </button>

          <button
            onClick={() => onOpenNewEventModal(selectedDate)}
            className="aura-btn aura-btn--primary w-full sm:w-auto justify-center shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{isEn ? 'New event' : 'Novo evento'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar left, Event List right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
          
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-line-subtle ">
            <h3 className="text-base font-semibold text-fg ">
              {monthNames[month]} <span className="text-accent-soft-fg ">{year}</span>
            </h3>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setSelectedDate(todayIso)}
                className="aura-btn aura-btn--secondary aura-btn--sm"
              >
                {isEn ? 'Today' : 'Hoje'}
              </button>
              <button
                onClick={prevMonth}
                className="p-1.5 bg-surface-2 hover:bg-surface-3 text-fg-muted rounded-full transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 bg-surface-2 hover:bg-surface-3 text-fg-muted rounded-full transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {(isEn ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']).map((d) => (
              <span key={d} className="text-[13px] font-medium text-fg-secondary py-1">
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
                  className={`min-h-[68px] p-2 rounded-md border flex flex-col justify-between text-left transition-all relative cursor-pointer ${
 isSelected
 ? 'bg-surface-2 border-fg shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
 : cell.isCurrentMonth
 ? 'bg-glass-strong border-line-subtle hover:border-line-strong hover:bg-sunken '
 : 'bg-surface-2/60 border-line-subtle text-fg-disabled '
 }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs ${
 isToday
 ? 'w-5 h-5 rounded-full bg-primary shadow-primary-3d text-primary-fg flex items-center justify-center text-xs font-semibold'
 : isSelected
 ? 'text-fg font-semibold'
 : cell.isCurrentMonth
 ? 'text-fg font-medium'
 : 'text-fg-disabled '
 }`}
                    >
                      {cell.dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-3 text-fg-secondary">
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
 ? 'bg-warning'
 : ev.type === 'pagamento'
 ? 'bg-danger'
 : ev.type === 'entrega'
 ? 'bg-accent'
 : 'bg-primary shadow-primary-3d'
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
        <div className="lg:col-span-5 bg-glass border border-line-subtle rounded-xl p-5 shadow-glass flex flex-col">
          
          {/* Header & Filter */}
          <div className="pb-4 border-b border-line-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg flex items-center space-x-2">
                <span>{isEn ? 'Events for' : 'Eventos de'}</span>
                <span className="text-accent-soft-fg ">
                  {isEn ? selectedDate : selectedDate.split('-').reverse().join('/')}
                </span>
              </h3>
              <span className="text-xs text-fg-muted font-medium bg-surface-2 px-2.5 py-0.5 rounded-full">
                {selectedDateEvents.length} {isEn ? (selectedDateEvents.length === 1 ? 'item' : 'items') : (selectedDateEvents.length === 1 ? 'item' : 'itens')}
              </span>
            </div>

            {/* Type Filter dropdown */}
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-fg-muted " />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-surface-2 border border-line-subtle rounded-full px-3.5 py-1.5 text-xs text-fg font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">{isEn ? 'All Types' : 'Todos os Tipos'}</option>
                <option value="cobranca">{isEn ? 'Collections' : 'Cobranças'}</option>
                <option value="pagamento">{isEn ? 'Payments' : 'Pagamentos'}</option>
                <option value="entrega">{isEn ? 'Deliveries' : 'Entregas'}</option>
                <option value="compromisso">{isEn ? 'Appointments' : 'Compromissos'}</option>
                <option value="alarme">{isEn ? 'Alarms' : 'Alarmes'}</option>
              </select>
            </div>
          </div>

          {/* Events List Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-3 pt-4 max-h-[420px] pr-1">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-line rounded-lg bg-surface-2/50 ">
                <CalendarIcon className="w-8 h-8 text-fg-disabled mx-auto mb-2" />
                <p className="text-xs text-fg-muted ">
                  {isEn ? 'No events for this day.' : 'Nenhum evento para este dia.'}
                </p>
                <button
                  onClick={() => onOpenNewEventModal(selectedDate)}
                  className="mt-3 inline-flex items-center space-x-1.5 text-xs text-accent-soft-fg font-medium hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {isEn
                      ? `Create event for ${selectedDate}`
                      : `Criar evento para ${selectedDate.split('-').reverse().join('/')}`}
                  </span>
                </button>
              </div>
            ) : (
              selectedDateEvents.map((ev) => {
                const client = clients.find((c) => c.id === ev.clientId);

                return (
                  <div
                    key={ev.id}
                    className={`p-3.5 rounded-lg border transition-all ${
 ev.status === 'completed'
 ? 'bg-surface-2 border-line-subtle opacity-70'
 : 'bg-surface-2 border-line-subtle hover:bg-sunken '
 }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[13px] font-medium ${getTypeBadgeStyle(
 ev.type
 )}`}
                          >
                            {getAgendaEventTypeLabel(ev.type, lang)}
                          </span>

                          {ev.time && (
                            <span className="text-[11px] text-fg-muted flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-fg-muted " />
                              <span>{ev.time}</span>
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-sm font-semibold text-fg ${
 ev.status === 'completed' ? 'line-through text-fg-muted ' : ''
 }`}
                        >
                          {ev.title}
                        </h4>

                        {ev.description && (
                          <p className="text-xs text-fg-muted line-clamp-2">{ev.description}</p>
                        )}

                        {client && (
                          <div className="flex items-center space-x-2 pt-1">
                            <span className="text-[11px] text-fg-muted ">
                              {isEn ? 'Client' : 'Cliente'}: {client?.name || (isEn ? 'Client' : 'Cliente')}
                            </span>
                            {client.whatsapp && (
                              <button
                                onClick={() =>
                                  onOpenWhatsAppCharge(
                                    client.whatsapp,
                                    isEn
                                      ? `Hello ${client?.name || ''}! Reminder about: ${ev.title}`
                                      : `Olá ${client?.name || ''}! Lembrete sobre: ${ev.title}`
                                  )
                                }
                                className="text-[11px] font-medium text-accent-soft-fg hover:underline cursor-pointer"
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
 ? 'bg-success-soft text-success-fg border-success/20 '
 : 'bg-surface-2 text-fg-secondary hover:text-fg border-line-subtle '
 }`}
                              title={
                                ev.status === 'completed'
                                  ? (isEn ? 'Mark as pending' : 'Marcar como pendente')
                                  : (isEn ? 'Mark as completed' : 'Marcar como concluído')
                              }
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onEditEvent(ev)}
                              className="p-1.5 text-fg-muted hover:text-fg hover:bg-sunken rounded-full transition-colors cursor-pointer"
                              title={isEn ? 'Edit' : 'Editar'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDeleteEvent(ev.id)}
                              className="p-1.5 text-fg-muted hover:text-danger-fg hover:bg-danger-soft rounded-full transition-colors cursor-pointer"
                              title={isEn ? 'Delete' : 'Eliminar'}
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
