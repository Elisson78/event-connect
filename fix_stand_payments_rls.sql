-- Script para corrigir as políticas RLS da tabela stand_payments
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos remover as políticas existentes
DROP POLICY IF EXISTS "Users can view their own stand payments" ON stand_payments;
DROP POLICY IF EXISTS "Users can insert their own stand payments" ON stand_payments;
DROP POLICY IF EXISTS "Users can update their own stand payments" ON stand_payments;
DROP POLICY IF EXISTS "Organizers can view payments for their stands" ON stand_payments;
DROP POLICY IF EXISTS "Organizers can update payments for their stands" ON stand_payments;

-- Agora vamos criar políticas mais permissivas para debug
-- Política para permitir SELECT para todos os usuários autenticados
CREATE POLICY "Allow authenticated users to view stand payments" ON stand_payments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir INSERT para todos os usuários autenticados
CREATE POLICY "Allow authenticated users to insert stand payments" ON stand_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir UPDATE para todos os usuários autenticados
CREATE POLICY "Allow authenticated users to update stand payments" ON stand_payments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Verificar se a tabela existe e tem dados
SELECT 'Tabela stand_payments existe' as status, COUNT(*) as total_records FROM stand_payments;

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'stand_payments';

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'stand_payments'; 