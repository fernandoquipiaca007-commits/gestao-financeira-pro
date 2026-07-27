import React, { useState } from 'react';
import { Sparkles, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [showDemoSuggestion, setShowDemoSuggestion] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setShowDemoSuggestion(false);
    setLoading(true);

    try {
      if (isSignUp) {
        // First try to register user via Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name || 'Gestor' },
          },
        });

        if (error) {
          // If email rate limit is exceeded or user already registered, try signing in directly
          if (
            error.message.includes('rate limit') ||
            error.message.includes('already registered') ||
            error.status === 429
          ) {
            console.warn('Signup rate limited or existing user, attempting direct sign in...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (!signInError && signInData.user) {
              const userSession: UserSession = {
                id: signInData.user.id,
                email: signInData.user.email || email,
                name: signInData.user.user_metadata?.name || name || 'Gestor',
                token: signInData.session?.access_token,
              };
              onLoginSuccess(userSession);
              return;
            }
          }
          throw error;
        }

        if (data.user) {
          const userSession: UserSession = {
            id: data.user.id,
            email: data.user.email || email,
            name: name || 'Gestor',
            token: data.session?.access_token,
          };
          onLoginSuccess(userSession);
        } else {
          setErrorMessage('Cadastro realizado! Você já pode acessar o sistema.');
        }
      } else {
        // Sign in via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          const userSession: UserSession = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || 'Gestor',
            token: data.session?.access_token,
          };
          onLoginSuccess(userSession);
        }
      }
    } catch (err: any) {
      console.warn('Authentication error:', err);

      if (err.message && err.message.includes('rate limit')) {
        setErrorMessage(
          'O limite de disparo de e-mails do Supabase foi atingido para novos cadastros neste momento.'
        );
        setShowDemoSuggestion(true);
      } else if (err.message && err.message.includes('Invalid login credentials')) {
        setErrorMessage('E-mail ou senha incorretos. Por favor, verifique suas credenciais.');
      } else {
        setErrorMessage(err.message || 'Falha na autenticação. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo Admin Login for instant access
  const handleDemoLogin = () => {
    const demoSession: UserSession = {
      id: 'demo-admin-id',
      email: email || 'fernandoquipiaca007@gmail.com',
      name: name || 'Fernando Quipiaca',
      role: 'administrator',
      token: 'demo-jwt-token-access-granted',
    };
    localStorage.setItem('gfo_demo_session', JSON.stringify(demoSession));
    onLoginSuccess(demoSession);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gestão Digital <span className="text-emerald-400">Pro</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Painel de Controle Financeiro, Projetos & Agenda Multi-Moeda
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-medium space-y-2">
            <div className="flex items-center space-x-2 font-bold text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Aviso de Autenticação</span>
            </div>
            <p>{errorMessage}</p>

            {showDemoSuggestion && (
              <div className="pt-2 border-t border-rose-500/20">
                <p className="text-[11px] text-slate-300 mb-2">
                  Você pode entrar imediatamente clicando abaixo sem precisar esperar a verificação de e-mail:
                </p>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Entrar Agora com E-mail {email ? `(${email})` : ''}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Fernando Quipiaca"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Senha de Segurança
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Processando...' : isSignUp ? 'Criar Conta Segura' : 'Entrar no Sistema'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div className="mt-5 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setShowDemoSuggestion(false); }}
            className="text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors cursor-pointer"
          >
            {isSignUp ? 'Já possui uma conta? Faça login aqui' : 'Não tem conta? Cadastre-se com segurança'}
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-slate-800"></div>
          <span className="px-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">ou</span>
          <div className="flex-1 border-t border-slate-800"></div>
        </div>

        {/* Demo Fast Login */}
        <button
          onClick={handleDemoLogin}
          className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acessar Modo Demonstrativo Instantâneo</span>
        </button>

        {/* Footer info */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-[11px] text-slate-500 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Conexão Criptografada SSL / Supabase Auth</span>
        </div>

      </div>
    </div>
  );
}
