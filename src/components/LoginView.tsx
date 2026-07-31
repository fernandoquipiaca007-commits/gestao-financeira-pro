import React, { useState } from 'react';
import { Sparkles, Lock, Mail, Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
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

        // Session active immediately (email confirmation disabled in Supabase)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center p-4 font-sans">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl relative z-10">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white mb-5 shadow-lg shadow-emerald-600/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Gestão <span className="text-emerald-600">Pro</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Painel Financeiro & Operacional Multi-Moeda
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {isSignUp && (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aguarde...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
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
            className="text-xs text-slate-500 hover:text-emerald-600 font-semibold transition-colors cursor-pointer"
          >
            {isSignUp
              ? 'Já tem conta? Fazer login'
              : 'Não tem conta? Criar agora'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Autenticação segura via Supabase</span>
        </div>
      </div>
    </div>
  );
}
