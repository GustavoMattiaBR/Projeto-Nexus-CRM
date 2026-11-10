import React, { useState, useMemo } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Award,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Filter,
  ArrowUpDown,
  Mail,
  Phone,
  Database,
  KeyRound,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Contact, ContactPriority, ContactStatus } from '../types/crm';
import { formatCurrencyBRL, formatDateBR, getPriorityConfig, getStatusConfig } from '../lib/formatters';

interface DashboardProps {
  user: { id: string; email: string };
  contacts: Contact[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (contact: Contact) => void;
  onOpenDeleteModal: (contact: Contact) => void;
  onOpenSqlModal: () => void;
  onOpenConfigModal: () => void;
  onOpenAIInsightModal: (contact: Contact) => void;
  onLogout: () => void;
  isSupabaseConnected: boolean;
  toastMessage?: string | null;
}

type SortField = 'created_at' | 'name' | 'estimated_value';
type SortDirection = 'asc' | 'desc';

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  contacts,
  isLoading,
  onRefresh,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenSqlModal,
  onOpenConfigModal,
  onOpenAIInsightModal,
  onLogout,
  isSupabaseConnected,
  toastMessage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('todas');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Top Metrics Calculation
  const metrics = useMemo(() => {
    const totalContacts = contacts.length;
    const totalPipelineValue = contacts.reduce((acc, c) => acc + (Number(c.estimated_value) || 0), 0);
    const activeLeadsCount = contacts.filter((c) => c.status === 'Novo Lead' || c.status === 'Em Negociação').length;
    const closedContacts = contacts.filter((c) => c.status === 'Fechado');
    const closedValue = closedContacts.reduce((acc, c) => acc + (Number(c.estimated_value) || 0), 0);
    const closedCount = closedContacts.length;

    return {
      totalContacts,
      totalPipelineValue,
      activeLeadsCount,
      closedValue,
      closedCount,
    };
  }, [contacts]);

