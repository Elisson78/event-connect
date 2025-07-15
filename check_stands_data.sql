-- Script para verificar os dados da tabela event_stands
-- Execute este script no SQL Editor do Supabase

-- Verificar todos os stands reservados
SELECT 
    es.id,
    es.name,
    es.status,
    es.reserved_by,
    es.price,
    e.name as event_name,
    e.organizer_id
FROM event_stands es
LEFT JOIN events e ON es.event_id = e.id
WHERE es.status = 'reservado'
ORDER BY es.created_at DESC;

-- Verificar stands reservados por user_id específico (substitua pelo user_id correto)
SELECT 
    es.id,
    es.name,
    es.status,
    es.reserved_by,
    es.price,
    e.name as event_name,
    e.organizer_id,
    u.email as user_email
FROM event_stands es
LEFT JOIN events e ON es.event_id = e.id
LEFT JOIN users u ON es.reserved_by = u.id
WHERE es.status = 'reservado' 
AND u.email = 'rose@gmail.com'
ORDER BY es.created_at DESC;

-- Verificar todos os emails que têm stands reservados
SELECT DISTINCT 
    es.reserved_by,
    COUNT(*) as total_stands
FROM event_stands es
WHERE es.status = 'reservado'
GROUP BY es.reserved_by
ORDER BY total_stands DESC;

-- Verificar se há dados na tabela stand_payments
SELECT 
    sp.id,
    sp.user_id,
    sp.stand_id,
    sp.amount,
    sp.status,
    sp.created_at,
    es.name as stand_name,
    es.reserved_by
FROM stand_payments sp
LEFT JOIN event_stands es ON sp.stand_id = es.id
ORDER BY sp.created_at DESC; 