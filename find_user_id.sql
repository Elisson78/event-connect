-- Script para encontrar o user_id do usuário rose@gmail.com
-- Execute este script no SQL Editor do Supabase

-- Buscar o user_id do usuário rose@gmail.com
SELECT 
    id as user_id,
    email,
    name,
    company_name
FROM users 
WHERE email = 'rose@gmail.com';

-- Verificar todos os usuários para debug
SELECT 
    id as user_id,
    email,
    name,
    company_name
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- Verificar stands reservados usando user_id (substitua pelo user_id correto)
-- SELECT 
--     es.id,
--     es.name,
--     es.status,
--     es.reserved_by,
--     es.price,
--     e.name as event_name,
--     e.organizer_id
-- FROM event_stands es
-- LEFT JOIN events e ON es.event_id = e.id
-- WHERE es.status = 'reservado' 
-- AND es.reserved_by = 'SUBSTITUA_PELO_USER_ID_AQUI'
-- ORDER BY es.created_at DESC; 