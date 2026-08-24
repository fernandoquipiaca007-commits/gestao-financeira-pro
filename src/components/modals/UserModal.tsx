import React, { useState, useEffect } from 'react';
import { X, UserPlus, Eye, EyeOff, Loader2, Shield, Users } from 'lucide-react';
import { UserProfile, UserRole, ROLE_LABELS } from '../../types/rbac';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    status: 'active' | 'suspended';
  }) => Promise<void>;
  userToEdit?: UserProfile | null;
}

export function UserModal({ isOpen, onClose, onSave, userToEdit }: UserModalProps) {
  const isEditing = !!userToEdit;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('employee');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setName(userToEdit.name);
        setEmail(userToEdit.email);
        setRole(userToEdit.role === 'owner' ? 'admin' : userToEdit.role);
        setStatus(userToEdit.status === 'suspended' ? 'suspended' : 'active');
        setPassword('');
      } else {
        setName(''); setEmail(''); setPassword('');
        setRole('employee'); setStatus('active');
      }
      setError('');
    }
  }, [isOpen, userToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) { setError('Nome e email são obrigatórios'); return; }
    if (!isEditing && password.length < 6) { setError('Senha temporária deve ter no mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      await onSave({
        id: userToEdit?.id,
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
        role,
        status,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar utilizador');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: Array<{ value: UserRole; label: string; desc: string; icon: React.ReactNode }> = [
    {
      value: 'admin',
      label: 'Admin',
      desc: 'Acesso administrativo amplo conforme permissões',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      value: 'employee',
      label: 'Funcionário',
      desc: 'Acesso operacional limitado ao seu escopo',
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[24px] border border-[#c4c7c7]/30 shadow-[0_8px_40px_rgba(0,0,0,0.06)] w-full max-w-md">
        {/* Header */}
        <div className="bg-[#f7f3f2] p-5 border-b border-[#c4c7c7]/40 rounded-t-[24px] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#000000] text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1b1b] text-base">
                {isEditing ? 'Editar Utilizador' : 'Novo Utilizador'}
              </h3>
              <p className="text-xs text-[#747878]">
                {isEditing ? 'Alterar dados e cargo' : 'Criar conta com senha temporária'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-[#93000a] text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Nome Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do utilizador"
              required
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@empresa.com"
              required
              disabled={isEditing}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all disabled:opacity-60"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Senha Temporária
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#747878] hover:text-[#1c1b1b] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#747878] mt-1">O utilizador poderá alterar a senha no primeiro acesso.</p>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-2">
              Cargo
            </label>
            <div className="space-y-2">
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center space-x-3 transition-all cursor-pointer ${
                    role === opt.value
                      ? 'border-[#000000] bg-[#f1edec]'
                      : 'border-[#c4c7c7]/40 bg-[#f7f3f2] hover:border-[#c4c7c7]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    role === opt.value ? 'bg-[#000000] text-white' : 'bg-[#e5e2e1] text-[#747878]'
                  }`}>{opt.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#1c1b1b]">{opt.label}</div>
                    <div className="text-[11px] text-[#747878]">{opt.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                    role === opt.value ? 'border-[#000000] bg-[#000000]' : 'border-[#c4c7c7]'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {isEditing && (
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Estado
              </label>
              <div className="flex space-x-2">
                {(['active', 'suspended'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-[29px] text-xs font-medium border transition-all cursor-pointer ${
                      status === s
                        ? 'bg-[#000000] text-white border-[#000000]'
                        : 'bg-[#f1edec] text-[#444747] border-[#c4c7c7]/40 hover:border-[#c4c7c7]'
                    }`}
                  >
                    {s === 'active' ? 'Ativo' : 'Suspenso'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-2 border-t border-[#c4c7c7]/40">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-[29px] bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-sm font-medium cursor-pointer transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-2 bg-[#000000] hover:opacity-85 disabled:opacity-40 text-white font-medium text-sm rounded-[29px] flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'A guardar...' : isEditing ? 'Guardar' : 'Criar Utilizador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
