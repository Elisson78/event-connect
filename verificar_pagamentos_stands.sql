-- Script para verificar e corrigir status dos pagamentos de stands
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os pagamentos de stands
SELECT 
  sp.id as payment_id,
  sp.stand_id,
  sp.user_id,
  sp.event_id,
  sp.status as payment_status,
  sp.amount,
  sp.created_at as payment_created,
  es.name as stand_name,
  es.status as stand_status,
  e.title as event_title
FROM stand_payments sp
JOIN event_stands es ON sp.stand_id = es.id
JOIN events e ON sp.event_id = e.id
ORDER BY sp.created_at DESC;

-- 2. Verificar stands que têm pagamentos aprovados mas status incorreto
SELECT 
  es.id as stand_id,
  es.name as stand_name,
  es.status as stand_status,
  sp.id as payment_id,
  sp.status as payment_status,
  sp.created_at as payment_created,
  e.title as event_title
FROM event_stands es
JOIN stand_payments sp ON es.id = sp.stand_id
JOIN events e ON es.event_id = e.id
WHERE sp.status = 'pago' 
  AND es.status != 'vendido'
ORDER BY sp.created_at DESC;

-- 3. Corrigir status dos stands que têm pagamentos aprovados
UPDATE event_stands 
SET status = 'vendido'
WHERE id IN (
  SELECT DISTINCT es.id
  FROM event_stands es
  JOIN stand_payments sp ON es.id = sp.stand_id
  WHERE sp.status = 'pago' 
    AND es.status != 'vendido'
);

-- 4. Verificar resultado após correção
SELECT 
  es.id as stand_id,
  es.name as stand_name,
  es.status as stand_status,
  sp.id as payment_id,
  sp.status as payment_status,
  sp.created_at as payment_created,
  e.title as event_title
FROM event_stands es
JOIN stand_payments sp ON es.id = sp.stand_id
JOIN events e ON es.event_id = e.id
WHERE sp.status = 'pago'
ORDER BY sp.created_at DESC; 