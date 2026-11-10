import { ContactPriority, ContactStatus } from '../types/crm';

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDateBR(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatPhoneBR(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    // (xx) xxxx-xxxx
    return digits
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14);
  }
  // (xx) xxxxx-xxxx
  return digits
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
}

export function getStatusConfig(status: ContactStatus) {
  switch (status) {
    case 'Novo Lead':
      return {
        label: 'Novo Lead',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'Em Negociação':
      return {
        label: 'Em Negociação',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'Fechado':
      return {
        label: 'Fechado',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function getPriorityConfig(priority: ContactPriority) {
  switch (priority) {
    case 'Alta':
      return {
        label: 'Alta',
        textClass: 'text-rose-700 bg-rose-50 border-rose-200',
        dotClass: 'bg-rose-500',
      };
    case 'Média':
      return {
        label: 'Média',
        textClass: 'text-amber-700 bg-amber-50 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case 'Baixa':
      return {
        label: 'Baixa',
        textClass: 'text-slate-600 bg-slate-50 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
}