  // Filtered and Sorted Contacts
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        const matchesSearch =
          contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contact.phone && contact.phone.includes(searchTerm));

        const matchesStatus = statusFilter === 'todos' || contact.status === statusFilter;
        const matchesPriority = priorityFilter === 'todas' || contact.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'created_at') {
          comp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortField === 'name') {
          comp = a.name.localeCompare(b.name);
        } else if (sortField === 'estimated_value') {
          comp = (Number(a.estimated_value) || 0) - (Number(b.estimated_value) || 0);
        }
        return sortDirection === 'asc' ? comp : -comp;
      });
  }, [contacts, searchTerm, statusFilter, priorityFilter, sortField, sortDirection]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredContacts.length === 0) return;

    const headers = ['ID', 'Nome', 'E-mail', 'Telefone', 'Status', 'Prioridade', 'Valor Estimado (R$)', 'Notas', 'Data de Criacao'];
    const rows = filteredContacts.map((c) => [
      `"${c.id}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.status}"`,
      `"${c.priority}"`,
      `"${c.estimated_value}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      `"${formatDateBR(c.created_at)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contatos_nexus_crm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-900 text-white text-xs font-medium rounded-lg shadow-lg animate-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Connection Badge */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight">Nexus CRM</span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Modo Demonstração'}</span>
                </div>
              </div>
            </div>

            {/* Actions & User menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onOpenSqlModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                title="Visualizar instruções e migration SQL do Supabase"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Instruções SQL</span>
              </button>

              <button
                type="button"
                onClick={onOpenConfigModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                title="Configurar URL e Chave do Supabase"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Supabase API</span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="hidden md:inline font-medium text-slate-800">{user.email}</span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Encerrar sessão"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* RESUMO NO TOPO (Summary Metric Cards as required) */}
        <section aria-label="Métricas Principais">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total de Contatos */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total de Contatos
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalContacts}</p>
                <p className="text-xs text-slate-500 mt-1">Registrados na base</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Total em Valor de Negócios (R$) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total em Valor de Negócios
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrencyBRL(metrics.totalPipelineValue)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Pipeline global estimado</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Leads Ativos */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Leads Ativos
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.activeLeadsCount}</p>
                <p className="text-xs text-slate-500 mt-1">Novo Lead & Em Negociação</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Negócios Fechados */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Negócios Fechados
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrencyBRL(metrics.closedValue)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{metrics.closedCount} clientes convertidos</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>
        </section>

        {/* CONTROLS BAR: Search, Filters, Add Button, Export */}
        <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="todos">Status: Todos</option>
                <option value="Novo Lead">Novo Lead</option>
                <option value="Em Negociação">Em Negociação</option>
                <option value="Fechado">Fechado</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="todas">Prioridade: Todas</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredContacts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
              title="Exportar contatos filtrados em formato CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Exportar</span>
            </button>

            {/* Novo Contato Button */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Contato</span>
            </button>
          </div>
        </section>

        {/* CONTACTS TABLE & RESPONSIVE LIST */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header info */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Lista de Contatos e Leads</h2>
              <p className="text-xs text-slate-500">
                Mostrando {filteredContacts.length} de {contacts.length} registros
              </p>
            </div>
            {filteredContacts.length > 0 && (
              <div className="text-xs text-slate-500">
                Pipeline filtrado:{' '}
                <strong className="text-slate-800">
                  {formatCurrencyBRL(
                    filteredContacts.reduce((sum, c) => sum + (Number(c.estimated_value) || 0), 0)
                  )}
                </strong>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th
                    className="py-3 px-6 cursor-pointer hover:text-slate-900 select-none transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Contato / Lead</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Comunicação</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none transition-colors"
                    onClick={() => toggleSort('estimated_value')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Valor Estimado</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none transition-colors hidden lg:table-cell"
                    onClick={() => toggleSort('created_at')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Criado em</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-medium text-slate-600 text-sm">Nenhum contato encontrado</p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {searchTerm || statusFilter !== 'todos' || priorityFilter !== 'todas'
                            ? 'Tente ajustar os filtros ou o termo de busca pesquisado.'
                            : 'Cadastre o primeiro contato da sua empresa clicando no botão acima.'}
                        </p>
                        {contacts.length === 0 && (
                          <button
                            type="button"
                            onClick={onOpenCreateModal}
                            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Cadastrar Primeiro Contato
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => {
                    const statusConfig = getStatusConfig(contact.status);
                    const priorityConfig = getPriorityConfig(contact.priority);

                    return (
                      <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Nome & Notas */}
                        <td className="py-3.5 px-6">
                          <div>
                            <div className="font-semibold text-slate-900">{contact.name}</div>
                            {contact.notes ? (
                              <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title={contact.notes}>
                                {contact.notes}
                              </p>
                            ) : (
                              <span className="text-[11px] text-slate-400">Sem observações</span>
                            )}
                          </div>
                        </td>

                        {/* Comunicação (Email & Fone) */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 hover:underline"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{contact.email}</span>
                            </a>
                            {contact.phone ? (
                              <a
                                href={`tel:${contact.phone.replace(/\D/g, '')}`}
                                className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 hover:underline"
                              >
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{contact.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Sem telefone</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${statusConfig.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                            {contact.status}
                          </span>
                        </td>

                        {/* Prioridade */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${priorityConfig.textClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dotClass}`} />
                            {contact.priority}
                          </span>
                        </td>

                        {/* Valor Estimado em R$ */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900">
                          {formatCurrencyBRL(contact.estimated_value)}
                        </td>

                        {/* Data */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px] hidden lg:table-cell">
                          {formatDateBR(contact.created_at)}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenAIInsightModal(contact)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 rounded-md transition-colors"
                              title="Análise com Agente de Inteligência Artificial Gemini 2.5 Flash"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sugerir Abordagem</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(contact)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-md transition-colors"
                              title="Editar contato"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenDeleteModal(contact)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Excluir contato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Ordenado por:{' '}
              <strong className="text-slate-700">
                {sortField === 'created_at'
                  ? 'Data de Criação'
                  : sortField === 'name'
                  ? 'Nome do Contato'
                  : 'Valor Estimado'}
              </strong>{' '}
              ({sortDirection === 'desc' ? 'Decrescente' : 'Crescente'})
            </span>
            <div className="flex items-center gap-3">
              <span>{filteredContacts.length} contato(s) listado(s)</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>Nexus CRM © {new Date().getFullYear()}</span>
            <span className="mx-2">·</span>
            <span>Integração Supabase & Next/React Architecture</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSqlModal}
              className="hover:text-emerald-700 transition-colors underline"
            >
              Migration SQL (Tabela & RLS)
            </button>
            <button
              onClick={onOpenConfigModal}
              className="hover:text-emerald-700 transition-colors underline"
            >
              Credenciais Supabase
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
