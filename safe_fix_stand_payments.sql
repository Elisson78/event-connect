-- Script SEGURO para corrigir a tabela stand_payments
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos verificar a estrutura atual da tabela
SELECT '=== ESTRUTURA ATUAL DA TABELA ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stand_payments' 
ORDER BY ordinal_position;

-- 2. Verificar se a função update_stand_payments_updated_at existe
SELECT '=== VERIFICANDO FUNÇÃO ===' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'update_stand_payments_updated_at';

-- 3. Se a função não existir, vamos criá-la
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_stand_payments_updated_at') THEN
        CREATE OR REPLACE FUNCTION update_stand_payments_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        RAISE NOTICE 'Função update_stand_payments_updated_at criada';
    ELSE
        RAISE NOTICE 'Função update_stand_payments_updated_at já existe';
    END IF;
END $$;

-- 4. Adicionar a coluna updated_at se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stand_payments' AND column_name = 'updated_at') THEN
        ALTER TABLE stand_payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe';
    END IF;
END $$;

-- 5. Verificar se o trigger existe e removê-lo se necessário
SELECT '=== VERIFICANDO TRIGGERS ===' as info;
SELECT trigger_name, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'stand_payments';

-- 6. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_update_stand_payments_updated_at ON stand_payments;

-- 7. Criar novo trigger
CREATE TRIGGER trigger_update_stand_payments_updated_at
    BEFORE UPDATE ON stand_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_stand_payments_updated_at();

-- 8. Verificar estrutura final
SELECT '=== ESTRUTURA FINAL ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stand_payments' 
ORDER BY ordinal_position;

-- 9. Testar se o trigger funciona
SELECT '=== TESTE DO TRIGGER ===' as info;
SELECT 'Trigger criado com sucesso!' as status; 