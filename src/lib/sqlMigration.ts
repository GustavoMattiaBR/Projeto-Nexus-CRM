export const SUPABASE_SQL_MIGRATION = `-- ================================================================
-- NEXUS CRM - MIGRATION DE BANCO DE DADOS SUPABASE
-- Tabela: contacts | Políticas de RLS (Row Level Security)
-- ================================================================

-- 1. Criação da tabela contacts
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Novo Lead' 
        CHECK (status IN ('Novo Lead', 'Em Negociação', 'Fechado')),
    priority TEXT NOT NULL DEFAULT 'Média' 
        CHECK (priority IN ('Baixa', 'Média', 'Alta')),
    estimated_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices para performance e consultas frequentes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_priority ON public.contacts(priority);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at DESC);

-- 3. Habilitação de Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 4. Remoção de políticas legadas caso existam
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios contatos" ON public.contacts;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios contatos" ON public.contacts;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios contatos" ON public.contacts;
DROP POLICY IF EXISTS "Usuários podem excluir seus próprios contatos" ON public.contacts;

-- 5. Criação das Políticas de Segurança (RLS) isoladas por usuário (auth.uid())
-- SELECT: Apenas o dono do registro pode ler
CREATE POLICY "Usuários podem visualizar seus próprios contatos"
    ON public.contacts
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Usuário autenticado só pode inserir registros vinculados ao seu próprio id
CREATE POLICY "Usuários podem criar seus próprios contatos"
    ON public.contacts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuário autenticado só pode editar seus próprios registros
CREATE POLICY "Usuários podem atualizar seus próprios contatos"
    ON public.contacts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuário autenticado só pode remover seus próprios registros
CREATE POLICY "Usuários podem excluir seus próprios contatos"
    ON public.contacts
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Trigger automática para manter updated_at atualizado
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contacts_updated_at ON public.contacts;

CREATE TRIGGER trigger_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comentários de documentação na tabela e colunas
COMMENT ON TABLE public.contacts IS 'Armazena contatos e oportunidades comerciais do CRM associados aos usuários do Supabase Auth';
COMMENT ON COLUMN public.contacts.estimated_value IS 'Valor estimado do negócio ou contrato em Reais (BRL)';
`;
