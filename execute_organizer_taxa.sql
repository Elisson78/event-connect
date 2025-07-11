-- Script para executar no Supabase SQL Editor
-- Copie e cole este conteúdo no SQL Editor do Supabase

-- Script para criar a tabela organizer_taxa
-- Esta tabela será usada para registrar as taxas cobradas dos organizadores
-- após a aprovação de inscrições em eventos pagos

CREATE TABLE IF NOT EXISTS organizer_taxa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Índices para melhor performance
    CONSTRAINT unique_organizer_taxa_registration UNIQUE (event_id, organizer_id, registration_id, user_id)
);

-- Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_organizer_taxa_event_id ON organizer_taxa(event_id);
CREATE INDEX IF NOT EXISTS idx_organizer_taxa_organizer_id ON organizer_taxa(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_taxa_registration_id ON organizer_taxa(registration_id);
CREATE INDEX IF NOT EXISTS idx_organizer_taxa_user_id ON organizer_taxa(user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_taxa_status ON organizer_taxa(status);
CREATE INDEX IF NOT EXISTS idx_organizer_taxa_created_at ON organizer_taxa(created_at);

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_organizer_taxa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_organizer_taxa_updated_at ON organizer_taxa;
CREATE TRIGGER trigger_update_organizer_taxa_updated_at
    BEFORE UPDATE ON organizer_taxa
    FOR EACH ROW
    EXECUTE FUNCTION update_organizer_taxa_updated_at();

-- Função para extrato de taxas de serviço do organizador
create or replace function get_organizer_service_fees(p_organizer_id uuid)
returns table (
  event_name text,
  participant_name text,
  participant_email text,
  fee_amount numeric,
  status text,
  created_at timestamp
)
language sql
as $$
  select
    e.name as event_name,
    u.name as participant_name,
    u.email as participant_email,
    ot.fee_amount,
    ot.status,
    ot.created_at
  from organizer_taxa ot
  join events e on ot.event_id = e.id
  join users u on ot.user_id = u.id
  where ot.organizer_id = p_organizer_id
  order by ot.created_at desc
$$;

-- Comentários na tabela
COMMENT ON TABLE organizer_taxa IS 'Tabela para registrar taxas cobradas dos organizadores por inscrições aprovadas';
COMMENT ON COLUMN organizer_taxa.event_id IS 'ID do evento relacionado';
COMMENT ON COLUMN organizer_taxa.organizer_id IS 'ID do organizador que deve pagar a taxa';
COMMENT ON COLUMN organizer_taxa.registration_id IS 'ID da inscrição que gerou a taxa';
COMMENT ON COLUMN organizer_taxa.user_id IS 'ID do participante que se inscreveu';
COMMENT ON COLUMN organizer_taxa.fee_amount IS 'Valor da taxa calculada automaticamente por faixa de preço';
COMMENT ON COLUMN organizer_taxa.status IS 'Status do pagamento da taxa: pending, paid, cancelled';
COMMENT ON COLUMN organizer_taxa.description IS 'Descrição da taxa (ex: faixa de preço do evento)';
COMMENT ON COLUMN organizer_taxa.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN organizer_taxa.updated_at IS 'Data da última atualização';
COMMENT ON COLUMN organizer_taxa.paid_at IS 'Data do pagamento da taxa';

-- Verificar se a tabela foi criada com sucesso
SELECT 'Tabela organizer_taxa criada com sucesso!' as status; 