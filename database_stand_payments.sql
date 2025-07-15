-- Script para criar a tabela stand_payments
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS stand_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stand_id UUID REFERENCES event_stands(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'em_analise', 'pago', 'rejeitado')),
    payment_receipt_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_stand_payments_user_id ON stand_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stand_payments_stand_id ON stand_payments(stand_id);
CREATE INDEX IF NOT EXISTS idx_stand_payments_status ON stand_payments(status);
CREATE INDEX IF NOT EXISTS idx_stand_payments_created_at ON stand_payments(created_at);

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_stand_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_stand_payments_updated_at ON stand_payments;
CREATE TRIGGER trigger_update_stand_payments_updated_at
    BEFORE UPDATE ON stand_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_stand_payments_updated_at();

-- RLS (Row Level Security)
ALTER TABLE stand_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para stand_payments
CREATE POLICY "Users can view their own stand payments" ON stand_payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own stand payments" ON stand_payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stand payments" ON stand_payments
    FOR UPDATE USING (user_id = auth.uid());

-- Política para organizadores verem pagamentos dos seus stands
CREATE POLICY "Organizers can view payments for their stands" ON stand_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM event_stands es
            JOIN events e ON es.event_id = e.id
            WHERE es.id = stand_payments.stand_id
            AND e.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update payments for their stands" ON stand_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM event_stands es
            JOIN events e ON es.event_id = e.id
            WHERE es.id = stand_payments.stand_id
            AND e.organizer_id = auth.uid()
        )
    ); 