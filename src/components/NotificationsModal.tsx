import React from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  ArrowRight,
  Rocket,
  FolderKanban,
  DollarSign,
  Check,
  Trash2
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onOpenWhatsAppCharge,
  onMarkAsRead,
}) => {
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
      <div className="w-full max-w-md bg-white border border-[#c4c7c7]/30 rounded-[24px] h-full max-h-[90vh] flex flex-col shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">

        {/* Header */}
        <div className="bg-[#f7f3f2] p-5 border-b border-[#c4c7c7]/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-[#000000] text-white flex items-center justify-center">
              <Bell className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1b1b] text-base">Notificações &amp; Alertas</h3>
              <p className="text-xs text-[#747878]">Leads da Landing Page, cobranças e prazos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[#c4c7c7]" />
              <p className="font-semibold text-[#1c1b1b]">Tudo em ordem!</p>
              <p className="text-xs text-[#747878]">Nenhum novo lead ou cobrança pendente neste momento.</p>
            </div>
          ) : (
            notifications.map((n) => {
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
                          className="p-1 rounded-full text-[#747878] hover:text-black hover:bg-white/60 cursor-pointer"
                          title="Marcar como lida / dispensar"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#1c1b1b] leading-relaxed">
                    {n.message}
                  </p>

                  {/* Action buttons */}
                  {n.whatsappPhone && (
                    <button
                      onClick={() => {
                        const messageText = n.whatsappMessage || `Olá! Recebemos seu contato através da Codeengine e gostaríamos de alinhar os detalhes.`;
                        onOpenWhatsAppCharge(n.whatsappPhone!, messageText);
                      }}
                      className={`w-full mt-1.5 py-2 px-3 rounded-[29px] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
                        isLead 
                          ? 'bg-[#0050d7] hover:bg-[#003da9] text-white shadow-sm'
                          : 'bg-[#000000] hover:opacity-85 text-white'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{isLead ? 'Atender Lead no WhatsApp' : 'Enviar Mensagem no WhatsApp'}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f7f3f2] p-3 border-t border-[#c4c7c7]/40 text-center text-xs text-[#747878] font-normal">
          Notificações sincronizadas em tempo real com sua base.
        </div>

      </div>
    </div>
  );
};
