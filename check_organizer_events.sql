-- Script para verificar os eventos do organizador
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os eventos e seus organizadores
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.organizer_id,
    u.email as organizer_email,
    u.name as organizer_name
FROM events e
LEFT JOIN users u ON e.organizer_id = u.id
ORDER BY e.name;

-- 2. Verificar especificamente o evento "Feira de Cosmetico"
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.organizer_id,
    u.email as organizer_email,
    u.name as organizer_name
FROM events e
LEFT JOIN users u ON e.organizer_id = u.id
WHERE e.name LIKE '%Feira de Cosmetico%';

-- 3. Verificar stands pagos com informações do organizador
SELECT 
    sp.id,
    sp.status,
    sp.amount,
    es.name as stand_name,
    e.name as event_name,
    e.organizer_id,
    u.email as user_email,
    org.email as organizer_email
FROM stand_payments sp
LEFT JOIN event_stands es ON sp.stand_id = es.id
LEFT JOIN events e ON es.event_id = e.id
LEFT JOIN users u ON sp.user_id = u.id
LEFT JOIN users org ON e.organizer_id = org.id
WHERE sp.status = 'pago'
ORDER BY e.name, es.name; 