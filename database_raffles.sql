-- Tabela para armazenar os sorteios
CREATE TABLE IF NOT EXISTS raffles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    winners_count INTEGER NOT NULL,
    total_participants INTEGER NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os ganhadores dos sorteios
CREATE TABLE IF NOT EXISTS raffle_winners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_raffles_event_id ON raffles(event_id);
CREATE INDEX IF NOT EXISTS idx_raffles_organizer_id ON raffles(organizer_id);
CREATE INDEX IF NOT EXISTS idx_raffle_winners_raffle_id ON raffle_winners(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_winners_user_id ON raffle_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_raffle_winners_event_id ON raffle_winners(event_id);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_raffles_updated_at 
    BEFORE UPDATE ON raffles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para raffles
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;

-- Políticas para raffles
CREATE POLICY "Organizers can view their own raffles" ON raffles
    FOR SELECT USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can insert their own raffles" ON raffles
    FOR INSERT WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can update their own raffles" ON raffles
    FOR UPDATE USING (organizer_id = auth.uid());

-- RLS para raffle_winners
ALTER TABLE raffle_winners ENABLE ROW LEVEL SECURITY;

-- Políticas para raffle_winners
CREATE POLICY "Organizers can view winners of their raffles" ON raffle_winners
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM raffles 
            WHERE raffles.id = raffle_winners.raffle_id 
            AND raffles.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can insert winners for their raffles" ON raffle_winners
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM raffles 
            WHERE raffles.id = raffle_winners.raffle_id 
            AND raffles.organizer_id = auth.uid()
        )
    );

-- Função para gerar código único de inscrição
CREATE OR REPLACE FUNCTION generate_registration_code(
    event_type TEXT,
    event_date DATE,
    registration_number INTEGER
) RETURNS TEXT AS $$
BEGIN
    RETURN 'EVT-' || UPPER(event_type) || '-' || 
           TO_CHAR(event_date, 'YYYYMMDD') || '-' || 
           LPAD(registration_number::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Função para obter o próximo número de inscrição para um evento
CREATE OR REPLACE FUNCTION get_next_registration_number(event_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(registration_number), 0) + 1
    INTO next_number
    FROM registrations
    WHERE event_id = event_uuid;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código de inscrição automaticamente
CREATE OR REPLACE FUNCTION generate_registration_code_trigger()
RETURNS TRIGGER AS $$
DECLARE
    event_type TEXT;
    event_date DATE;
    reg_number INTEGER;
BEGIN
    -- Buscar informações do evento
    SELECT 
        CASE 
            WHEN e.category_id = 'corrida' THEN 'COR'
            WHEN e.category_id = 'palestra' THEN 'PAL'
            WHEN e.category_id = 'show' THEN 'SHO'
            ELSE 'EVT'
        END,
        e.start_date
    INTO event_type, event_date
    FROM events e
    WHERE e.id = NEW.event_id;
    
    -- Obter próximo número de inscrição
    reg_number := get_next_registration_number(NEW.event_id);
    
    -- Gerar e atribuir o código
    NEW.registration_code := generate_registration_code(event_type, event_date, reg_number);
    NEW.registration_number := reg_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar coluna registration_code se não existir
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS registration_code TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS registration_number INTEGER;

-- Criar trigger para gerar código automaticamente
DROP TRIGGER IF EXISTS trigger_generate_registration_code ON registrations;
CREATE TRIGGER trigger_generate_registration_code
    BEFORE INSERT ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION generate_registration_code_trigger(); 