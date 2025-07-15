-- Script para simular um pagamento aprovado
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar pagamentos pendentes que podem ser aprovados
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
WHERE sp.status IN ('pending', 'em_analise')
ORDER BY sp.created_at DESC;

-- 2. Aprovar um pagamento (substitua o ID pelo ID real do pagamento)
-- UPDATE stand_payments 
-- SET status = 'pago' 
-- WHERE id = 'SUBSTITUA_PELO_ID_REAL';

-- 3. Verificar se o pagamento foi aprovado
-- SELECT 
--     sp.id,
--     sp.status,
--     sp.amount,
--     es.name as stand_name,
--     e.name as event_name,
--     u.email as user_email
-- FROM stand_payments sp
-- LEFT JOIN event_stands es ON sp.stand_id = es.id
-- LEFT JOIN events e ON es.event_id = e.id
-- LEFT JOIN users u ON sp.user_id = u.id
-- WHERE sp.id = 'SUBSTITUA_PELO_ID_REAL'; 