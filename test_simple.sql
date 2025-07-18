-- Script simples para testar as funções RPC
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos verificar se a tabela organizer_taxa existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizer_taxa'
) as tabela_existe;

-- 2. Verificar se existem inscrições confirmadas
SELECT COUNT(*) as inscricoes_confirmadas
FROM registrations 
WHERE status = 'confirmed';

-- 3. Verificar se existem taxas
SELECT COUNT(*) as total_taxas
FROM organizer_taxa;

-- 4. Verificar taxas por status
SELECT status, COUNT(*) as quantidade
FROM organizer_taxa 
GROUP BY status;

-- 5. Testar a função RPC (deve funcionar agora)
SELECT * FROM get_admin_dashboard_data();

-- 6. Verificar eventos com inscrições confirmadas
SELECT 
    e.name as evento,
    u.name as organizador,
    COUNT(r.id) as inscricoes_confirmadas
FROM events e
LEFT JOIN users u ON e.organizer_id = u.id
LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'confirmed'
GROUP BY e.id, e.name, u.name
HAVING COUNT(r.id) > 0
ORDER BY inscricoes_confirmadas DESC; 