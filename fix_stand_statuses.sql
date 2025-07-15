-- Script para corrigir os status dos stands que já foram pagos
-- mas ainda aparecem como "reservado" na tabela event_stands

-- 1. Primeiro, vamos ver quais stands têm pagamentos aprovados mas status incorreto
SELECT 
  es.id as stand_id,
  es.name as stand_name,
  es.status as current_status,
  sp.id as payment_id,
  sp.status as payment_status,
  sp.amount,
  e.name as event_name
FROM event_stands es
INNER JOIN stand_payments sp ON es.id = sp.stand_id
INNER JOIN events e ON es.event_id = e.id
WHERE sp.status = 'pago' 
  AND es.status != 'vendido'
ORDER BY e.name, es.name;

-- 2. Atualizar os status dos stands que têm pagamentos aprovados
UPDATE event_stands 
SET 
  status = 'vendido',
  updated_at = NOW()
WHERE id IN (
  SELECT es.id
  FROM event_stands es
  INNER JOIN stand_payments sp ON es.id = sp.stand_id
  WHERE sp.status = 'pago' 
    AND es.status != 'vendido'
);

-- 3. Verificar o resultado da atualização
SELECT 
  es.id as stand_id,
  es.name as stand_name,
  es.status as new_status,
  sp.id as payment_id,
  sp.status as payment_status,
  sp.amount,
  e.name as event_name
FROM event_stands es
INNER JOIN stand_payments sp ON es.id = sp.stand_id
INNER JOIN events e ON es.event_id = e.id
WHERE sp.status = 'pago'
ORDER BY e.name, es.name; 