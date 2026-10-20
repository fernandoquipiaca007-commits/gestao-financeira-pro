import React, { useState } from 'react';
import {
  Settings,
  Globe,
  RefreshCw,
  Check,
  User,
  Save,
  DollarSign,
  Download,
  Upload,
  Trash2,
  Shield,
  KeyRound,
  Loader2,
  Mail,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, CurrencyCode, CURRENCIES } from '../types';
import { EmailNotificationToggles } from '../types/email';
import { DEFAULT_EMAIL_SETTINGS } from '../lib/storage';
import { sendTestEmail } from '../lib/emailTemplates';
import { ROLE_LABELS, ROLE_COLORS, getRoleLabel } from '../types/rbac';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SettingsNav } from './settings/SettingsNav';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onClearData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onOpenDocs?: (section?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  onClearData,
  onExportData,
  onImportData,
  onOpenDocs,
}) => {
  const { userProfile, isOwner, hasPermission } = useAuth();
  const { mode, setMode } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const canEditSettings = isOwner || hasPermission('settings.edit');

  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>(settings.defaultCurrency);
  const [userName, setUserName] = useState(userProfile?.name || settings.userName || '');
  const [businessName, setBusinessName] = useState(settings.businessName || '');

  // Exchange rates state
  const [rateAoa, setRateAoa] = useState(settings.exchangeRates?.AOA || 165);
  const [rateUsd, setRateUsd] = useState(settings.exchangeRates?.USD || 0.18);
  const [rateEur, setRateEur] = useState(settings.exchangeRates?.EUR || 0.16);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Resend Email Settings State
  const initialEmail = settings.emailSettings || DEFAULT_EMAIL_SETTINGS;
  const sanitizedInitialFrom = initialEmail.fromEmail?.includes('notificacoes@resend.dev')
    ? 'CodeEngine <onboarding@resend.dev>'
    : initialEmail.fromEmail || 'CodeEngine <onboarding@resend.dev>';

  const [resendApiKey, setResendApiKey] = useState(initialEmail.apiKey || '');
  const [resendFromEmail, setResendFromEmail] = useState(sanitizedInitialFrom);
  const [resendReplyTo, setResendReplyTo] = useState(initialEmail.replyTo || '');
  const [resendEnabled, setResendEnabled] = useState(initialEmail.enabled ?? true);
  const [emailToggles, setEmailToggles] = useState<EmailNotificationToggles>(
    initialEmail.toggles || DEFAULT_EMAIL_SETTINGS.toggles
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      defaultCurrency,
      userName,
      businessName,
      exchangeRates: {
        BRL: 1,
        AOA: Number(rateAoa) || 165,
        USD: Number(rateUsd) || 0.18,
        EUR: Number(rateEur) || 0.16,
      },
      emailSettings: {
        apiKey: resendApiKey.trim(),
        fromEmail: resendFromEmail.trim() || 'CodeEngine <onboarding@resend.dev>',
        replyTo: resendReplyTo.trim(),
        enabled: resendEnabled,
        toggles: emailToggles,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const [emailSavedSuccess, setEmailSavedSuccess] = useState(false);
  const handleSaveEmailSettings = () => {
    onSaveSettings({
      ...settings,
      defaultCurrency,
      userName,
      businessName,
      exchangeRates: {
        BRL: 1,
        AOA: Number(rateAoa) || 165,
        USD: Number(rateUsd) || 0.18,
        EUR: Number(rateEur) || 0.16,
      },
      emailSettings: {
        apiKey: resendApiKey.trim(),
        fromEmail: resendFromEmail.trim() || 'CodeEngine <onboarding@resend.dev>',
        replyTo: resendReplyTo.trim(),
        enabled: resendEnabled,
        toggles: emailToggles,
      },
    });
    setEmailSavedSuccess(true);
    setTimeout(() => setEmailSavedSuccess(false), 3500);
  };

  const handleToggleEvent = (key: keyof EmailNotificationToggles) => {
    setEmailToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTestEmail = async () => {
    setTestEmailStatus(null);
    if (!resendApiKey.trim()) {
      setTestEmailStatus({
        text: lang === 'en' ? 'Please enter your Resend API Key before testing.' : 'Por favor, introduza a sua API Key do Resend antes de testar.',
        type: 'error'
      });
      return;
    }

    setTestEmailLoading(true);
    try {
      const adminEmail = userProfile?.email || 'admin@gestaofo.com';
      const result = await sendTestEmail(adminEmail, {
        apiKey: resendApiKey.trim(),
        fromEmail: resendFromEmail.trim() || 'CodeEngine <onboarding@resend.dev>',
        replyTo: resendReplyTo.trim(),
        enabled: resendEnabled,
        toggles: emailToggles,
      });

      if (result.success) {
        setTestEmailStatus({
          text: lang === 'en'
            ? `Test email sent successfully to ${adminEmail}! (ID: ${result.id})`
            : `E-mail de teste enviado com sucesso para ${adminEmail}! (ID: ${result.id})`,
          type: 'success'
        });
        // Salva automaticamente para que a chave nunca se perca após validação
        handleSaveEmailSettings();
      } else {
        setTestEmailStatus({
          text: result.error || (lang === 'en' ? 'Error sending test email.' : 'Erro ao enviar e-mail de teste.'),
          type: 'error'
        });
      }
    } catch (err: any) {
      setTestEmailStatus({
        text: err?.message || (lang === 'en' ? 'Error connecting to Resend API.' : 'Erro ao conectar com a API do Resend.'),
        type: 'error'
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);

    if (newPassword.length < 6) {
      setPassMessage({
        text: lang === 'en' ? 'Password must be at least 6 characters.' : 'A palavra-passe deve ter no mínimo 6 caracteres.',
        type: 'error'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({
        text: lang === 'en' ? 'Passwords do not match.' : 'As palavras-passe não coincidem.',
        type: 'error'
      });
      return;
    }

    setPassLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPassMessage({
        text: lang === 'en' ? 'Password changed.' : 'Palavra-passe alterada.',
        type: 'success'
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'en' ? 'Error changing password' : 'Erro ao alterar palavra-passe');
      setPassMessage({ text: msg, type: 'error' });
    } finally {
      setPassLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
  };

  const roleStyle = userProfile?.role ? ROLE_COLORS[userProfile.role] : undefined;

  return (
    <div className="pb-12 font-sans">
      <header className="pt-1 pb-6">
        <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">{t('nav.settings', 'Definições')}</h1>
      </header>
      <div className="grid lg:grid-cols-[200px_minmax(0,1fr)] gap-8 items-start">
        <SettingsNav canEdit={canEditSettings} isOwner={isOwner} lang={lang} />
        <div className="min-w-0 grid gap-6 xl:grid-cols-2 items-start">
      {/* 1. DEDICATED SYSTEM LANGUAGE & TRANSLATIONS AREA (TOP PROMINENCE) */}
      <div id="idioma" className="scroll-mt-24 bg-glass border border-line-subtle p-6 rounded-xl shadow-glass space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent-soft-fg " />
              {t('settings.languageAreaTitle', 'Idioma')}
            </h3>
            <p className="text-xs text-fg-muted mt-1">
              {t('settings.languageAreaDesc', 'Selecione o idioma em que deseja navegar pelo sistema. Todos os menus, painéis, cabeçalhos e formulários serão adaptados.')}
            </p>
          </div>
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-accent-soft text-accent-soft-fg shrink-0 font-mono border border-accent/20 shadow-xs">
            {lang === 'en' ? 'English' : 'Português'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Portuguese Option */}
          <button
            type="button"
            onClick={() => setLang('pt')}
            className={`p-4 rounded-lg border text-left flex items-start space-x-3.5 transition-all cursor-pointer ${
 lang === 'pt'
 ? 'border-fg bg-surface-2 ring-2 ring-[#000000]/10 shadow-xs'
 : 'border-line-subtle bg-glass-strong hover:border-line-strong hover:bg-surface-2 '
 }`}
          >
            <div className="w-10 h-10 rounded-md bg-surface-3 flex items-center justify-center shrink-0 text-fg font-mono font-bold text-sm">
              PT
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-fg ">
                  {t('settings.langPt', 'Português')}
                </span>
                {lang === 'pt' && <Check className="w-4 h-4 text-fg stroke-[2.5]" />}
              </div>
              <p className="text-xs text-fg-muted mt-1">
                {t('settings.langPtDesc', 'Interface completa em língua portuguesa')}
              </p>
            </div>
          </button>

          {/* English Option */}
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`p-4 rounded-lg border text-left flex items-start space-x-3.5 transition-all cursor-pointer ${
 lang === 'en'
 ? 'border-fg bg-surface-2 ring-2 ring-[#000000]/10 shadow-xs'
 : 'border-line-subtle bg-glass-strong hover:border-line-strong hover:bg-surface-2 '
 }`}
          >
            <div className="w-10 h-10 rounded-md bg-surface-3 flex items-center justify-center shrink-0 text-fg font-mono font-bold text-sm">
              EN
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-fg ">
                  {t('settings.langEn', 'English')}
                </span>
                {lang === 'en' && <Check className="w-4 h-4 text-fg stroke-[2.5]" />}
              </div>
              <p className="text-xs text-fg-muted mt-1">
                {t('settings.langEnDesc', 'Complete interface in English language')}
              </p>
            </div>
          </button>
        </div>

        <div className="p-3 rounded-md bg-surface-2 border border-line-subtle text-xs text-fg-muted flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success-fg shrink-0" />
          <span>{t('settings.langHint', 'Também pode mudar o idioma no menu da sua conta, no canto superior direito.')}</span>
        </div>
      </div>

      {/* User Profile Card */}
      {userProfile && (
        <div id="perfil" className="scroll-mt-24 bg-glass border border-line-subtle p-6 rounded-xl shadow-glass space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <User className="w-4 h-4 text-accent-soft-fg " />
              {t('settings.userProfile', 'Perfil')}
            </h3>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: roleStyle?.bg, color: roleStyle?.text }}
            >
              {getRoleLabel(userProfile.role, lang)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-3 bg-surface-2 rounded-md border border-line-subtle ">
              <span className="text-[13px] text-fg-secondary font-medium block mb-0.5">
                {t('common.name', 'Nome')}
              </span>
              <span className="text-sm font-medium text-fg ">{userProfile?.name || 'Utilizador'}</span>
            </div>

            <div className="p-3 bg-surface-2 rounded-md border border-line-subtle ">
              <span className="text-[13px] text-fg-secondary font-medium block mb-0.5">
                {t('common.email', 'E-mail')}
              </span>
              <span className="text-sm font-medium text-fg ">{userProfile.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Theme & Visual Appearance Card */}
      <div id="aparencia" className="scroll-mt-24 bg-glass border border-line-subtle p-6 rounded-xl shadow-glass space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            <Palette className="w-4 h-4 text-accent-soft-fg" />
            {t('settings.appearance', 'Aparência, Modo Dark & Cores')}
          </h3>
          <span className="text-xs text-fg-muted font-normal">
            {t('settings.appearanceDesc', 'Escolha o tema que preferir')}
          </span>
        </div>

        {/* Mode selection: Claro / Escuro / Sistema */}
        <div>
          <label className="text-[13px] font-medium text-fg-secondary block mb-2">
            {t('settings.viewMode', 'Tema')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode('light')}
              className={`flex items-center justify-center gap-2.5 p-3.5 rounded-lg border transition-all cursor-pointer ${
 mode === 'light'
 ? 'border-fg bg-accent-soft text-fg font-semibold shadow-xs'
 : 'border-line-subtle hover:bg-sunken text-fg-secondary '
 }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>{t('settings.modeLight', 'Modo Claro')}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('dark')}
              className={`flex items-center justify-center gap-2.5 p-3.5 rounded-lg border transition-all cursor-pointer ${
 mode === 'dark'
 ? 'border-fg bg-accent-soft text-fg font-semibold shadow-xs'
 : 'border-line-subtle hover:bg-sunken text-fg-secondary '
 }`}
            >
              <Moon className="w-4 h-4 text-accent-soft-fg" />
              <span>{t('settings.modeDark', 'Modo Escuro (Padrão)')}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('system')}
              className={`flex items-center justify-center gap-2.5 p-3.5 rounded-lg border transition-all cursor-pointer ${
 mode === 'system'
 ? 'border-fg bg-accent-soft text-fg font-semibold shadow-xs'
 : 'border-line-subtle hover:bg-sunken text-fg-secondary '
 }`}
            >
              <Monitor className="w-4 h-4 text-slate-500" />
              <span>{t('settings.modeSystem', 'Sincronizar com Sistema')}</span>
            </button>
          </div>
        </div>

        
      </div>

      {/* Change Password Form */}
      <form id="seguranca" onSubmit={handlePasswordChange} className="scroll-mt-24 bg-glass border border-line-subtle p-6 rounded-xl shadow-glass space-y-4">
        <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-accent-soft-fg " />
          {t('settings.changePassword', 'Alterar palavra-passe')}
        </h3>

        {passMessage && (
          <div
            className={`p-3 rounded-md text-xs font-medium ${
 passMessage.type === 'success'
 ? 'bg-success-soft text-success-fg border border-emerald-600/30'
 : 'bg-danger-soft text-danger-fg border border-rose-600/30'
 }`}
          >
            {passMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {t('settings.newPassword', 'Nova palavra-passe')}
            </label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder={t('settings.passwordMin', 'Mínimo 6 caracteres')}
              className="w-full px-4 py-3 bg-surface-2 border border-line-subtle rounded-md text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {t('settings.confirmPassword', 'Confirmar palavra-passe')}
            </label>
            <input
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder={t('settings.repeatPassword', 'Repita a nova palavra-passe')}
              className="w-full px-4 py-3 bg-surface-2 border border-line-subtle rounded-md text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={passLoading || !newPassword}
            className="aura-btn aura-btn--primary aura-btn--sm disabled:opacity-40"
          >
            {passLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{t('settings.updatePassword', 'Atualizar palavra-passe')}</span>
          </button>
        </div>
      </form>

      {/* Company / System Settings (Owner / Settings.edit only) */}
      {canEditSettings && (
        <form id="empresa" onSubmit={handleSubmit} className="xl:col-span-2 scroll-mt-24 bg-glass border border-line-subtle p-6 rounded-xl shadow-glass space-y-6">
          {/* Default Currency Section */}
          <div className="space-y-3 pb-6 border-b border-line-subtle ">
            <label className="text-sm font-semibold text-fg flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent-soft-fg stroke-[1.5]" />
              {t('settings.defaultCurrency', 'Moeda por defeito da empresa')}
            </label>
            <p className="text-xs text-fg-muted ">
              {t('settings.defaultCurrencyDesc', 'Esta moeda é usada por defeito ao criar novos projetos e clientes.')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                const isSelected = defaultCurrency === code;
                const curr = CURRENCIES[code];

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setDefaultCurrency(code)}
                    className={`p-3 rounded-md border text-left flex items-center space-x-3 transition-all cursor-pointer ${
 isSelected
 ? 'border-fg bg-surface-2 shadow-xs'
 : 'border-line-subtle hover:border-line-strong bg-glass-strong '
 }`}
                  >
                    <div className="w-8 h-8 rounded-sm bg-primary/5 shadow-primary-3d flex items-center justify-center shrink-0 font-mono font-bold text-xs text-fg ">
                      {curr?.symbol || code}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-fg ">{code}</div>
                      <div className="text-[10px] text-fg-muted ">{curr?.name || code}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exchange Rates Section */}
          <div className="space-y-3 pb-6 border-b border-line-subtle ">
            <label className="text-sm font-semibold text-fg flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success-fg stroke-[1.5]" />
              {t('settings.exchangeRates', 'Taxas de Câmbio em Relação ao Real (BRL)')}
            </label>
            <p className="text-xs text-fg-muted ">
              {t('settings.exchangeRatesDesc', 'Usadas para conversão automática em relatórios consolidados e dashboard.')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1">
                  {lang === 'en' ? '1 BRL in AOA (Kwanza)?' : '1 BRL vale quantos AOA (Kwanza)?'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={rateAoa}
                    onChange={(e) => setRateAoa(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-surface-2 border border-line-subtle rounded-md text-fg text-sm focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-fg-muted font-mono">Kz</span>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1">
                  {lang === 'en' ? '1 BRL in USD (Dollar)?' : '1 BRL vale quantos USD (Dólar)?'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={rateUsd}
                    onChange={(e) => setRateUsd(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-surface-2 border border-line-subtle rounded-md text-fg text-sm focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-fg-muted font-mono">$</span>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1">
                  {lang === 'en' ? '1 BRL in EUR (Euro)?' : '1 BRL vale quantos EUR (Euro)?'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={rateEur}
                    onChange={(e) => setRateEur(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-surface-2 border border-line-subtle rounded-md text-fg text-sm focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-fg-muted font-mono">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resend Email Configuration & Notifications Control Panel */}
          <div id="email" className="scroll-mt-24 space-y-4 pb-6 border-b border-line-subtle ">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <label className="text-sm font-semibold text-fg flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent-soft-fg " />
                  {t('settings.emailSettings', 'Envio de E-mails Transacionais & Notificações (Resend API)')}
                </label>
                <p className="text-xs text-fg-muted mt-0.5">
                  {lang === 'en'
                    ? 'Simply enter your Resend API Key. Email delivery is automatically enabled.'
                    : 'Basta inserir sua API Key do Resend. O envio de e-mails é ativado automaticamente.'}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 bg-surface-2 px-3.5 py-1.5 rounded-full border border-line-subtle text-xs font-semibold">
                {resendApiKey.trim() ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-success-fg ">
                      {lang === 'en' ? 'Emails Active' : 'E-mails Ativos'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-fg-muted " />
                    <span className="text-fg-muted ">
                      {lang === 'en' ? 'Awaiting API Key' : 'Aguardando Chave'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Guia Rápido e Links de Configuração Resend */}
            <div className="p-4 bg-[#f8f6f5] border border-line-subtle rounded-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-accent-soft-fg " />
                  {lang === 'en' ? 'How to set up in 3 simple steps:' : 'Como configurar em 3 passos simples:'}
                </span>
                <a
                  href="https://resend.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-accent-soft-fg hover:underline flex items-center gap-1 bg-glass-strong px-3 py-1 rounded-full border border-accent/20 shadow-xs"
                >
                  {lang === 'en' ? 'Create free Resend account' : 'Criar conta grátis no Resend'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <ol className="text-xs text-fg-secondary space-y-2 list-decimal list-inside pl-1">
                <li>
                  {lang === 'en' ? 'Go to ' : 'Acesse '}
                  <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" className="text-accent-soft-fg font-semibold underline">resend.com/signup</a>
                  {lang === 'en' ? ' and create your account (free up to 3,000 emails/month).' : ' e crie sua conta (grátis até 3.000 e-mails/mês).'}
                </li>
                <li>
                  {lang === 'en' ? (
                    <>In Resend dashboard, open <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-accent-soft-fg font-semibold underline">API Keys</a>, click <strong>"Create API Key"</strong>, copy the generated key (starts with <code className="bg-glass-strong px-1.5 py-0.5 rounded text-[11px] font-mono text-accent-soft-fg border border-line-subtle ">re_...</code>) and paste it below.</>
                  ) : (
                    <>No painel do Resend, abra <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-accent-soft-fg font-semibold underline">API Keys</a>, clique em <strong>"Create API Key"</strong>, copie a chave gerada (iniciada em <code className="bg-glass-strong px-1.5 py-0.5 rounded text-[11px] font-mono text-accent-soft-fg border border-line-subtle ">re_...</code>) e cole no campo abaixo.</>
                  )}
                </li>
                <li>
                  <strong>{lang === 'en' ? 'Which sender (From) should you use?' : 'Qual remetente (From) colocar?'}</strong>
                  <div className="mt-1 pl-4 space-y-1 text-[11px] text-fg-muted ">
                    <p>
                      {lang === 'en'
                        ? <>• <strong>New account without custom domain:</strong> Leave it as <code className="bg-glass-strong px-1 py-0.5 rounded font-mono text-fg border border-line-subtle ">CodeEngine &lt;onboarding@resend.dev&gt;</code>. Resend will deliver emails directly to your registered account address.</>
                        : <>• <strong>Conta nova sem domínio próprio:</strong> Deixe como <code className="bg-glass-strong px-1 py-0.5 rounded font-mono text-fg border border-line-subtle ">CodeEngine &lt;onboarding@resend.dev&gt;</code>. O Resend envia os emails para o endereço da sua conta Resend.</>}
                    </p>
                    <p>
                      {lang === 'en'
                        ? <>• <strong>Custom domain (production):</strong> Once you register your domain in <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-accent-soft-fg underline">Domains</a> on Resend, you can use your custom sender (e.g.: <code className="bg-glass-strong px-1 py-0.5 rounded font-mono text-fg border border-line-subtle ">Your Company &lt;notifications@yourdomain.com&gt;</code>).</>
                        : <>• <strong>Domínio próprio (produção):</strong> Quando registar o seu domínio em <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-accent-soft-fg underline">Domains</a> no Resend, pode usar o seu remetente (ex: <code className="bg-glass-strong px-1 py-0.5 rounded font-mono text-fg border border-line-subtle ">Sua Empresa &lt;notificacoes@seudominio.com&gt;</code>) para clientes e funcionários.</>}
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {testEmailStatus && (
              <div
                className={`p-3 rounded-md text-xs font-medium flex items-center gap-2 ${
 testEmailStatus.type === 'success' ? 'bg-success-soft text-success-fg border border-emerald-600/30' : 'bg-danger-soft text-danger-fg border border-rose-600/30'
 }`}
              >
                {testEmailStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testEmailStatus.text}</span>
              </div>
            )}

            {emailSavedSuccess && (
              <div className="p-3 rounded-md text-xs font-medium flex items-center gap-2 bg-success-soft text-success-fg border border-emerald-600/30">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'en' ? 'Email settings and API key saved successfully!' : 'Configurações de e-mail e chave API salvas com sucesso!'}
                </span>
              </div>
            )}

            {/* API Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="sm:col-span-2">
                <label className="text-[13px] font-medium text-fg-secondary block mb-1">
                  {lang === 'en' ? 'Resend API Key *' : 'Chave da API do Resend (API Key) *'}
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    onBlur={handleSaveEmailSettings}
                    placeholder="re_123456789_abcdef..."
                    className="w-full px-4 py-3 bg-surface-2 border border-line-subtle rounded-md text-fg text-sm focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3.5 top-3 text-fg-muted hover:text-fg cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1">
                  {lang === 'en' ? 'Sender Email (From) *' : 'E-mail do Remetente (From) *'}
                </label>
                <input
                  type="text"
                  value={resendFromEmail}
                  onChange={(e) => setResendFromEmail(e.target.value)}
                  placeholder="CodeEngine <onboarding@resend.dev>"
                  className="w-full px-4 py-3 bg-surface-2 border border-line-subtle rounded-md text-fg text-sm focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all font-medium"
                />
                <p className="text-[10px] text-fg-muted mt-1">
                  {lang === 'en' ? (
                    <>Testing account? Use <code className="text-accent-soft-fg font-mono">CodeEngine &lt;onboarding@resend.dev&gt;</code>. For custom domain, verify it in Resend.</>
                  ) : (
                    <>Conta em teste? Use <code className="text-accent-soft-fg font-mono">CodeEngine &lt;onboarding@resend.dev&gt;</code>. Para domínio próprio, verifique-o no Resend.</>
                  )}
                </p>
              </div>

              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1">
                  {lang === 'en' ? 'Reply-To Email' : 'E-mail de Resposta (Reply-To)'}
                </label>
                <input
                  type="email"
                  value={resendReplyTo}
                  onChange={(e) => setResendReplyTo(e.target.value)}
                  placeholder="suporte@seudominio.com"
                  className="w-full px-4 py-3 bg-surface-2 border border-line-subtle rounded-md text-fg text-sm focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-fg-muted inline-flex items-center gap-1.5 font-medium">
                {resendApiKey ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-success-fg " />
                    <span>{lang === 'en' ? 'Resend Configured' : 'Resend Configurado'}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-danger-fg " />
                    <span>{lang === 'en' ? 'Resend Pending API Key' : 'Resend Pendente de API Key'}</span>
                  </>
                )}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSaveEmailSettings}
                  className="aura-btn aura-btn--primary aura-btn--sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Save Key & Settings' : 'Guardar Chave & Configurações'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testEmailLoading || !resendApiKey}
                  className="px-4 py-2 bg-accent-soft hover:bg-[#c9d3ff] disabled:opacity-50 text-accent-soft-fg font-semibold text-xs rounded-full flex items-center space-x-1.5 transition-all cursor-pointer border border-accent/20 "
                >
                  {testEmailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{lang === 'en' ? 'Test Resend Connection' : 'Testar Conexão Resend'}</span>
                </button>
              </div>
            </div>

            {/* Granular Toggles */}
            <div className="pt-4 border-t border-line-subtle space-y-3">
              <h4 className="text-xs font-semibold text-fg uppercase tracking-wider">
                {lang === 'en' ? 'Active Email Events & Notifications' : 'Eventos & Notificações por E-mail Ativas'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  {
                    key: 'clientPaymentReminder',
                    title: lang === 'en' ? 'Client Payment Reminders' : 'Cobranças a Clientes',
                    desc: lang === 'en' ? 'Send due date notice via email' : 'Envio de aviso de vencimento por e-mail'
                  },
                  {
                    key: 'clientReceipt',
                    title: lang === 'en' ? 'Receipts / Proof of Payment' : 'Comprovativos / Recibos',
                    desc: lang === 'en' ? 'Automatic email upon income settlement' : 'Envio automático ao liquidar receita'
                  },
                  {
                    key: 'clientProjectUpdate',
                    title: lang === 'en' ? 'Project Updates' : 'Atualizações de Projeto',
                    desc: lang === 'en' ? 'Status and files sent to client' : 'Estado e ficheiros para o cliente'
                  },
                  {
                    key: 'employeeProjectAssigned',
                    title: lang === 'en' ? 'Project Assignment' : 'Atribuição de Projeto',
                    desc: lang === 'en' ? 'Email to team member when assigned a project' : 'E-mail ao colaborador ao receber projeto'
                  },
                  {
                    key: 'employeeTaskAssigned',
                    title: lang === 'en' ? 'Task Assignment' : 'Atribuição de Tarefa',
                    desc: lang === 'en' ? 'Email to team member when assigned a task' : 'E-mail ao colaborador ao receber tarefa'
                  },
                  {
                    key: 'employeeTaskDueAlert',
                    title: lang === 'en' ? 'Task Due Date Alerts' : 'Alertas de Prazo de Tarefa',
                    desc: lang === 'en' ? 'Alerts for upcoming task deadlines' : 'Avisos de tarefas a vencer'
                  },
                  {
                    key: 'employeeWelcome',
                    title: lang === 'en' ? 'Team Member Welcome' : 'Boas-vindas a Colaboradores',
                    desc: lang === 'en' ? 'Access credentials for new members' : 'Credenciais de acesso para novos membros'
                  },
                  {
                    key: 'adminBillingRequestAlert',
                    title: lang === 'en' ? 'Billing Requests (Admin)' : 'Pedidos de Faturação (Admin)',
                    desc: lang === 'en' ? 'Alert admin when employee requests invoice' : 'Alerta ao Admin quando colaborador pede fatura'
                  },
                  {
                    key: 'employeeBillingStatusAlert',
                    title: lang === 'en' ? 'Billing request status (employee)' : 'Estado da faturação (colaborador)',
                    desc: lang === 'en' ? 'Approval/rejection notifications for requests' : 'Avisos de aprovação/rejeição de pedidos'
                  },
                  {
                    key: 'systemAlertDueDates',
                    title: lang === 'en' ? 'System Due Date Alerts' : 'Alertas de Vencimento do Sistema',
                    desc: lang === 'en' ? 'Periodic summary of pending deadlines' : 'Resumo periódico de pendências'
                  },
                ].map((item) => {
                  const key = item.key as keyof EmailNotificationToggles;
                  const isChecked = emailToggles[key];

                  return (
                    <label
                      key={key}
                      className={`p-3 rounded-md border flex items-start justify-between space-x-3 cursor-pointer transition-all ${
 isChecked
 ? 'bg-surface-2 border-accent/40 shadow-2xs'
 : 'bg-glass-strong border-line-subtle opacity-70 hover:opacity-100'
 }`}
                    >
                      <div>
                        <div className="font-semibold text-fg text-xs">{item.title}</div>
                        <div className="text-[10px] text-fg-muted mt-0.5">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleEvent(key)}
                        className="rounded text-accent-soft-fg focus:ring-[#0050d7] w-4 h-4 cursor-pointer mt-0.5 shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="space-y-3 pb-6 border-b border-line-subtle ">
            <label className="text-sm font-semibold text-fg flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent-soft-fg " />
              {t('settings.companyDetails', 'Dados da Empresa')}
            </label>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1">
                {t('settings.companyName', 'Nome da Empresa')}
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Studio Digital Pro"
                className="w-full px-4 py-3 bg-surface-2 border border-line-subtle rounded-md text-fg text-sm focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-success-fg font-semibold flex items-center gap-1">
                <Check className="w-4 h-4 stroke-[2.5]" /> {t('settings.savedSuccess', 'Configurações salvas com sucesso!')}
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="aura-btn aura-btn--primary"
            >
              <Save className="w-4 h-4 stroke-[2]" />
              <span>{t('settings.saveCompanySettings', 'Guardar Alterações da Empresa')}</span>
            </button>
          </div>
        </form>
      )}

      {/* MCP API Keys & AI Agents Integration */}

      {/* Backup & Data Management (Owner only) */}
      {isOwner && (
        <div id="dados" className="xl:col-span-2 scroll-mt-24 bg-glass border border-line-subtle p-6 rounded-xl shadow-glass space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <Download className="w-5 h-5 text-accent-soft-fg stroke-[1.5]" />
              {t('settings.backup', 'Exportar & Importar Dados (Backup Seguro)')}
            </h3>
            <p className="text-xs text-fg-muted mt-1">
              {t('settings.backupDesc', 'Faça um backup completo dos seus clientes, projetos e finanças para ficheiro ou migração entre dispositivos.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export JSON */}
            <div className="p-4 rounded-lg bg-surface-2 border border-line-subtle space-y-2">
              <span className="text-xs font-semibold text-fg block">{t('settings.exportBackup', 'Exportar Backup')}</span>
              <p className="text-xs text-fg-muted ">{t('settings.exportDesc', 'Baixe um ficheiro .json contendo todos os registros.')}</p>
              <button
                type="button"
                onClick={onExportData}
                className="aura-btn aura-btn--primary aura-btn--sm mt-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('settings.downloadJson', 'Baixar Ficheiro JSON')}</span>
              </button>
            </div>

            {/* Import JSON */}
            <div className="p-4 rounded-lg bg-surface-2 border border-line-subtle space-y-2">
              <span className="text-xs font-semibold text-fg block">{t('settings.restoreBackup', 'Restaurar Backup')}</span>
              <p className="text-xs text-fg-muted ">{t('settings.restoreDesc', 'Carregue um ficheiro .json anteriormente exportado.')}</p>
              <label className="aura-btn aura-btn--secondary aura-btn--sm mt-2 inline-flex">
                <Upload className="w-3.5 h-3.5" />
                <span>{t('settings.selectBackupFile', 'Selecionar Ficheiro Backup')}</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
