import React, { useState, useRef } from 'react';
import { X, Mail, Paperclip, Send, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { EmailAttachment, SendEmailResult } from '../../types/email';
import { sendResendEmail } from '../../lib/resend';
import { getStoredSettings } from '../../lib/storage';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientEmail?: string;
  defaultRecipientName?: string;
  defaultSubject?: string;
  defaultMessage?: string;
  defaultAttachments?: EmailAttachment[];
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  defaultRecipientEmail = '',
  defaultRecipientName = '',
  defaultSubject = '',
  defaultMessage = '',
  defaultAttachments = [],
}) => {
  const [toEmail, setToEmail] = useState(defaultRecipientEmail);
  const [recipientName, setRecipientName] = useState(defaultRecipientName);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [attachments, setAttachments] = useState<EmailAttachment[]>(defaultAttachments);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setToEmail(defaultRecipientEmail);
      setRecipientName(defaultRecipientName);
      setSubject(defaultSubject);
      setMessage(defaultMessage);
      setAttachments(defaultAttachments || []);
      setFeedback(null);
    }
  }, [isOpen, defaultRecipientEmail, defaultRecipientName, defaultSubject, defaultMessage, defaultAttachments]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`O ficheiro "${file.name}" excede o tamanho máximo de 15MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Url = ev.target?.result as string;
        const newAtt: EmailAttachment = {
          filename: file.name,
          content: base64Url,
          contentType: file.type,
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!toEmail.trim() || !toEmail.includes('@')) {
      setFeedback({ type: 'error', text: 'Insira um e-mail de destino válido.' });
      return;
    }
    if (!subject.trim()) {
      setFeedback({ type: 'error', text: 'Insira o assunto do e-mail.' });
      return;
    }

    setLoading(true);
    try {
      const settings = getStoredSettings();

      const formattedHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1c1b1b;">
          <h2 style="color: #000000; border-bottom: 2px solid #0050d7; padding-bottom: 8px;">${subject}</h2>
          <p>Olá, ${recipientName || 'Cliente/Parceiro'},</p>
          <div style="background-color: #f7f3f2; padding: 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #1c1b1b; margin: 16px 0;">${message}</div>
          ${attachments.length > 0 ? `<p style="font-size: 12px; color: #747878;">📎 <strong>${attachments.length} ficheiro(s) em anexo.</strong></p>` : ''}
          <p style="font-size: 12px; color: #747878; margin-top: 24px;">Atenciosamente,<br><strong>${settings.businessName || 'GestãoFO'}</strong></p>
        </div>
      `;

      const result: SendEmailResult = await sendResendEmail({
        to: toEmail.trim(),
        subject: subject.trim(),
        html: formattedHtml,
        attachments,
      });

      if (result.success) {
        setFeedback({ type: 'success', text: 'E-mail enviado com sucesso via Resend!' });
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setFeedback({ type: 'error', text: result.error || 'Erro ao enviar e-mail.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Falha ao processar envio de e-mail.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-[#c4c7c7]/40 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-white border-b border-[#c4c7c7]/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#dbe1ff] text-[#003da9] flex items-center justify-center font-semibold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1c1b1b]">Enviar E-mail via Resend</h3>
              <p className="text-xs text-[#747878]">Comunicação direta com suporte a anexos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 mx-5 mt-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-[#d4eddf] text-[#1a6b3a]' : 'bg-[#ffdad6] text-[#ba1a1a]'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSend} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#747878] uppercase tracking-widest mb-1.5">
              Destinatário (E-mail) *
            </label>
            <input
              type="email"
              required
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="cliente@dominio.com"
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 focus:border-[#000000] focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#747878] uppercase tracking-widest mb-1.5">
              Assunto *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Cobrança / Fatura da Campanha"
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 focus:border-[#000000] focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#747878] uppercase tracking-widest mb-1.5">
              Mensagem
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva aqui a mensagem para o destinatário..."
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 focus:border-[#000000] focus:bg-white rounded-xl p-3.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-2 pt-2 border-t border-[#c4c7c7]/30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#0050d7]" />
                Anexar Ficheiros ({attachments.length})
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] rounded-full text-[11px] font-semibold transition-colors cursor-pointer border border-[#c4c7c7]/30"
              >
                + Adicionar Anexo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#f7f3f2] p-2 px-3 rounded-xl border border-[#c4c7c7]/30">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#0050d7] shrink-0" />
                      <span className="font-medium text-[#1c1b1b] truncate">{att.filename}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-[#ba1a1a] hover:underline text-[10px] font-semibold cursor-pointer shrink-0 ml-2"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="pt-4 border-t border-[#c4c7c7]/30 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] font-medium text-xs rounded-full transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#000000] hover:opacity-85 disabled:opacity-40 text-white font-semibold text-xs rounded-full flex items-center space-x-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A Enviar via Resend...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar E-mail</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
