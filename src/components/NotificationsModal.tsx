import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  MessageCircle, 
  Rocket,
  FolderKanban,
  DollarSign,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { NotificationItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onOpenWhatsAppCharge,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'leads' | 'charges' | 'projects'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Esc fecha o painel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const leadsCount = useMemo(() => notifications.filter((n) => n.type === 'new_lead').length, [notifications]);
  const chargesCount = useMemo(() => notifications.filter((n) => n.type === 'due_today' || n.type === 'overdue' || n.type === 'expense_due').length, [notifications]);
  const projectsCount = useMemo(() => notifications.filter((n) => n.type === 'project_due' || n.type === 'agenda_alarm').length, [notifications]);

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'leads':
        return notifications.filter((n) => n.type === 'new_lead');
      case 'charges':
        return notifications.filter((n) => n.type === 'due_today' || n.type === 'overdue' || n.type === 'expense_due');
      case 'projects':
        return notifications.filter((n) => n.type === 'project_due' || n.type === 'agenda_alarm');
      default:
        return notifications;
    }
  }, [notifications, filter]);

  // Pagination / Limit (Default 3 items, expand with Ver Mais)
  const visibleNotifications = useMemo(() => {
    if (isExpanded || filteredNotifications.length <= 3) {
      return filteredNotifications;
    }
    return filteredNotifications.slice(0, 3);
  }, [filteredNotifications, isExpanded]);

  if (!isOpen) return null;

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_lead':
        return <Rocket className="w-4 h-4 text-accent-soft-fg stroke-[2.2]" />;
      case 'project_due':
        return <FolderKanban className="w-4 h-4 text-accent-soft-fg stroke-[2.2]" />;
      case 'expense_due':
        return <DollarSign className="w-4 h-4 text-danger-fg stroke-[2.2]" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-warning-fg stroke-[2.2]" />;
    }
  };

  const getNotificationStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_lead':
        return 'bg-accent-soft/40 border-accent/30 hover:bg-accent-soft/60 ';
      case 'due_today':
      case 'overdue':
        return 'bg-danger-soft/40 border-danger/30 hover:bg-danger-soft/60 ';
      default:
        return 'bg-surface-2 border-line-subtle hover:bg-sunken ';
    }
  };

  const formatNotificationTitle = (title: string) => {
    if (lang !== 'en') return title;
    const map: Record<string, string> = {
      'Vencimento Hoje': 'Payment Due Today',
      'Pagamento Atrasado': 'Overdue Payment',
      'Entrega Amanhã': 'Delivery Tomorrow',
      'Entrega Hoje': 'Delivery Today',
      'Entrega Próxima': 'Upcoming Delivery',
      'Prazo Próximo': 'Upcoming Deadline',
      'Despesa Próxima': 'Upcoming Expense',
      'Despesa Vencida': 'Overdue Expense',
      'Novo Lead Captado na Landing Page': 'New Landing Page Lead',
      'Novo Lead Captado': 'New Lead Captured',
    };
    return map[title] || title;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[rgba(18,17,14,0.34)] backdrop-blur-sm p-2 sm:p-4 animate-fade-in font-sans">
      <div className="w-full max-w-md bg-glass-strong border border-line-subtle rounded-xl h-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden backdrop-blur-[56px]">

        {/* Header */}
        <div className="bg-surface-2 p-4 sm:p-5 border-b border-line-subtle ">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-primary shadow-primary-3d text-primary-fg flex items-center justify-center">
                <Bell className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-semibold text-fg text-base">
                  {lang === 'en' ? 'Notifications' : 'Notificações'}
                </h3>
                <p className="text-xs text-fg-muted ">
                  {lang === 'en' ? `${notifications.length} active alert(s)` : `${notifications.length} alerta(s) ativo(s)`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {notifications.length > 0 && onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-2.5 py-1 text-xs font-semibold text-accent-soft-fg hover:bg-accent-soft/60 rounded-full transition-colors flex items-center space-x-1 cursor-pointer"
                  title={lang === 'en' ? 'Mark all as read' : 'Marcar todas como lidas e limpar o sino'}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === 'en' ? 'Clear all' : 'Limpar tudo'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label={lang === 'en' ? 'Close' : 'Fechar'}
                className="p-1.5 rounded-full text-fg-muted hover:bg-sunken hover:text-fg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-line-subtle overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
 filter === 'all'
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'bg-glass-strong text-fg-muted hover:text-fg border border-line-subtle '
 }`}
            >
              {lang === 'en' ? 'All' : 'Todas'} ({notifications.length})
            </button>

            <button
              onClick={() => setFilter('leads')}
              className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
 filter === 'leads'
 ? 'bg-accent text-white'
 : 'bg-glass-strong text-fg-muted hover:text-fg border border-line-subtle '
 }`}
            >
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Leads</span>
              {leadsCount > 0 && <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full">{leadsCount}</span>}
            </button>

            <button
              onClick={() => setFilter('charges')}
              className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
 filter === 'charges'
 ? 'bg-danger text-white'
 : 'bg-glass-strong text-fg-muted hover:text-fg border border-line-subtle '
 }`}
            >
              <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{lang === 'en' ? 'Charges' : 'Cobranças'}</span>
              {chargesCount > 0 && <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full">{chargesCount}</span>}
            </button>

            <button
              onClick={() => setFilter('projects')}
              className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
 filter === 'projects'
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'bg-glass-strong text-fg-muted hover:text-fg border border-line-subtle '
 }`}
            >
              <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{lang === 'en' ? 'Deadlines' : 'Prazos'}</span>
              {projectsCount > 0 && <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full">{projectsCount}</span>}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-fg-disabled " />
              <p className="font-semibold text-fg ">
                {lang === 'en' ? 'All caught up!' : 'Tudo em ordem!'}
              </p>
              <p className="text-xs text-fg-muted ">
                {lang === 'en' ? 'No notifications in this category.' : 'Nenhuma notificação nesta categoria.'}
              </p>
            </div>
          ) : (
            visibleNotifications.map((n) => {
              const isLead = n.type === 'new_lead';

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-lg border transition-all space-y-2.5 ${getNotificationStyle(n.type)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-fg ">
                      {getNotificationIcon(n.type)}
                      <span>{formatNotificationTitle(n.title)}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-fg-muted font-medium">{n.date}</span>
                      {onMarkAsRead && (
                        <button
                          onClick={() => onMarkAsRead(n.id)}
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-fg-muted hover:text-fg hover:bg-white/80 border border-transparent hover:border-line-subtle transition-all flex items-center gap-1 cursor-pointer"
                          title={lang === 'en' ? 'Dismiss' : 'Marcar como lida e desmarcar do sino'}
                        >
                          <Check className="w-3 h-3" />
                          <span>{lang === 'en' ? 'Dismiss' : 'Dispensar'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-fg leading-relaxed">
                    {n.message}
                  </p>

                  {/* Action button */}
                  {n.whatsappPhone && (
                    <button
                      onClick={() => {
                        const defaultMsg = lang === 'en'
                          ? 'Hello! We received your message and would love to discuss your project.'
                          : 'Olá! Recebemos sua mensagem e gostaríamos de conversar sobre seu projeto.';
                        const messageText = n.whatsappMessage || defaultMsg;
                        onOpenWhatsAppCharge(n.whatsappPhone!, messageText);
                      }}
                      className={`w-full mt-1.5 py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
 isLead 
 ? 'bg-accent hover:bg-accent-hover text-white shadow-sm'
 : 'bg-primary shadow-primary-3d hover:opacity-85 text-primary-fg'
 }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>
                        {isLead 
                          ? (lang === 'en' ? 'Contact Lead on WhatsApp' : 'Atender Lead no WhatsApp')
                          : (lang === 'en' ? 'Send WhatsApp reminder' : 'Enviar lembrete por WhatsApp')}
                      </span>
                    </button>
                  )}
                </div>
              );
            })
          )}

          {/* Ver mais / Ver menos Button */}
          {filteredNotifications.length > 3 && (
            <div className="pt-1 text-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-surface-2 hover:bg-[#e8e4e3] text-fg rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <span>
                  {isExpanded
                    ? (lang === 'en' ? 'Show less' : 'Ver menos')
                    : (lang === 'en' ? `Show more (+${filteredNotifications.length - 3} notifications)` : `Ver mais (+${filteredNotifications.length - 3} notificações)`)}
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-surface-2 p-3 border-t border-line-subtle text-center text-xs text-fg-muted font-normal">
          {lang === 'en' ? 'Click "Dismiss" to remove viewed alerts from the badge.' : 'Dispensar tira o alerta do sino.'}
        </div>

      </div>
    </div>
  );
};
