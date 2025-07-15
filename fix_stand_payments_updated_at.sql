-- Script para corrigir a coluna updated_at na tabela stand_payments
-- Execute este script no SQL Editor do Supabase

-- Adicionar a coluna updated_at se ela não existir
ALTER TABLE stand_payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stand_payments' 
AND column_name = 'updated_at';

-- Verificar se o trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'stand_payments';

-- Recriar o trigger se necessário
DROP TRIGGER IF EXISTS trigger_update_stand_payments_updated_at ON stand_payments;

CREATE TRIGGER trigger_update_stand_payments_updated_at
    BEFORE UPDATE ON stand_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_stand_payments_updated_at();

-- Verificar a estrutura completa da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stand_payments' 
ORDER BY ordinal_position; 