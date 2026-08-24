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
} from 'lucide-react';
import { AppSettings, CurrencyCode, CURRENCIES } from '../types';
import { EmailNotificationToggles } from '../types/email';
import { DEFAULT_EMAIL_SETTINGS } from '../lib/storage';
import { sendTestEmail } from '../lib/emailTemplates';
import { ROLE_LABELS, ROLE_COLORS } from '../types/rbac';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onClearData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  onClearData,
  onExportData,
  onImportData,
}) => {
  const { userProfile, isOwner, hasPermission } = useAuth();
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
  const [resendApiKey, setResendApiKey] = useState(initialEmail.apiKey || '');
  const [resendFromEmail, setResendFromEmail] = useState(initialEmail.fromEmail || 'GestãoFO <notificacoes@resend.dev>');
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
        fromEmail: resendFromEmail.trim(),
        replyTo: resendReplyTo.trim(),
        enabled: resendEnabled,
        toggles: emailToggles,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
      setTestEmailStatus({ text: 'Por favor, introduza a sua API Key do Resend antes de testar.', type: 'error' });
      return;
    }

    setTestEmailLoading(true);
    try {
      const adminEmail = userProfile?.email || 'admin@gestaofo.com';
      const result = await sendTestEmail(adminEmail);

      if (result.success) {
        setTestEmailStatus({ text: `E-mail de teste enviado com sucesso para ${adminEmail}!`, type: 'success' });
      } else {
        setTestEmailStatus({ text: result.error || 'Erro ao enviar e-mail de teste.', type: 'error' });
      }
    } catch (err: any) {
      setTestEmailStatus({ text: err?.message || 'Erro ao conectar com a API do Resend.', type: 'error' });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);

    if (newPassword.length < 6) {
      setPassMessage({ text: 'A senha deve ter no mínimo 6 caracteres.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    setPassLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPassMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar senha';
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <h2 className="text-lg font-semibold text-[#1c1b1b] tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#444747]" />
          Configurações do Sistema
        </h2>
        <p className="text-xs text-[#747878] mt-0.5">
          {canEditSettings
            ? 'Personalize a moeda padrão, cotações de câmbio, dados da empresa e segurança'
            : 'Gerencie seu perfil pessoal e preferências de acesso'}
        </p>
      </div>

      {/* User Profile Card */}
      {userProfile && (
        <div className="bg-white border border-[#c4c7c7]/40 p-6 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
              <User className="w-4 h-4 text-[#0050d7]" />
              Perfil do Utilizador
            </h3>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: roleStyle?.bg, color: roleStyle?.text }}
            >
              {ROLE_LABELS[userProfile.role]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-3 bg-[#f7f3f2] rounded-xl border border-[#c4c7c7]/30">
              <span className="text-[11px] text-[#747878] font-semibold uppercase tracking-wider block mb-0.5">
                Nome
              </span>
              <span className="text-sm font-medium text-[#1c1b1b]">{userProfile.name}</span>
            </div>

            <div className="p-3 bg-[#f7f3f2] rounded-xl border border-[#c4c7c7]/30">
              <span className="text-[11px] text-[#747878] font-semibold uppercase tracking-wider block mb-0.5">
                E-mail
              </span>
              <span className="text-sm font-medium text-[#1c1b1b]">{userProfile.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Form */}
      <form onSubmit={handlePasswordChange} className="bg-white border border-[#c4c7c7]/40 p-6 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <h3 className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#0050d7]" />
          Alterar Senha Pessoal
        </h3>

        {passMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-medium ${
              passMessage.type === 'success'
                ? 'bg-[#d4eddf] text-[#1a6b3a]'
                : 'bg-[#ffdad6] text-[#ba1a1a]'
            }`}
          >
            {passMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Nova Senha
            </label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={passLoading || !newPassword}
            className="px-5 py-2 bg-[#000000] hover:opacity-85 disabled:opacity-40 text-white font-medium text-xs rounded-[29px] flex items-center space-x-2 transition-all cursor-pointer"
          >
            {passLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Atualizar Senha</span>
          </button>
        </div>
      </form>

      {/* Company / System Settings (Owner / Settings.edit only) */}
      {canEditSettings && (
        <form onSubmit={handleSubmit} className="bg-white border border-[#c4c7c7]/40 p-6 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
          {/* Default Currency Section */}
          <div className="space-y-3 pb-6 border-b border-[#c4c7c7]/40">
            <label className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#0050d7] stroke-[1.5]" />
              Moeda Padrão da Empresa
            </label>
            <p className="text-xs text-[#747878]">
              A moeda selecionada aqui será preenchida automaticamente ao cadastrar novos projetos e clientes no sistema.
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
                    className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#000000] bg-[#f1edec] shadow-xs'
                        : 'border-[#c4c7c7]/40 hover:border-[#c4c7c7] bg-white'
                    }`}
                  >
                    <span className="text-xl">{curr.flag}</span>
                    <div>
                      <div className="text-xs font-semibold text-[#1c1b1b]">{code}</div>
                      <div className="text-[10px] text-[#747878]">{curr.symbol}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exchange Rates Section */}
          <div className="space-y-3 pb-6 border-b border-[#c4c7c7]/40">
            <label className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#1a6b3a] stroke-[1.5]" />
              Taxas de Câmbio em Relação ao Real (BRL)
            </label>
            <p className="text-xs text-[#747878]">
              Usadas para conversão automática em relatórios consolidados e dashboard.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
                  1 BRL vale quantos AOA (Kwanza)?
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={rateAoa}
                    onChange={(e) => setRateAoa(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-[#747878] font-mono">Kz</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
                  1 BRL vale quantos USD (Dólar)?
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={rateUsd}
                    onChange={(e) => setRateUsd(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-[#747878] font-mono">$</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
                  1 BRL vale quantos EUR (Euro)?
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={rateEur}
                    onChange={(e) => setRateEur(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-[#747878] font-mono">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resend Email Configuration & Notifications Control Panel */}
          <div className="space-y-4 pb-6 border-b border-[#c4c7c7]/40">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0050d7]" />
                  Envio de E-mails Transacionais & Notificações (Resend API)
                </label>
                <p className="text-xs text-[#747878] mt-0.5">
                  Configure a sua chave API do Resend e controle quais eventos disparam e-mails automáticos.
                </p>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer bg-[#f1edec] px-3 py-1.5 rounded-full border border-[#c4c7c7]/40">
                <input
                  type="checkbox"
                  checked={resendEnabled}
                  onChange={(e) => setResendEnabled(e.target.checked)}
                  className="rounded text-[#0050d7] focus:ring-[#0050d7] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#1c1b1b]">
                  {resendEnabled ? 'E-mails Ativos' : 'Desativados'}
                </span>
              </label>
            </div>

            {testEmailStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  testEmailStatus.type === 'success' ? 'bg-[#d4eddf] text-[#1a6b3a]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                }`}
              >
                {testEmailStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testEmailStatus.text}</span>
              </div>
            )}

            {/* API Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
                  Chave da API do Resend (API Key) *
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="re_123456789_abcdef..."
                    className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3.5 top-3 text-[#747878] hover:text-[#1c1b1b]"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
                  E-mail do Remetente (From) *
                </label>
                <input
                  type="text"
                  value={resendFromEmail}
                  onChange={(e) => setResendFromEmail(e.target.value)}
                  placeholder="GestãoFO <notificacoes@seudominio.com>"
                  className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
                  E-mail de Resposta (Reply-To)
                </label>
                <input
                  type="email"
                  value={resendReplyTo}
                  onChange={(e) => setResendReplyTo(e.target.value)}
                  placeholder="suporte@seudominio.com"
                  className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#747878]">
                {resendApiKey ? '🟢 Resend Configurado' : '🔴 Resend Pendente de API Key'}
              </span>
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testEmailLoading || !resendApiKey}
                className="px-4 py-2 bg-[#dbe1ff] hover:bg-[#c9d3ff] disabled:opacity-50 text-[#003da9] font-semibold text-xs rounded-full flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                {testEmailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Testar Conexão Resend</span>
              </button>
            </div>

            {/* Granular Toggles */}
            <div className="pt-4 border-t border-[#c4c7c7]/30 space-y-3">
              <h4 className="text-xs font-semibold text-[#1c1b1b] uppercase tracking-wider">
                Eventos &amp; Notificações por E-mail Ativas
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'clientPaymentReminder', title: 'Cobranças a Clientes', desc: 'Envio de aviso de vencimento por e-mail' },
                  { key: 'clientReceipt', title: 'Comprovativos / Recibos', desc: 'Envio automático ao liquidar receita' },
                  { key: 'clientProjectUpdate', title: 'Atualizações de Projeto', desc: 'Status e arquivos para o cliente' },
                  { key: 'employeeProjectAssigned', title: 'Atribuição de Projeto', desc: 'E-mail ao colaborador ao receber projeto' },
                  { key: 'employeeTaskAssigned', title: 'Atribuição de Tarefa', desc: 'E-mail ao colaborador ao receber tarefa' },
                  { key: 'employeeTaskDueAlert', title: 'Alertas de Prazo de Tarefa', desc: 'Avisos de tarefas a vencer' },
                  { key: 'employeeWelcome', title: 'Boas-vindas a Colaboradores', desc: 'Credenciais de acesso para novos membros' },
                  { key: 'adminBillingRequestAlert', title: 'Pedidos de Faturamento (Admin)', desc: 'Alerta ao Admin quando colaborador pede fatura' },
                  { key: 'employeeBillingStatusAlert', title: 'Status de Faturamento (Colaborador)', desc: 'Avisos de aprovação/rejeição de pedidos' },
                  { key: 'systemAlertDueDates', title: 'Alertas de Vencimento do Sistema', desc: 'Resumo periódico de pendências' },
                ].map((item) => {
                  const key = item.key as keyof EmailNotificationToggles;
                  const isChecked = emailToggles[key];

                  return (
                    <label
                      key={key}
                      className={`p-3 rounded-xl border flex items-start justify-between space-x-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#f7f3f2] border-[#0050d7]/40 shadow-2xs'
                          : 'bg-white border-[#c4c7c7]/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-[#1c1b1b] text-xs">{item.title}</div>
                        <div className="text-[10px] text-[#747878] mt-0.5">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleEvent(key)}
                        className="rounded text-[#0050d7] focus:ring-[#0050d7] w-4 h-4 cursor-pointer mt-0.5 shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="space-y-3 pb-6 border-b border-[#c4c7c7]/40">
            <label className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0050d7]" />
              Dados da Empresa
            </label>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Studio Digital Pro"
                className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-[#1a6b3a] font-semibold flex items-center gap-1">
                <Check className="w-4 h-4 stroke-[2.5]" /> Configurações salvas com sucesso!
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#000000] hover:opacity-85 text-white font-medium text-sm rounded-[29px] flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 stroke-[2]" />
              <span>Salvar Alterações da Empresa</span>
            </button>
          </div>
        </form>
      )}

      {/* Backup & Data Management (Owner only) */}
      {isOwner && (
        <div className="bg-white border border-[#c4c7c7]/40 p-6 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
              <Download className="w-5 h-5 text-[#0050d7] stroke-[1.5]" />
              Exportar &amp; Importar Dados (Backup Seguro)
            </h3>
            <p className="text-xs text-[#747878] mt-1">
              Faça um backup completo dos seus clientes, projetos e finanças para arquivo ou migração entre dispositivos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export JSON */}
            <div className="p-4 rounded-[16px] bg-[#f7f3f2] border border-[#c4c7c7]/30 space-y-2">
              <span className="text-xs font-semibold text-[#1c1b1b] block">Exportar Backup</span>
              <p className="text-xs text-[#747878]">Baixe um arquivo .json contendo todos os registros.</p>
              <button
                type="button"
                onClick={onExportData}
                className="mt-2 px-4 py-2 bg-[#000000] hover:opacity-85 text-white rounded-[29px] text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Arquivo JSON</span>
              </button>
            </div>

            {/* Import JSON */}
            <div className="p-4 rounded-[16px] bg-[#f7f3f2] border border-[#c4c7c7]/30 space-y-2">
              <span className="text-xs font-semibold text-[#1c1b1b] block">Restaurar Backup</span>
              <p className="text-xs text-[#747878]">Carregue um arquivo .json anteriormente exportado.</p>
              <label className="mt-2 inline-flex px-4 py-2 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] rounded-[29px] text-xs font-medium items-center space-x-2 transition-all cursor-pointer border border-[#c4c7c7]/40">
                <Upload className="w-3.5 h-3.5" />
                <span>Selecionar Arquivo Backup</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Reset or Clear Data Section */}
      <div className="bg-white border border-[#c4c7c7]/40 p-6 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#747878] stroke-[1.5]" />
            Gerenciamento de Cache
          </h3>
          <p className="text-xs text-[#747878] mt-1">
            Recarregar dados do servidor ou limpar o cache local do navegador.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Reload from DB */}
          <div className="p-4 rounded-[16px] bg-[#f7f3f2] border border-[#c4c7c7]/30 space-y-2">
            <span className="text-xs font-semibold text-[#1c1b1b] flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-[#747878]" /> Recarregar Dados do Banco
            </span>
            <p className="text-xs text-[#747878]">
              Limpa o cache local e recarrega os dados diretamente do Supabase.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Limpar cache local e recarregar os dados do banco agora?')) {
                  onResetData();
                }
              }}
              className="mt-2 px-4 py-2 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-xs font-medium rounded-[29px] transition-all cursor-pointer border border-[#c4c7c7]/40"
            >
              Recarregar do Supabase
            </button>
          </div>

          {/* Clear all data (Owner only or cache clear) */}
          <div className="p-4 rounded-[16px] bg-[#ffdad6]/40 border border-[#ba1a1a]/20 space-y-2">
            <span className="text-xs font-semibold text-[#93000a] flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-[#ba1a1a]" /> Apagar Cache Local
            </span>
            <p className="text-xs text-[#747878]">
              Remove os dados em cache no navegador. Os dados no Supabase não serão apagados.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Apagar o cache local do navegador? Os dados no banco de dados permanecem intactos.')) {
                  onClearData();
                }
              }}
              className="mt-2 px-4 py-2 bg-[#ba1a1a] hover:opacity-85 text-white text-xs font-medium rounded-[29px] transition-all cursor-pointer"
            >
              Limpar Cache Local
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
