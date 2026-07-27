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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Notificações & Alertas</h3>
              <p className="text-xs text-slate-400">Alertas automáticos de cobranças e prazos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/40" />
              <p className="font-medium text-slate-400">Tudo em ordem!</p>
              <p className="text-xs text-slate-500">Nenhum alerta ou cobrança pendente neste momento.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/70 hover:bg-slate-800 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400">{n.date}</span>
                </div>

                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {n.message}
                </p>

                {n.whatsappPhone && n.whatsappMessage && (
                  <button
                    onClick={() => {
                      onOpenWhatsAppCharge(n.whatsappPhone!, n.whatsappMessage!);
                    }}
                    className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
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
        <div className="p-3 border-t border-slate-800 text-center text-xs text-slate-500 bg-slate-950/40">
          Alertas calculados em tempo real com base na sua agenda.
        </div>

      </div>
    </div>
  );
};
