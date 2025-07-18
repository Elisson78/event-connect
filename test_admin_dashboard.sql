-- Script para testar as funções RPC do dashboard admin
-- Execute este script no SQL Editor do Supabase para verificar se tudo está funcionando

-- 1. Verificar se existem inscrições confirmadas
SELECT 
    'Inscrições confirmadas' as tipo,
    COUNT(*) as quantidade
FROM registrations 
WHERE status = 'confirmed'

UNION ALL

-- 2. Verificar se existem taxas na tabela organizer_taxa
SELECT 
    'Taxas na tabela organizer_taxa' as tipo,
    COUNT(*) as quantidade
FROM organizer_taxa

UNION ALL

-- 3. Verificar taxas por status
SELECT 
    'Taxas ' || status as tipo,
    COUNT(*) as quantidade
FROM organizer_taxa 
GROUP BY status

UNION ALL

-- 4. Verificar eventos com inscrições confirmadas
SELECT 
    'Eventos com inscrições confirmadas' as tipo,
    COUNT(DISTINCT e.id) as quantidade
FROM events e
INNER JOIN registrations r ON e.id = r.event_id
WHERE r.status = 'confirmed';

-- 5. Testar a função RPC get_admin_dashboard_data()
SELECT * FROM get_admin_dashboard_data();

-- 6. Verificar eventos sem taxa (detalhado)
SELECT 
    e.id,
    e.name as evento,
    u.name as organizador,
    COUNT(r.id) as inscricoes_confirmadas
FROM events e
LEFT JOIN users u ON e.organizer_id = u.id
LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'confirmed'
WHERE e.id NOT IN (
    SELECT DISTINCT event_id 
    FROM organizer_taxa 
    WHERE status IN ('pending', 'paid')
)
GROUP BY e.id, e.name, u.name
HAVING COUNT(r.id) > 0
ORDER BY inscricoes_confirmadas DESC;

-- 7. Verificar estrutura da tabela organizer_taxa
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizer_taxa'
ORDER BY ordinal_position;

-- 8. Verificar algumas taxas existentes (se houver)
SELECT 
    ot.id,
    e.name as evento,
    u.name as organizador,
    pu.name as participante,
    ot.fee_amount,
    ot.status,
    ot.created_at
FROM organizer_taxa ot
LEFT JOIN events e ON ot.event_id = e.id
LEFT JOIN users u ON ot.organizer_id = u.id
LEFT JOIN users pu ON ot.user_id = pu.id
ORDER BY ot.created_at DESC
LIMIT 10; 