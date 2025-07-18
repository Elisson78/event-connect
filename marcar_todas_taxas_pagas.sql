-- Script para marcar TODAS as taxas pendentes como pagas
-- Execute este script para resolver o problema do lucro da plataforma

-- 1. Verificar o estado atual ANTES da mudança
SELECT 
    'ANTES - Taxas pendentes' as status,
    COUNT(*) as quantidade,
    SUM(fee_amount) as valor_total
FROM organizer_taxa 
WHERE status = 'pending'

UNION ALL

SELECT 
    'ANTES - Taxas pagas' as status,
    COUNT(*) as quantidade,
    SUM(fee_amount) as valor_total
FROM organizer_taxa 
WHERE status = 'paid';

-- 2. MARCAR TODAS AS TAXAS PENDENTES COMO PAGAS
UPDATE organizer_taxa 
SET 
    status = 'paid',
    updated_at = NOW()
WHERE status = 'pending';

-- 3. Verificar o estado DEPOIS da mudança
SELECT 
    'DEPOIS - Taxas pendentes' as status,
    COUNT(*) as quantidade,
    SUM(fee_amount) as valor_total
FROM organizer_taxa 
WHERE status = 'pending'

UNION ALL

SELECT 
    'DEPOIS - Taxas pagas' as status,
    COUNT(*) as quantidade,
    SUM(fee_amount) as valor_total
FROM organizer_taxa 
WHERE status = 'paid';

-- 4. Testar a função RPC do dashboard admin
SELECT * FROM get_admin_dashboard_data();

-- 5. Verificar detalhes das taxas agora pagas
SELECT 
    ot.id,
    e.name as evento,
    u.name as organizador,
    ot.fee_amount,
    ot.status,
    ot.created_at,
    ot.updated_at
FROM organizer_taxa ot
LEFT JOIN events e ON ot.event_id = e.id
LEFT JOIN users u ON ot.organizer_id = u.id
ORDER BY ot.updated_at DESC; 