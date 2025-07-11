-- Tabela para armazenar as taxas da plataforma
CREATE TABLE IF NOT EXISTS platform_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_platform_fees_event_id ON platform_fees(event_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_organizer_id ON platform_fees(organizer_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_user_id ON platform_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_status ON platform_fees(status);
CREATE INDEX IF NOT EXISTS idx_platform_fees_created_at ON platform_fees(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_platform_fees_updated_at 
    BEFORE UPDATE ON platform_fees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para platform_fees
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;

-- Políticas para platform_fees
CREATE POLICY "Organizers can view their own fees" ON platform_fees
    FOR SELECT USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can insert fees for their events" ON platform_fees
    FOR INSERT WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can update their own fees" ON platform_fees
    FOR UPDATE USING (organizer_id = auth.uid());

CREATE POLICY "Users can view their own fees" ON platform_fees
    FOR SELECT USING (user_id = auth.uid());

-- Função RPC para buscar taxas do organizador
CREATE OR REPLACE FUNCTION get_organizer_fees(organizer_uuid UUID)
RETURNS TABLE (
    id UUID,
    fee_amount DECIMAL(10,2),
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    event JSONB,
    user JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.id,
        pf.fee_amount,
        pf.status,
        pf.created_at,
        jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'price', e.price,
            'start_date', e.start_date
        ) as event,
        jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email
        ) as user
    FROM platform_fees pf
    LEFT JOIN events e ON pf.event_id = e.id
    LEFT JOIN users u ON pf.user_id = u.id
    WHERE pf.organizer_id = organizer_uuid
    ORDER BY pf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular taxa baseada no plano
CREATE OR REPLACE FUNCTION calculate_platform_fee(
    event_price DECIMAL(10,2),
    fee_percent DECIMAL(5,2),
    fee_fixed DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN COALESCE(event_price * (fee_percent / 100), 0) + COALESCE(fee_fixed, 0);
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE platform_fees IS 'Tabela para armazenar taxas da plataforma cobradas dos organizadores';
COMMENT ON COLUMN platform_fees.fee_amount IS 'Valor da taxa calculada (percentual + fixa)';
COMMENT ON COLUMN platform_fees.status IS 'Status da taxa: pending, paid, failed, cancelled';
COMMENT ON FUNCTION get_organizer_fees(UUID) IS 'Função para buscar taxas de um organizador específico';
COMMENT ON FUNCTION calculate_platform_fee(DECIMAL, DECIMAL, DECIMAL) IS 'Função para calcular taxa baseada no preço do evento e configurações do plano'; 