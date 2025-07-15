-- Verificar status do stand 6 e seu pagamento
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o stand 6
SELECT 
  es.id,
  es.name,
  es.status as stand_status,
  es.price,
  e.name as event_name,
  e.organizer_id
FROM event_stands es
INNER JOIN events e ON es.event_id = e.id
WHERE es.name = 'stand 6';

-- 2. Verificar pagamentos do stand 6
SELECT 
  sp.id,
  sp.stand_id,
  sp.user_id,
  sp.amount,
  sp.status as payment_status,
  sp.payment_receipt_url,
  sp.created_at,
  es.name as stand_name,
  u.email as user_email
FROM stand_payments sp
INNER JOIN event_stands es ON sp.stand_id = es.id
LEFT JOIN users u ON sp.user_id = u.id
WHERE es.name = 'stand 6'
ORDER BY sp.created_at DESC;

-- 3. Verificar se há pagamentos aprovados para stands vendidos
SELECT 
  sp.id,
  sp.status as payment_status,
  es.name as stand_name,
  es.status as stand_status,
  e.name as event_name,
  e.organizer_id
FROM stand_payments sp
INNER JOIN event_stands es ON sp.stand_id = es.id
INNER JOIN events e ON es.event_id = e.id
WHERE sp.status = 'pago'
  AND e.organizer_id = '59cd93d6-07c3-44e6-8a2b-044f485d40ea'; 