-- Script para verificar o status dos pagamentos de stands
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os pagamentos de stands e seus status
SELECT 
    sp.id,
    sp.status,
    sp.amount,
    sp.created_at,
    es.name as stand_name,
    e.name as event_name,
    u.email as user_email
FROM stand_payments sp
LEFT JOIN event_stands es ON sp.stand_id = es.id
LEFT JOIN events e ON es.event_id = e.id
LEFT JOIN users u ON sp.user_id = u.id
ORDER BY sp.created_at DESC;

-- 2. Contar pagamentos por status
SELECT 
    status,
    COUNT(*) as total,
    SUM(amount) as valor_total
FROM stand_payments
GROUP BY status
ORDER BY status;

-- 3. Verificar pagamentos de stands específicos (substitua pelos IDs dos seus eventos)
SELECT 
    sp.id,
    sp.status,
    sp.amount,
    es.name as stand_name,
    e.name as event_name,
    u.email as user_email
FROM stand_payments sp
LEFT JOIN event_stands es ON sp.stand_id = es.id
LEFT JOIN events e ON es.event_id = e.id
LEFT JOIN users u ON sp.user_id = u.id
WHERE e.name LIKE '%Feira de Cosmetico%'  -- Substitua pelo nome do seu evento
ORDER BY sp.created_at DESC; 