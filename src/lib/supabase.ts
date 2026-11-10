import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Contact, ContactFormData } from '../types/crm';

const SUPABASE_URL_KEY = 'nexus_crm_supabase_url';
const SUPABASE_ANON_KEY = 'nexus_crm_supabase_anon_key';
const LOCAL_CONTACTS_KEY = 'nexus_crm_local_contacts';
const LOCAL_USER_KEY = 'nexus_crm_local_user';

export function getStoredSupabaseConfig() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  const localUrl = localStorage.getItem(SUPABASE_URL_KEY)?.trim();
  const localKey = localStorage.getItem(SUPABASE_ANON_KEY)?.trim();

  const url = localUrl || envUrl || '';
  const key = localKey || envKey || '';

  const isConfigured = Boolean(url && key && url.startsWith('http') && !url.includes('YOUR_SUPABASE'));
  return { url, key, isConfigured };
}

export function saveStoredSupabaseConfig(url: string, key: string) {
  if (url && key) {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_ANON_KEY, key.trim());
  } else {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_ANON_KEY);
  }
}

// Initial client instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getStoredSupabaseConfig();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Falha ao inicializar cliente Supabase:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

// Initial seed data for demo / offline preview
const DEFAULT_INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c1-demo-uuid',
    user_id: 'demo-user-id',
    name: 'Ana Carolina Silva',
    email: 'ana.silva@techsolutions.com.br',
    phone: '(11) 98765-4321',
    status: 'Em Negociação',
    priority: 'Alta',
    estimated_value: 38500.0,
    notes: 'Apresentação da proposta de software de gestão corporativa concluída. Aguardando validação com a diretoria.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'c2-demo-uuid',
    user_id: 'demo-user-id',
    name: 'Rodrigo Mendonça',
    email: 'rodrigo.mendonca@logtransportes.com.br',
    phone: '(21) 99123-8899',
    status: 'Novo Lead',
    priority: 'Média',
    estimated_value: 12000.0,
    notes: 'Interesse em integração de rastreamento de frotas e automação de alertas via webhook.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'c3-demo-uuid',
    user_id: 'demo-user-id',
    name: 'Camila Albuquerque',
    email: 'camila.albuquerque@clinicaestetica.com.br',
    phone: '(31) 97334-1122',
    status: 'Fechado',
    priority: 'Alta',
    estimated_value: 54000.0,
    notes: 'Contrato anual assinado! Implantação e treinamento agendados para a próxima semana.',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'c4-demo-uuid',
    user_id: 'demo-user-id',
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@agenciadigital.com.br',
    phone: '(41) 98455-6677',
    status: 'Novo Lead',
    priority: 'Baixa',
    estimated_value: 7500.0,
    notes: 'Solicitou orçamento de consultoria para reestruturação de funil de vendas.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'c5-demo-uuid',
    user_id: 'demo-user-id',
    name: 'Mariana Duarte',
    email: 'mariana.duarte@inovafoods.com.br',
    phone: '(51) 99888-2233',
    status: 'Em Negociação',
    priority: 'Alta',
    estimated_value: 92000.0,
    notes: 'Revisão das cláusulas jurídicas e do SLA do contrato corporativo.',
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Local store helpers
function getLocalContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(LOCAL_CONTACTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(DEFAULT_INITIAL_CONTACTS));
      return DEFAULT_INITIAL_CONTACTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_INITIAL_CONTACTS;
  }
}

function saveLocalContacts(contacts: Contact[]) {
  localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(contacts));
}

export function getLocalUser(): { id: string; email: string } | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalUser(user: { id: string; email: string } | null) {
  if (user) {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
}

// Contacts Service API abstraction
export const crmService = {
  async fetchContacts(userId: string): Promise<{ data: Contact[]; error: string | null }> {
    const client = getSupabaseClient();
    if (!client) {
      // Local fallback mode
      const all = getLocalContacts();
      return { data: all, error: null };
    }

    try {
      const { data, error } = await client
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      return {
        data: (data || []).map((c: any) => ({
          ...c,
          estimated_value: Number(c.estimated_value) || 0,
        })),
        error: null,
      };
    } catch (err: any) {
      return { data: [], error: err.message || 'Erro inesperado ao buscar contatos no Supabase' };
    }
  },

  async createContact(userId: string, form: ContactFormData): Promise<{ data: Contact | null; error: string | null }> {
    const client = getSupabaseClient();
    const numericValue = typeof form.estimated_value === 'string'
      ? parseFloat(form.estimated_value.replace(/[^0-9.-]+/g, '')) || 0
      : Number(form.estimated_value) || 0;

    if (!client) {
      const contacts = getLocalContacts();
      const newContact: Contact = {
        id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
        priority: form.priority,
        estimated_value: numericValue,
        notes: form.notes?.trim() || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalContacts([newContact, ...contacts]);
      return { data: newContact, error: null };
    }

    try {
      const { data, error } = await client
        .from('contacts')
        .insert({
          user_id: userId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          status: form.status,
          priority: form.priority,
          estimated_value: numericValue,
          notes: form.notes?.trim() || null,
        })
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return {
        data: {
          ...data,
          estimated_value: Number(data.estimated_value) || 0,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao criar contato no Supabase' };
    }
  },

  async updateContact(contactId: string, form: ContactFormData): Promise<{ data: Contact | null; error: string | null }> {
    const client = getSupabaseClient();
    const numericValue = typeof form.estimated_value === 'string'
      ? parseFloat(form.estimated_value.replace(/[^0-9.-]+/g, '')) || 0
      : Number(form.estimated_value) || 0;

    if (!client) {
      const contacts = getLocalContacts();
      const index = contacts.findIndex((c) => c.id === contactId);
      if (index === -1) return { data: null, error: 'Contato não encontrado' };
      const updated: Contact = {
        ...contacts[index],
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
        priority: form.priority,
        estimated_value: numericValue,
        notes: form.notes?.trim() || '',
        updated_at: new Date().toISOString(),
      };
      contacts[index] = updated;
      saveLocalContacts([...contacts]);
      return { data: updated, error: null };
    }

    try {
      const { data, error } = await client
        .from('contacts')
        .update({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          status: form.status,
          priority: form.priority,
          estimated_value: numericValue,
          notes: form.notes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return {
        data: {
          ...data,
          estimated_value: Number(data.estimated_value) || 0,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao atualizar contato' };
    }
  },

  async deleteContact(contactId: string): Promise<{ success: boolean; error: string | null }> {
    const client = getSupabaseClient();
    if (!client) {
      const contacts = getLocalContacts().filter((c) => c.id !== contactId);
      saveLocalContacts(contacts);
      return { success: true, error: null };
    }

    try {
      const { error } = await client.from('contacts').delete().eq('id', contactId);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir contato' };
    }
  },
};
