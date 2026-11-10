export type ContactStatus = 'Novo Lead' | 'Em Negociação' | 'Fechado';

export type ContactPriority = 'Baixa' | 'Média' | 'Alta';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  status: ContactStatus;
  priority: ContactPriority;
  estimated_value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  status: ContactStatus;
  priority: ContactPriority;
  estimated_value: number | string;
  notes?: string;
}

export interface CRMStats {
  totalContacts: number;
  totalPipelineValue: number;
  activeLeadsCount: number;
  closedValue: number;
  closedCount: number;
}
