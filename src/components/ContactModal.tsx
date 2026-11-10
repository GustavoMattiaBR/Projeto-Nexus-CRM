import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Tag, TrendingUp, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Contact, ContactFormData, ContactPriority, ContactStatus } from '../types/crm';
import { formatPhoneBR } from '../lib/formatters';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContactFormData) => Promise<boolean>;
  contactToEdit?: Contact | null;
}

const STATUS_OPTIONS: ContactStatus[] = ['Novo Lead', 'Em Negociação', 'Fechado'];
const PRIORITY_OPTIONS: ContactPriority[] = ['Baixa', 'Média', 'Alta'];

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contactToEdit,
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    status: 'Novo Lead',
    priority: 'Média',
    estimated_value: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (contactToEdit) {
      setFormData({
        name: contactToEdit.name || '',
        email: contactToEdit.email || '',
        phone: contactToEdit.phone || '',
        status: contactToEdit.status || 'Novo Lead',
        priority: contactToEdit.priority || 'Média',
        estimated_value: contactToEdit.estimated_value ?? 0,
        notes: contactToEdit.notes || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        status: 'Novo Lead',
        priority: 'Média',
        estimated_value: '',
        notes: '',
      });
    }
    setErrors({});
    setGeneralError('');
  }, [contactToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'O nome do contato é obrigatório.';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'O nome deve ter no mínimo 3 caracteres.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Insira um endereço de e-mail válido.';
    }

    if (formData.phone.trim()) {
      const cleanDigits = formData.phone.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        newErrors.phone = 'Informe o DDD + número (mínimo 10 dígitos).';
      }
    }

    if (formData.estimated_value !== '' && formData.estimated_value !== null && formData.estimated_value !== undefined) {
      const num = Number(formData.estimated_value);
      if (isNaN(num) || num < 0) {
        newErrors.estimated_value = 'O valor estimado deve ser um número maior ou igual a zero.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneBR(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const success = await onSave({
        ...formData,
        estimated_value: formData.estimated_value === '' ? 0 : Number(formData.estimated_value),
      });

      if (success) {
        onClose();
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Ocorreu um erro ao salvar o contato.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {contactToEdit ? 'Editar Contato' : 'Novo Contato'}
            </h2>
            <p className="text-xs text-slate-500">
              {contactToEdit
                ? 'Atualize os dados e a negociação do lead'
                : 'Cadastre um novo lead ou cliente no funil de vendas'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          {generalError && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="Ex: Gabriel Silveira"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-300 focus:ring-rose-200 text-rose-900 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          {/* Grid Email e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                E-mail <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, email: e.target.value }));
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="gabriel@empresa.com"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-rose-300 focus:ring-rose-200 text-rose-900 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? 'border-rose-300 focus:ring-rose-200 text-rose-900 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
            </div>
          </div>

          {/* Grid Status e Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status no Funil
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </div>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as ContactStatus }))}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Prioridade
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as ContactPriority }))}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {PRIORITY_OPTIONS.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Valor Estimado em R$ */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Valor Estimado de Negócio (R$)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-medium text-xs text-slate-500">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.estimated_value}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, estimated_value: e.target.value }));
                  if (errors.estimated_value) setErrors((prev) => ({ ...prev, estimated_value: '' }));
                }}
                placeholder="0,00"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.estimated_value
                    ? 'border-rose-300 focus:ring-rose-200 text-rose-900'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.estimated_value && (
              <p className="mt-1 text-xs text-rose-600">{errors.estimated_value}</p>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              Valor potencial da oportunidade em Reais (BRL).
            </p>
          </div>

          {/* Notas / Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observações & Próximos Passos (opcional)
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Agendada reunião de demonstração para quinta-feira às 14h..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {contactToEdit ? 'Salvar Alterações' : 'Cadastrar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
