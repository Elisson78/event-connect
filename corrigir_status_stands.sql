-- Corrigir status dos stands que já foram pagos
-- Execute este script no Supabase SQL Editor

-- 1. Ver stands com pagamentos aprovados mas status incorreto
SELECT 
  es.name as stand,
  es.status as status_atual,
  sp.status as status_pagamento,
  e.name as evento
FROM event_stands es
INNER JOIN stand_payments sp ON es.id = sp.stand_id
INNER JOIN events e ON es.event_id = e.id
WHERE sp.status = 'pago' AND es.status != 'vendido';

-- 2. Atualizar status dos stands pagos
UPDATE event_stands 
SET status = 'vendido', updated_at = NOW()
WHERE id IN (
  SELECT es.id
  FROM event_stands es
  INNER JOIN stand_payments sp ON es.id = sp.stand_id
  WHERE sp.status = 'pago' AND es.status != 'vendido'
);

-- 3. Verificar resultado
SELECT 
  es.name as stand,
  es.status as novo_status,
  sp.status as status_pagamento,
  e.name as evento
FROM event_stands es
INNER JOIN stand_payments sp ON es.id = sp.stand_id
INNER JOIN events e ON es.event_id = e.id
WHERE sp.status = 'pago'; 