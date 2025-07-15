-- 1. Primeiro, vamos ver todos os stands do evento para encontrar o UUID do stand 7
SELECT 
  id,
  name,
  status,
  event_id,
  created_at
FROM event_stands 
WHERE name LIKE '%stand 7%'
ORDER BY created_at DESC;

-- 2. Depois, vamos ver os pagamentos desse stand específico
-- (Substitua o UUID abaixo pelo resultado da query acima)
SELECT 
  sp.id as payment_id,
  sp.stand_id,
  sp.user_id,
  sp.status as payment_status,
  sp.amount,
  sp.created_at as payment_created,
  es.name as stand_name,
  es.event_id
FROM stand_payments sp
JOIN event_stands es ON sp.stand_id = es.id
WHERE es.name LIKE '%stand 7%'
ORDER BY sp.created_at DESC;

-- 3. Verificar todos os pagamentos de stands para entender melhor
SELECT 
  sp.id as payment_id,
  sp.stand_id,
  sp.status as payment_status,
  sp.amount,
  sp.created_at as payment_created,
  es.name as stand_name,
  es.status as stand_status
FROM stand_payments sp
JOIN event_stands es ON sp.stand_id = es.id
ORDER BY sp.created_at DESC
LIMIT 10; 