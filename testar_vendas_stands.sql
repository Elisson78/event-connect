-- Testar a consulta exata do painel financeiro de vendas de stands
-- Execute este script no Supabase SQL Editor

-- 1. Verificar eventos do organizador
SELECT 
  id,
  name,
  organizer_id
FROM events 
WHERE organizer_id = '59cd93d6-07c3-44e6-8a2b-044f485d40ea';

-- 2. Testar a consulta exata do painel financeiro
SELECT
  sp.id,
  sp.amount,
  sp.status,
  sp.created_at,
  es.name as stand_name,
  es.price as stand_price,
  es.event_id,
  e.name as event_name,
  u.name as user_name,
  u.email as user_email
FROM stand_payments sp
INNER JOIN event_stands es ON sp.stand_id = es.id
INNER JOIN events e ON es.event_id = e.id
LEFT JOIN users u ON sp.user_id = u.id
WHERE sp.status = 'pago'
  AND es.event_id IN (
    SELECT id FROM events 
    WHERE organizer_id = '59cd93d6-07c3-44e6-8a2b-044f485d40ea'
  )
ORDER BY e.name, es.name;

-- 3. Verificar todos os pagamentos pagos sem filtro de organizador
SELECT
  sp.id,
  sp.amount,
  sp.status,
  sp.created_at,
  es.name as stand_name,
  es.event_id,
  e.name as event_name,
  e.organizer_id
FROM stand_payments sp
INNER JOIN event_stands es ON sp.stand_id = es.id
INNER JOIN events e ON es.event_id = e.id
WHERE sp.status = 'pago'
ORDER BY e.name, es.name; 