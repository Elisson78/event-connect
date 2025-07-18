-- Script para marcar todas as taxas do Geneve Feiras como pagas

-- 1. Primeiro, vamos descobrir o ID do organizador "Geneve Feiras"
SELECT 
    id,
    name,
    email
FROM users 
WHERE name ILIKE '%Geneve Feiras%' 
   OR name ILIKE '%Geneve%' 
   OR name ILIKE '%Feiras%';

-- 2. Verificar todas as taxas deste organizador
SELECT 
    ot.id as taxa_id,
    e.name as evento,
    u.name as organizador,
    ot.fee_amount,
    ot.status,
    ot.created_at
FROM organizer_taxa ot
LEFT JOIN events e ON ot.event_id = e.id
LEFT JOIN users u ON ot.organizer_id = u.id
WHERE u.name ILIKE '%Geneve Feiras%'
ORDER BY ot.created_at DESC;

-- 3. Marcar todas as taxas pendentes como pagas (execute após descobrir o organizer_id)
-- Substitua 'UUID_DO_ORGANIZADOR' pelo ID real encontrado na consulta 1
-- SELECT * FROM marcar_taxas_organizador_como_pagas('UUID_DO_ORGANIZADOR');

-- 4. Verificar se funcionou
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

-- 5. Testar a função RPC novamente
SELECT * FROM get_admin_dashboard_data(); 