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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs p-2 sm:p-4 animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
              <Bell className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Notificações &amp; Alertas</h3>
              <p className="text-xs text-slate-600 font-bold">Alertas automáticos de cobranças e prazos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-600 text-sm space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
              <p className="font-black text-slate-900">Tudo em ordem!</p>
              <p className="text-xs text-slate-600 font-semibold">Nenhum alerta ou cobrança pendente neste momento.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" /> {n.title}
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-600">{n.date}</span>
                </div>

                <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                  {n.message}
                </p>

                {n.whatsappPhone && n.whatsappMessage && (
                  <button
                    onClick={() => {
                      onOpenWhatsAppCharge(n.whatsappPhone!, n.whatsappMessage!);
                    }}
                    className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
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
        <div className="p-3 border-t border-slate-200 text-center text-xs text-slate-600 font-bold bg-slate-50">
          Alertas calculados em tempo real com base na sua agenda.
        </div>

      </div>
    </div>
  );
};
