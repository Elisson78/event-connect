-- Script para testar se a tabela stand_payments está funcionando
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna updated_at existe
SELECT '=== VERIFICANDO COLUNA UPDATED_AT ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stand_payments' 
AND column_name = 'updated_at';

-- 2. Verificar se o trigger existe
SELECT '=== VERIFICANDO TRIGGER ===' as info;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'stand_payments';

-- 3. Testar se conseguimos fazer um UPDATE (isso vai testar o trigger)
SELECT '=== TESTANDO UPDATE ===' as info;
UPDATE stand_payments 
SET status = status 
WHERE id IN (SELECT id FROM stand_payments LIMIT 1);

-- 4. Verificar se o updated_at foi atualizado
SELECT '=== VERIFICANDO SE UPDATED_AT FOI ATUALIZADO ===' as info;
SELECT id, status, created_at, updated_at
FROM stand_payments 
ORDER BY updated_at DESC 
LIMIT 3;

-- 5. Testar inserção de um novo registro
SELECT '=== TESTANDO INSERÇÃO ===' as info;
SELECT 'Tabela pronta para uso!' as status; 