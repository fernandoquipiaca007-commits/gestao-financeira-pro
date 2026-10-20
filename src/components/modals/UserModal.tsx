import React, { useState, useEffect } from 'react';
import { EditorPage } from '../shell/EditorPage';
import { X, UserPlus, Eye, EyeOff, Loader2, Shield, Users, Globe, Info } from 'lucide-react';
import { UserProfile, UserRole, ROLE_LABELS } from '../../types/rbac';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserCount?: number;
  onSave: (data: {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    status: 'active' | 'suspended';
    language?: 'pt' | 'en';
  }) => Promise<void>;
  userToEdit?: UserProfile | null;
}

export function UserModal({ isOpen, onClose, onSave, userToEdit, currentUserCount }: UserModalProps) {
  const { t, lang: currentAppLang, setLang } = useLanguage();
  const isEditing = !!userToEdit;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('employee');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setName(userToEdit.name);
        setEmail(userToEdit.email);
        setRole(userToEdit.role === 'owner' ? 'admin' : userToEdit.role);
        setStatus(userToEdit.status === 'suspended' ? 'suspended' : 'active');
        setLanguage(userToEdit.language || currentAppLang || 'pt');
        setPassword('');
      } else {
        setName(''); setEmail(''); setPassword('');
        setRole('employee'); setStatus('active');
        setLanguage(currentAppLang || 'pt');
      }
      setError('');
    }
  }, [isOpen, userToEdit, currentAppLang]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) {
      setError(currentAppLang === 'en' ? 'Name and email are required' : 'Nome e email são obrigatórios');
      return;
    }
    if (!isEditing && password.length < 6) {
      setError(currentAppLang === 'en' ? 'Temporary password must be at least 6 characters' : 'Palavra-passe temporária deve ter no mínimo 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await onSave({
        id: userToEdit?.id,
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
        role,
        status,
        language,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: Array<{ value: UserRole; label: string; desc: string; icon: React.ReactNode }> = [
    {
      value: 'admin',
      label: 'Admin',
      desc: t('users.roleDescAdmin', 'Acesso administrativo amplo conforme permissões'),
      icon: <Shield className="w-4 h-4" />,
    },
    {
      value: 'employee',
      label: currentAppLang === 'en' ? 'Employee' : 'Funcionário',
      desc: t('users.roleDescEmployee', 'Acesso operacional limitado ao seu escopo'),
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <EditorPage
      title={<>{isEditing ? t('users.editUser', 'Editar Utilizador') : t('users.newUser', 'Novo Utilizador')}</>}
      trail={[t('nav.users', 'Utilizadores')]}
      subtitle={<>{isEditing ? t('users.editSubtitle', 'Alterar dados e cargo') : t('users.newSubtitle', 'Criar conta com palavra-passe temporária')}</>}
      icon={<UserPlus className="w-5 h-5" />}
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
             form="user-form">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? t('common.saving', 'A guardar...') : isEditing ? t('common.save', 'Guardar') : t('users.btnCreate', 'Criar Utilizador')}</span>
            </button>
          </>}
    >
      <form id="user-form" className="space-y-6 text-fg" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-danger-soft border border-danger/20 rounded-md text-danger-fg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {t('users.fullName', 'Nome Completo')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('users.fullNamePlaceholder', 'Nome do utilizador')}
              required
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {t('common.email', 'Email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('users.emailPlaceholder', 'email@empresa.com')}
              required
              disabled={isEditing}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all disabled:opacity-60"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {t('users.tempPassword', 'Palavra-passe temporária')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('users.minChars', 'Mínimo 6 caracteres')}
                  minLength={6}
                  className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 pr-10 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-fg-muted hover:text-fg cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-fg-muted mt-1">{t('users.tempPasswordHint', 'O utilizador poderá alterar a palavra-passe no primeiro acesso.')}</p>
            </div>
          )}

          {/* System Language Selection (Solicitado na Edição de Utilizadores) */}
          <div className="p-3 bg-surface-2 rounded-lg border border-line-subtle space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-fg flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-accent-soft-fg " />
                {t('users.systemLanguage', 'Idioma do Sistema')}
              </label>
              <span className="text-[11px] font-semibold text-accent-soft-fg font-mono">
                {language === 'en' ? 'English (EN)' : 'Português (PT)'}
              </span>
            </div>
            <p className="text-[11px] text-fg-muted ">
              {t('users.systemLanguageDesc', 'Idioma preferido para a interface e notificações deste utilizador')}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLanguage('pt')}
                className={`py-2 px-3 rounded-md border flex items-center justify-center space-x-2 text-xs font-medium transition-all cursor-pointer ${
 language === 'pt'
 ? 'border-fg bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'border-line-subtle hover:border-line-strong bg-glass-strong text-fg-secondary '
 }`}
              >
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${language === 'pt' ? 'bg-white/20 text-white' : 'bg-primary/5 shadow-primary-3d text-fg-secondary '}`}>PT</span>
                <span>Português (PT)</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-md border flex items-center justify-center space-x-2 text-xs font-medium transition-all cursor-pointer ${
 language === 'en'
 ? 'border-fg bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'border-line-subtle hover:border-line-strong bg-glass-strong text-fg-secondary '
 }`}
              >
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${language === 'en' ? 'bg-white/20 text-white' : 'bg-primary/5 shadow-primary-3d text-fg-secondary '}`}>EN</span>
                <span>English (EN)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-2">
              {t('users.roleLabel', 'Cargo')}
            </label>
            <div className="space-y-2">
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`w-full p-3 rounded-md border text-left flex items-center space-x-3 transition-all cursor-pointer ${
 role === opt.value
 ? 'border-fg bg-surface-2 '
 : 'border-line-subtle bg-surface-2 hover:border-line-strong '
 }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
 role === opt.value
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'bg-surface-3 text-fg-muted '
 }`}>{opt.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-fg ">{opt.label}</div>
                    <div className="text-[11px] text-fg-muted ">{opt.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
 role === opt.value ? 'border-fg bg-primary shadow-primary-3d ' : 'border-line '
 }`} />
                </button>
              ))}
            </div>
          </div>

          {isEditing && (
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {t('common.status', 'Estado')}
              </label>
              <div className="flex space-x-2">
                {(['active', 'suspended'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
 status === s
 ? 'bg-primary shadow-primary-3d text-primary-fg border-fg '
 : 'bg-surface-2 text-fg-secondary border-line-subtle hover:border-line-strong '
 }`}
                  >
                    {s === 'active' ? t('common.active', 'Ativo') : t('common.suspended', 'Suspenso')}
                  </button>
                ))}
              </div>
            </div>
          )}

          
        </form>
    </EditorPage>
  );
}
