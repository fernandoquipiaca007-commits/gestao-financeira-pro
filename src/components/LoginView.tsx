import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, KeyRound, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserSession } from '../types';
import { fetchUserProfile } from '../lib/db';
import { APP_CONFIG } from '../config/app';
import { DalaConstellation } from './ui/DalaConstellation';
import { useLanguage } from '../contexts/LanguageContext';

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 70,
  cursor = '|',
  loop = true,
  deleteSpeed = 35,
  delay = 2200,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || '';

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed
    );

    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, currentText, loop, speed, deleteSpeed, delay, textArray.length]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse text-[#0050d7] dark:text-[#4d8bff] ml-0.5">{cursor}</span>
    </span>
  );
}

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

// Sistema interno: só entrada. Não há registo público — o owner cria as contas da equipa.
export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const { lang, setLang } = useLanguage();
  const en = lang === 'en';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [mustChangePass, setMustChangePass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pendingSession, setPendingSession] = useState<UserSession | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (!data.user || !data.session) return;

      const profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        setErrorMessage(en
          ? 'This account is not linked to the company. Ask the owner to add you.'
          : 'Esta conta não está ligada à empresa. Peça ao owner para o adicionar.');
        return;
      }

      if (profile.status === 'suspended') {
        await supabase.auth.signOut();
        setErrorMessage(en
          ? 'Your account has been suspended. Contact your company administrator.'
          : 'A tua conta foi suspensa. Contacte o administrador da empresa.');
        return;
      }

      const userSession: UserSession = {
        id: data.user.id,
        email: data.user.email || email.trim(),
        name: profile.name || data.user.user_metadata?.name || (en ? 'Manager' : 'Gestor'),
        role: profile.role,
        companyId: profile.companyId,
        status: profile.status,
        token: data.session.access_token,
      };

      if (profile.mustChangePassword) {
        setPendingSession(userSession);
        setMustChangePass(true);
        return;
      }

      onLoginSuccess(userSession);
    } catch (err: unknown) {
      console.warn('Auth error:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Invalid login credentials')) {
        setErrorMessage(en ? 'Incorrect email or password.' : 'Email ou palavra-passe incorretos.');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setErrorMessage(en ? 'Email pending confirmation. Check your inbox.' : 'E-mail pendente de confirmação. Verifique a sua caixa de entrada.');
      } else {
        setErrorMessage(msg || (en ? 'Authentication error. Please try again.' : 'Erro ao autenticar. Tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage(en ? 'New password must be at least 6 characters.' : 'A nova palavra-passe deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      if (pendingSession) {
        await supabase.from('user_profiles').update({ must_change_password: false }).eq('id', pendingSession.id);
        onLoginSuccess(pendingSession);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : (en ? 'Error updating password' : 'Erro ao atualizar palavra-passe'));
    } finally {
      setLoading(false);
    }
  };

  const typewriterQuotes = en
    ? ['Every payment, withdrawal and project in one place.', 'The real cash balance, month by month.', `Welcome back to ${APP_CONFIG.name}.`]
    : ['Cada pagamento, retirada e projeto no mesmo sítio.', 'O saldo real em caixa, mês a mês.', `Bem-vindo de volta ao ${APP_CONFIG.name}.`];

  const inputClass =
    'w-full h-11 sm:h-12 bg-[#141720] border border-white/20 rounded-xl pl-10 sm:pl-11 pr-11 text-sm sm:text-base text-white placeholder-neutral-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/15 transition-all shadow-xs';
  const inputStyle = { color: '#ffffff', backgroundColor: '#141720' };
  const labelClass = 'block text-[13px] sm:text-sm font-semibold text-slate-100 mb-1.5';

  return (
    <div className="w-full min-h-screen md:h-screen md:overflow-hidden bg-[#0c0f17] flex flex-col md:grid md:grid-cols-12 text-white font-sans antialiased">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none; }
      `}</style>

      <div className="w-full md:col-span-6 h-full flex flex-col justify-center px-5 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 relative z-10 bg-[#0c0f17] md:border-r border-[#1e2333] overflow-y-auto">
        <div className="w-full mx-auto my-auto max-w-[400px] sm:max-w-[450px]">
          <div className="flex items-center justify-end mb-3 sm:mb-4 lg:mb-5">
            <div className="flex items-center gap-1 bg-[#141720] border border-white/15 rounded-full p-0.5 sm:p-1 text-xs sm:text-sm font-medium">
              {(['pt', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer font-semibold ${lang === l ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 sm:mb-4 lg:mb-5">
            <div className="mb-2 sm:mb-2.5 flex items-center space-x-3">
              <img src="/logo.png" alt={APP_CONFIG.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-sm" />
              <span className="text-2xl sm:text-[26px] font-normal tracking-tight text-white" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: '#ffffff' }}>
                {APP_CONFIG.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-bold tracking-tight text-white leading-tight" style={{ color: '#ffffff' }}>
              {mustChangePass ? (en ? 'Update Password' : 'Atualizar palavra-passe') : (en ? 'Access your account' : 'Aceda à sua conta')}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-1 leading-snug" style={{ color: '#cbd5e1' }}>
              {mustChangePass
                ? (en ? 'For security, set a new personal password to continue' : 'Por segurança, defina uma nova palavra-passe pessoal para continuar')
                : (en ? 'Enter your credentials to manage the business' : 'Introduza as suas credenciais para gerir o negócio')}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-3 sm:mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-[#93000a] text-xs sm:text-sm font-medium">
              {errorMessage}
            </div>
          )}

          {mustChangePass ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="p-3.5 bg-[#fff3d6] rounded-xl text-[#7a5400] text-xs sm:text-sm flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>{en ? 'Set a secure new password with at least 6 characters.' : 'Defina uma nova palavra-passe segura com no mínimo 6 caracteres.'}</span>
              </div>
              <div>
                <label className={labelClass} style={{ color: '#f1f5f9' }}>{en ? 'New Password' : 'Nova palavra-passe'}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={en ? 'Minimum 6 characters' : 'Mínimo 6 caracteres'}
                  style={inputStyle}
                  className={inputClass.replace('pl-10 sm:pl-11 pr-11', 'px-4')}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 h-11 sm:h-12 bg-white hover:bg-neutral-100 text-black font-semibold rounded-full transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50 text-sm sm:text-base shadow-md"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin text-black" /> : null}
                <span>{loading ? (en ? 'Saving...' : 'A guardar...') : (en ? 'Save & Sign In' : 'Guardar e Entrar')}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
              <div>
                <label className={labelClass} style={{ color: '#f1f5f9' }}>{en ? 'Login Email' : 'E-mail de Acesso'}</label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" style={inputStyle} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: '#f1f5f9' }}>{en ? 'Password' : 'Palavra-passe'}</label>
                <div className="relative">
                  <Lock className="w-4.5 h-4.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={en ? 'Minimum 6 characters' : 'Mínimo 6 caracteres'}
                    style={inputStyle}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer transition-colors p-1.5 rounded-lg hover:bg-white/5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 sm:mt-5 h-11 sm:h-12 bg-white hover:bg-neutral-100 disabled:opacity-40 text-black font-semibold rounded-full transition-all flex items-center justify-center space-x-2.5 cursor-pointer active:scale-[0.99] shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin text-black" /> : <ArrowRight className="w-4.5 h-4.5 text-black" />}
                <span className="text-black font-semibold">{loading ? (en ? 'Processing...' : 'A processar...') : (en ? 'Sign In' : 'Entrar no Sistema')}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="hidden md:flex md:col-span-6 relative flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-14 bg-black overflow-hidden text-white select-none h-full">
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <DalaConstellation mode="galaxy-brain" particleCount={280} interactive={true} showLabels={false} />
        </div>
        <div className="absolute top-1/4 -right-16 w-[450px] h-[450px] bg-[#8052ff]/12 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[420px] h-[420px] bg-[#ffb829]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-[320px] h-[320px] bg-[#15846e]/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 my-auto py-4 max-w-lg mx-auto w-full text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffb829]/10 border border-[#ffb829]/25 text-[#ffb829] text-[11px] font-semibold tracking-wider uppercase">
            <Sparkles className="w-3 h-3" />
            <span>{en ? 'Internal system' : 'Sistema interno'}</span>
          </div>
          <p className="mt-4 text-3xl lg:text-4xl text-white leading-tight" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 400 }}>
            {APP_CONFIG.tagline}
          </p>
        </div>

        <div className="relative z-10 pb-2 lg:pb-4">
          <p className="text-sm sm:text-base lg:text-lg text-[#ffffff] leading-relaxed min-h-[44px]" style={{ fontWeight: 400, letterSpacing: '-0.3px' }}>
            “<Typewriter key={`login-quote-${lang}`} text={typewriterQuotes} speed={50} delay={2000} loop={true} />”
          </p>
        </div>
      </div>
    </div>
  );
}
