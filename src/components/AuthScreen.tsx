import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Database, KeyRound, Eye, EyeOff, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { getSupabaseClient, getStoredSupabaseConfig, setLocalUser } from '../lib/supabase';

interface AuthScreenProps {
  onAuthSuccess: (user: { id: string; email: string }) => void;
  onOpenSqlModal: () => void;
  onOpenConfigModal: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  onOpenSqlModal,
  onOpenConfigModal,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { isConfigured, url } = getStoredSupabaseConfig();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    const client = getSupabaseClient();

    if (!client) {
      // Local fallback mode when Supabase credentials aren't set
      setTimeout(() => {
        setIsLoading(false);
        const demoUser = {
          id: `user-${Date.now()}`,
          email: email.trim().toLowerCase(),
        };
        setLocalUser(demoUser);
        onAuthSuccess(demoUser);
      }, 600);
      return;
    }

    try {
      if (mode === 'register') {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: name.trim() || undefined,
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          if (data.session) {
            onAuthSuccess({ id: data.user.id, email: data.user.email || email.trim() });
          } else {
            setSuccessMessage(
              'Conta criada com sucesso! Se a confirmação de e-mail estiver ativa no Supabase, verifique sua caixa de entrada.'
            );
            setIsLoading(false);
          }
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          setErrorMessage(
            error.message === 'Invalid login credentials'
              ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
              : error.message
          );
          setIsLoading(false);
          return;
        }

        if (data.user) {
          onAuthSuccess({ id: data.user.id, email: data.user.email || email.trim() });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = {
      id: 'demo-user-id',
      email: 'consultor@nexus-crm.com.br',
    };
    setLocalUser(demoUser);
    onAuthSuccess(demoUser);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo / Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Nexus CRM</h1>
          <p className="mt-1 text-xs text-slate-400">
            Gestão simplificada de contatos, pipeline de vendas e oportunidades
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 text-center rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 text-center rounded-lg transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Supabase status indicator */}
            <div className="mb-5 flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span className="text-slate-700 font-medium">
                  {isConfigured ? 'Supabase Conectado' : 'Modo Demonstração Instantânea'}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenConfigModal}
                className="text-emerald-700 hover:text-emerald-800 font-medium hover:underline text-[11px]"
              >
                {isConfigured ? 'Alterar' : 'Configurar'}
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Beatriz Lima"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Entrar no Sistema' : 'Criar Minha Conta'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400">ou</span>
              </div>
            </div>

            {/* Quick Demo Access Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors border border-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Acessar Demonstração com 1 Clique</span>
            </button>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <button
            type="button"
            onClick={onOpenSqlModal}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver Instrução SQL (Migration)</span>
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={onOpenConfigModal}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span>Configurar Supabase</span>
          </button>
        </div>
      </div>
    </div>
  );
};
