import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name || 'Gestor' },
          },
        });

        if (error) throw error;

        if (data.user) {
          const userSession: UserSession = {
            id: data.user.id,
            email: data.user.email || email,
            name: name || 'Gestor',
            token: data.session?.access_token,
          };
          onLoginSuccess(userSession);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user && data.session) {
          const userSession: UserSession = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || 'Gestor',
            token: data.session.access_token,
          };
          onLoginSuccess(userSession);
        }
      }
    } catch (err: any) {
      console.warn('Auth error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMessage('E-mail ou senha incorretos.');
      } else {
        setErrorMessage(err.message || 'Erro ao autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Subtle tonal background decoration */}
      <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-[#f1edec] rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-[#dbe1ff]/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm bg-white border border-[#c4c7c7]/40 rounded-[24px] p-8 shadow-[0_4px_32px_rgba(0,0,0,0.04)] relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#000000] text-white mb-5">
            <span className="text-lg font-semibold tracking-tight">G</span>
          </div>
          <h1 className="text-xl font-semibold text-[#1c1b1b] tracking-tight">
            Gestão <span className="text-[#0050d7]">Pro</span>
          </h1>
          <p className="text-sm text-[#747878] mt-1.5 font-normal">
            Painel Financeiro &amp; Operacional Multi-Moeda
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-[#93000a] text-sm font-medium text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {isSignUp && (
            <div>
              <label className="block text-[11px] font-semibold text-[#747878] uppercase tracking-widest mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 focus:border-[#000000] focus:bg-white rounded-xl px-4 py-3 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#747878] uppercase tracking-widest mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#747878] absolute left-3.5 top-3.5" strokeWidth={1.5} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 focus:border-[#000000] focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#747878] uppercase tracking-widest mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#747878] absolute left-3.5 top-3.5" strokeWidth={1.5} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 focus:border-[#000000] focus:bg-white rounded-xl pl-10 pr-10 py-3 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-[#747878] hover:text-[#1c1b1b] cursor-pointer transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#000000] hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-[29px] transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                <span>Aguarde...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage('');
            }}
            className="text-sm text-[#747878] hover:text-[#0050d7] font-normal transition-colors cursor-pointer"
          >
            {isSignUp
              ? 'Já tem conta? Fazer login'
              : 'Não tem conta? Criar agora'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-[#c4c7c7]/40 flex items-center justify-center space-x-2 text-[11px] text-[#747878] font-normal">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1a6b3a]" />
          <span>Autenticação segura via Supabase</span>
        </div>
      </div>
    </div>
  );
}
