import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  Rocket,
  FolderKanban,
  DollarSign,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar
} from 'lucide-react';
import { NotificationItem } from '../types';

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
  const [filter, setFilter] = useState<'all' | 'leads' | 'charges' | 'projects'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

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
        return <Rocket className="w-4 h-4 text-[#0050d7] stroke-[2.2]" />;
      case 'project_due':
        return <FolderKanban className="w-4 h-4 text-[#003da9] stroke-[2.2]" />;
      case 'expense_due':
        return <DollarSign className="w-4 h-4 text-[#ba1a1a] stroke-[2.2]" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-[#7a5400] stroke-[2.2]" />;
    }
  };

  const getNotificationStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_lead':
        return 'bg-[#dbe1ff]/40 border-[#0050d7]/30 hover:bg-[#dbe1ff]/60';
      case 'due_today':
      case 'overdue':
        return 'bg-[#ffdad6]/40 border-[#ba1a1a]/30 hover:bg-[#ffdad6]/60';
      default:
        return 'bg-[#f7f3f2] border-[#c4c7c7]/30 hover:bg-[#f1edec]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-2 sm:p-4 animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white border border-[#c4c7c7]/30 rounded-[24px] h-full max-h-[92vh] flex flex-col shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">

        {/* Header */}
        <div className="bg-[#f7f3f2] p-4 sm:p-5 border-b border-[#c4c7c7]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-[#000000] text-white flex items-center justify-center">
                <Bell className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1c1b1b] text-base">Notificações &amp; Alertas</h3>
                <p className="text-xs text-[#747878]">{notifications.length} alerta(s) ativo(s)</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {notifications.length > 0 && onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-2.5 py-1 text-xs font-semibold text-[#0050d7] hover:bg-[#dbe1ff]/60 rounded-full transition-colors flex items-center space-x-1 cursor-pointer"
                  title="Marcar todas como lidas e limpar o sino"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar Tudo</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-[#c4c7c7]/30 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-white text-[#747878] hover:text-black border border-[#c4c7c7]/30'
              }`}
            >
              Todas ({notifications.length})
            </button>

            <button
              onClick={() => setFilter('leads')}
              className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filter === 'leads'
                  ? 'bg-[#0050d7] text-white'
                  : 'bg-white text-[#747878] hover:text-black border border-[#c4c7c7]/30'
              }`}
            >
              <span>🚀 Leads</span>
              {leadsCount > 0 && <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full">{leadsCount}</span>}
            </button>

            <button
              onClick={() => setFilter('charges')}
              className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filter === 'charges'
                  ? 'bg-[#ba1a1a] text-white'
                  : 'bg-white text-[#747878] hover:text-black border border-[#c4c7c7]/30'
              }`}
            >
              <span>💰 Cobranças</span>
              {chargesCount > 0 && <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full">{chargesCount}</span>}
            </button>

            <button
              onClick={() => setFilter('projects')}
              className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filter === 'projects'
                  ? 'bg-black text-white'
                  : 'bg-white text-[#747878] hover:text-black border border-[#c4c7c7]/30'
              }`}
            >
              <span>📅 Prazos</span>
              {projectsCount > 0 && <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full">{projectsCount}</span>}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[#c4c7c7]" />
              <p className="font-semibold text-[#1c1b1b]">Tudo em ordem!</p>
              <p className="text-xs text-[#747878]">Nenhuma notificação nesta categoria.</p>
            </div>
          ) : (
            visibleNotifications.map((n) => {
              const isLead = n.type === 'new_lead';

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-[18px] border transition-all space-y-2.5 ${getNotificationStyle(n.type)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[#1c1b1b]">
                      {getNotificationIcon(n.type)}
                      <span>{n.title}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-[#747878] font-medium">{n.date}</span>
                      {onMarkAsRead && (
                        <button
                          onClick={() => onMarkAsRead(n.id)}
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-[#747878] hover:text-black hover:bg-white/80 border border-transparent hover:border-[#c4c7c7]/40 transition-all flex items-center gap-1 cursor-pointer"
                          title="Marcar como lida e desmarcar do sino"
                        >
                          <Check className="w-3 h-3" />
                          <span>Dispensar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#1c1b1b] leading-relaxed">
                    {n.message}
                  </p>

                  {/* Action button */}
                  {n.whatsappPhone && (
                    <button
                      onClick={() => {
                        const messageText = n.whatsappMessage || `Olá! Recebemos sua mensagem através da Codeengine e gostaríamos de conversar sobre seu projeto.`;
                        onOpenWhatsAppCharge(n.whatsappPhone!, messageText);
                      }}
                      className={`w-full mt-1.5 py-2 px-3 rounded-[29px] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
                        isLead 
                          ? 'bg-[#0050d7] hover:bg-[#003da9] text-white shadow-sm'
                          : 'bg-[#000000] hover:opacity-85 text-white'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{isLead ? 'Atender Lead no WhatsApp' : 'Enviar Lembrete WhatsApp'}</span>
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
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-[#f1edec] hover:bg-[#e8e4e3] text-[#1c1b1b] rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <span>
                  {isExpanded
                    ? 'Ver menos'
                    : `Ver mais (+${filteredNotifications.length - 3} notificações)`}
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f7f3f2] p-3 border-t border-[#c4c7c7]/40 text-center text-xs text-[#747878] font-normal">
          Clique em &quot;Dispensar&quot; para desmarcar alertas visualizados do sininho.
        </div>

      </div>
    </div>
  );
};
