import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  MessageSquare,
  Mail,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Send,
  Zap,
} from 'lucide-react';
import { Contact, AIContactInsight } from '../types/crm';
import { formatCurrencyBRL } from '../lib/formatters';

interface AIInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
}

export const AIInsightModal: React.FC<AIInsightModalProps> = ({ isOpen, onClose, contact }) => {
  const [insight, setInsight] = useState<AIContactInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [copiedType, setCopiedType] = useState<'whatsapp' | 'email' | 'subject' | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const fetchInsight = async (customInstruction?: string) => {
    if (!contact) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai/contact-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact,
          customInstruction,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao consultar Agente Gemini');
      }

      setInsight(data.insight);
    } catch (err: any) {
      console.error('Erro ao buscar insight:', err);
      setErrorMessage(
        err.message || 'Não foi possível gerar a análise. Verifique sua conexão e a chave de API.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && contact) {
      setInsight(null);
      setCustomPrompt('');
      fetchInsight();
    }
  }, [isOpen, contact]);

  if (!isOpen || !contact) return null;

  const handleCopy = async (text: string, type: 'whatsapp' | 'email' | 'subject') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('55')) return digits;
    return `55${digits}`;
  };

  const handleOpenWhatsApp = () => {
    if (!insight?.whatsapp_message) return;
    const phone = contact.phone ? cleanPhoneForWhatsApp(contact.phone) : '';
    const encoded = encodeURIComponent(insight.whatsapp_message);
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleOpenEmail = () => {
    if (!insight) return;
    const subject = encodeURIComponent(insight.email_subject);
    const body = encodeURIComponent(insight.email_body);
    const mailto = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  };

  const handleRegenerateWithInstruction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    fetchInsight(customPrompt.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Agente IA de Vendas</h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  gemini-2.5-flash
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Análise de Perfil &amp; Sugestão de Abordagem para{' '}
                <strong className="text-white">{contact.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Snapshot bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <div>
              <span className="text-slate-400">Status: </span>
              <strong className="text-slate-800">{contact.status}</strong>
            </div>
            <span className="text-slate-300">·</span>
            <div>
              <span className="text-slate-400">Prioridade: </span>
              <strong className="text-slate-800">{contact.priority}</strong>
            </div>
            <span className="text-slate-300">·</span>
            <div>
              <span className="text-slate-400">Valor Estimado: </span>
              <strong className="text-emerald-700 font-semibold">
                {formatCurrencyBRL(contact.estimated_value)}
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchInsight(customPrompt.trim() || undefined)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Recarregar Análise</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-3 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                <Sparkles className="w-5 h-5 text-emerald-600 absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Agente Gemini 2.5 Flash analisando oportunidade...
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Avaliando estágio do funil, valor do negócio e histórico para sintetizar abordagem de alta conversão.
                </p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-medium text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Não foi possível carregar o insight de IA</span>
              </div>
              <p className="text-xs text-rose-700">{errorMessage}</p>
              <button
                onClick={() => fetchInsight()}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tentar Novamente
              </button>
            </div>
          ) : insight ? (
            <>
              {/* Card 1: Probabilidade & Análise de Perfil */}
              <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      Probabilidade de Fechamento:
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        insight.probability_level === 'Alta'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : insight.probability_level === 'Média'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {insight.closing_probability}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed">
                  <p className="font-semibold text-slate-900 mb-1">Diagnóstico do Perfil:</p>
                  <p>{insight.profile_analysis}</p>
                </div>

                {insight.key_recommendations && insight.key_recommendations.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      Ações Recomendadas para o Vendedor:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {insight.key_recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Card 2: Modelos de Mensagem Prontos */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                  <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setActiveTab('whatsapp')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                        activeTab === 'whatsapp'
                          ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Modelo WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('email')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                        activeTab === 'email'
                          ? 'bg-white text-blue-800 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Modelo E-mail</span>
                    </button>
                  </div>

                  {activeTab === 'whatsapp' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(insight.whatsapp_message, 'whatsapp')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        {copiedType === 'whatsapp' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenWhatsApp}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Abrir WhatsApp</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(insight.email_body, 'email')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        {copiedType === 'email' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copiar Corpo</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenEmail}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Abrir no E-mail</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                  {activeTab === 'whatsapp' ? (
                    <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-4 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                      {insight.whatsapp_message}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-semibold text-slate-700">Assunto Sugerido:</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(insight.email_subject, 'subject')}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {copiedType === 'subject' ? 'Copiado!' : 'Copiar Assunto'}
                          </button>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={insight.email_subject}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium select-all"
                        />
                      </div>

                      <div>
                        <span className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Corpo do E-mail:
                        </span>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                          {insight.email_body}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Refinement input */}
              <form onSubmit={handleRegenerateWithInstruction} className="pt-2">
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Personalizar / Ajustar Abordagem com a IA:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ex: 'Tom mais urgente', 'Focar em desconto de 15%', 'Convidar para café/almoço'..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !customPrompt.trim()}
                    className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  >
                    Refinar
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Alimentado por Google Gemini 2.5 Flash</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
