-- Script para verificar taxas pagas e identificar problemas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todas as taxas e seus status
SELECT 
    id,
    event_id,
    organizer_id,
    user_id,
    fee_amount,
    status,
    created_at,
    updated_at,
    description
FROM organizer_taxa 
ORDER BY created_at DESC;

-- 2. Verificar especificamente taxas com status 'paid'
SELECT 
    ot.id,
    e.name as evento,
    u.name as organizador,
    pu.name as participante,
    ot.fee_amount,
    ot.status,
    ot.created_at,
    ot.updated_at
FROM organizer_taxa ot
LEFT JOIN events e ON ot.event_id = e.id
LEFT JOIN users u ON ot.organizer_id = u.id
LEFT JOIN users pu ON ot.user_id = pu.id
WHERE ot.status = 'paid'
ORDER BY ot.updated_at DESC;

-- 3. Verificar se há diferença entre created_at e updated_at
SELECT 
    id,
    fee_amount,
    status,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at IS NULL THEN 'Sem atualização'
        WHEN updated_at = created_at THEN 'Nunca atualizado'
        ELSE 'Atualizado em: ' || updated_at
    END as status_atualizacao
FROM organizer_taxa 
WHERE status = 'paid'
ORDER BY updated_at DESC;

-- 4. Testar a função RPC para ver o que está retornando
SELECT * FROM get_admin_dashboard_data();

-- 5. Verificar manualmente o cálculo do lucro da plataforma
SELECT 
    'Total de taxas' as tipo,
    COUNT(*) as quantidade,
    SUM(fee_amount) as valor_total
FROM organizer_taxa

UNION ALL

SELECT 
    'Taxas pagas' as tipo,
    COUNT(*) as quantidade,
    SUM(fee_amount) as valor_total
FROM organizer_taxa 
WHERE status = 'paid'

UNION ALL

SELECT 
    'Taxas pendentes' as tipo,
    COUNT(*) as quantidade,
    SUM(fee_amount) as valor_total
FROM organizer_taxa 
WHERE status = 'pending';

-- 6. Verificar se há taxas com status diferente de 'paid' ou 'pending'
SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(fee_amount) as valor_total
FROM organizer_taxa 
GROUP BY status
ORDER BY status; 