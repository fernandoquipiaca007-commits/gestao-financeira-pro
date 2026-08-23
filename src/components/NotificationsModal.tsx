import React from 'react';
import { X, Bell, AlertTriangle, CheckCircle2, Clock, MessageCircle, ArrowRight } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onOpenWhatsAppCharge,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-2 sm:p-4 animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white border border-[#c4c7c7]/30 rounded-[24px] h-full max-h-[90vh] flex flex-col shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">

        {/* Header */}
        <div className="bg-[#f7f3f2] p-5 border-b border-[#c4c7c7]/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-[#fff3d6] text-[#7a5400] flex items-center justify-center">
              <Bell className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1b1b] text-base">Notificações &amp; Alertas</h3>
              <p className="text-sm text-[#747878]">Alertas automáticos de cobranças e prazos</p>
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
              <p className="text-sm text-[#747878]">Nenhum alerta ou cobrança pendente neste momento.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-[16px] bg-[#f7f3f2] border border-[#c4c7c7]/30 hover:bg-[#f1edec] transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#7a5400] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" /> {n.title}
                  </span>
                  <span className="text-[11px] text-[#747878]">{n.date}</span>
                </div>

                <p className="text-sm text-[#1c1b1b] leading-relaxed">
                  {n.message}
                </p>

                {n.whatsappPhone && n.whatsappMessage && (
                  <button
                    onClick={() => {
                      onOpenWhatsAppCharge(n.whatsappPhone!, n.whatsappMessage!);
                    }}
                    className="w-full mt-2 py-2 px-3 bg-[#000000] hover:opacity-85 text-white rounded-[29px] text-sm font-medium flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Enviar Lembrete WhatsApp</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f7f3f2] p-3 border-t border-[#c4c7c7]/40 text-center text-sm text-[#747878] font-normal">
          Alertas calculados em tempo real com base na sua agenda.
        </div>

      </div>
    </div>
  );
};
