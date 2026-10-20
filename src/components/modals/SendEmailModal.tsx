import React, { useState, useRef } from 'react';
import { confirmAction, toast } from '../../lib/feedback';
import { EditorPage } from '../shell/EditorPage';
import { X, Mail, Paperclip, Send, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { EmailAttachment, SendEmailResult } from '../../types/email';
import { sendResendEmail } from '../../lib/resend';
import { getStoredSettings } from '../../lib/storage';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t, lang } = useLanguage();
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
        toast({ tone: 'warning', title: lang === 'en' ? `File "${file.name}" exceeds the maximum 15MB limit.` : `O ficheiro "${file.name}" excede o tamanho máximo de 15MB.` });
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
      setFeedback({
        type: 'error',
        text: lang === 'en' ? 'Please enter a valid recipient email.' : 'Insira um e-mail de destino válido.'
      });
      return;
    }
    if (!subject.trim()) {
      setFeedback({
        type: 'error',
        text: lang === 'en' ? 'Please enter an email subject.' : 'Insira o assunto do e-mail.'
      });
      return;
    }

    setLoading(true);
    try {
      const settings = getStoredSettings();

      const greeting = lang === 'en'
        ? `Hello, ${recipientName || 'Client/Partner'},`
        : `Olá, ${recipientName || 'Cliente/Parceiro'},`;

      const attachmentText = lang === 'en'
        ? `${attachments.length} attachment(s) included.`
        : `${attachments.length} ficheiro(s) em anexo.`;

      const signOff = lang === 'en' ? 'Best regards,' : 'Atenciosamente,';

      const formattedHtml = `
 <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1c1b1b;">
 <h2 style="color: #000000; border-bottom: 2px solid #0050d7; padding-bottom: 8px;">${subject}</h2>
 <p>${greeting}</p>
 <div style="background-color: #f7f3f2; padding: 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #1c1b1b; margin: 16px 0;">${message}</div>
 ${attachments.length > 0 ? `<p style="font-size: 12px; color: #747878;"><strong>${attachmentText}</strong></p>` : ''}
          <p style="font-size: 12px; color: #747878; margin-top: 24px;">${signOff}<br><strong>${settings.businessName || 'CodeEngine'}</strong></p>
        </div>
      `;

      const result: SendEmailResult = await sendResendEmail({
        to: toEmail.trim(),
        subject: subject.trim(),
        html: formattedHtml,
        attachments,
      });

      if (result.success) {
        setFeedback({
          type: 'success',
          text: lang === 'en' ? 'Email sent successfully via Resend!' : 'E-mail enviado com sucesso via Resend!'
        });
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setFeedback({
          type: 'error',
          text: result.error || (lang === 'en' ? 'Error sending email.' : 'Erro ao enviar e-mail.')
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (lang === 'en' ? 'Failed to process email delivery.' : 'Falha ao processar envio de e-mail.')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <EditorPage
      title={<>{lang === 'en' ? 'Send Email via Resend' : 'Enviar E-mail via Resend'}</>}
      trail={[lang === 'en' ? 'Clients' : 'Clientes']}
      subtitle={<>{lang === 'en' ? 'Direct communication with attachment support' : 'Comunicação direta com suporte a anexos'}</>}
      icon={<Mail className="w-5 h-5" />}
      onClose={onClose}
      actions={<>
            <button
              type="button"
              onClick={onClose}
              className="aura-btn aura-btn--ghost"
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="aura-btn aura-btn--primary"
             form="email-form">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'en' ? 'Sending via Resend...' : 'A Enviar via Resend...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Send Email' : 'Enviar E-mail'}</span>
                </>
              )}
            </button>
          </>}
    >
      <form id="email-form" className="space-y-6 text-fg" onSubmit={handleSend}>
          <div>
            <label className="block text-[13px] font-medium text-fg-secondary mb-1.5">
              {lang === 'en' ? 'Recipient (Email) *' : 'Destinatário (E-mail) *'}
            </label>
            <input
              type="email"
              required
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="cliente@dominio.com"
              className="w-full bg-surface-2 border border-line-subtle focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-fg-secondary mb-1.5">
              {lang === 'en' ? 'Subject *' : 'Assunto *'}
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={lang === 'en' ? "e.g. Campaign Invoice / Project Delivery" : "Ex: Cobrança / Fatura da Campanha"}
              className="w-full bg-surface-2 border border-line-subtle focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-fg-secondary mb-1.5">
              {lang === 'en' ? 'Message' : 'Mensagem'}
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={lang === 'en' ? "Write your message to recipient here..." : "Escreva aqui a mensagem para o destinatário..."}
              className="w-full bg-surface-2 border border-line-subtle focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] rounded-md p-3.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-2 pt-2 border-t border-line-subtle ">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-fg-secondary flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-accent-soft-fg " />
                {lang === 'en' ? `Attach Files (${attachments.length})` : `Anexar Ficheiros (${attachments.length})`}
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aura-btn aura-btn--secondary aura-btn--sm"
              >
                {lang === 'en' ? '+ Add Attachment' : '+ Adicionar Anexo'}
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
              <div className="space-y-1.5">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-surface-2 p-2 px-3 rounded-md border border-line-subtle ">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-accent-soft-fg shrink-0" />
                      <span className="font-medium text-fg truncate">{att.filename}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-danger-fg hover:underline text-[10px] font-semibold cursor-pointer shrink-0 ml-2"
                    >
                      {lang === 'en' ? 'Remove' : 'Remover'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer controls */}
          
        </form>
    </EditorPage>
  );
};
