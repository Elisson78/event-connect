-- Função RPC para o painel admin da plataforma
-- Retorna métricas, histórico de taxas e eventos sem taxa

CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS TABLE (
    -- Métricas dos cards superiores
    volume_inscricoes NUMERIC,
    lucro_plataforma NUMERIC,
    taxas_recebidas NUMERIC,
    taxas_pendentes NUMERIC,
    
    -- Histórico de taxas (JSON)
    historico_taxas JSON,
    
    -- Eventos sem taxa (JSON)
    eventos_sem_taxa JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_volume_inscricoes NUMERIC := 0;
    v_lucro_plataforma NUMERIC := 0;
    v_taxas_recebidas NUMERIC := 0;
    v_taxas_pendentes NUMERIC := 0;
    v_historico_taxas JSON;
    v_eventos_sem_taxa JSON;
BEGIN
    -- 1. Calcular Volume de Inscrições (total de inscrições confirmadas)
    SELECT COALESCE(COUNT(*), 0)
    INTO v_volume_inscricoes
    FROM registrations 
    WHERE status = 'confirmed';
    
    -- 2. Calcular Lucro da Plataforma (soma de todas as taxas pagas)
    SELECT COALESCE(SUM(fee_amount), 0)
    INTO v_lucro_plataforma
    FROM organizer_taxa 
    WHERE status = 'paid';
    
    -- 3. Calcular Taxas Recebidas (taxas pagas)
    SELECT COALESCE(SUM(fee_amount), 0)
    INTO v_taxas_recebidas
    FROM organizer_taxa 
    WHERE status = 'paid';
    
    -- 4. Calcular Taxas Pendentes (taxas não pagas)
    SELECT COALESCE(SUM(fee_amount), 0)
    INTO v_taxas_pendentes
    FROM organizer_taxa 
    WHERE status = 'pending';
    
    -- 5. Buscar Histórico de Taxas da Plataforma
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'id', ot.id,
                'organizador', u.name,
                'evento', e.name,
                'plano', p.name,
                'valor', ot.fee_amount,
                'status', ot.status,
                'data', ot.created_at,
                'participante', pu.name
            )
        ), '[]'::json
    )
    INTO v_historico_taxas
    FROM organizer_taxa ot
    LEFT JOIN events e ON ot.event_id = e.id
    LEFT JOIN users u ON ot.organizer_id = u.id
    LEFT JOIN users pu ON ot.user_id = pu.id
    LEFT JOIN plans p ON e.ad_plan_id = p.id
    ORDER BY ot.created_at DESC;
    
    -- 6. Buscar Eventos sem Taxa de Serviço
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'id', e.id,
                'nome', e.name,
                'organizador', u.name,
                'inscricoes_confirmadas', COALESCE(reg_count.count, 0)
            )
        ), '[]'::json
    )
    INTO v_eventos_sem_taxa
    FROM events e
    LEFT JOIN users u ON e.organizer_id = u.id
    LEFT JOIN (
        SELECT event_id, COUNT(*) as count
        FROM registrations 
        WHERE status = 'confirmed'
        GROUP BY event_id
    ) reg_count ON e.id = reg_count.event_id
    WHERE e.id NOT IN (
        SELECT DISTINCT event_id 
        FROM organizer_taxa 
        WHERE status IN ('pending', 'paid')
    )
    AND reg_count.count > 0  -- Só eventos com inscrições confirmadas
    ORDER BY e.created_at DESC;
    
    -- Retornar todos os dados
    RETURN QUERY SELECT 
        v_volume_inscricoes,
        v_lucro_plataforma,
        v_taxas_recebidas,
        v_taxas_pendentes,
        v_historico_taxas,
        v_eventos_sem_taxa;
        
END;
$$;

-- Função para gerar taxa manualmente para um evento
CREATE OR REPLACE FUNCTION generate_event_service_fee(p_event_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    fees_generated INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_registrations RECORD;
    v_fee_amount NUMERIC := 0;
    v_fees_generated INTEGER := 0;
    v_plan RECORD;
BEGIN
    -- Buscar o evento
    SELECT * INTO v_event
    FROM events 
    WHERE id = p_event_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Evento não encontrado'::TEXT, 0;
        RETURN;
    END IF;
    
    -- Buscar plano do evento (se existir)
    IF v_event.ad_plan_id IS NOT NULL THEN
        SELECT * INTO v_plan
        FROM plans 
        WHERE id = v_event.ad_plan_id;
    END IF;
    
    -- Buscar inscrições confirmadas do evento
    FOR v_registrations IN 
        SELECT * FROM registrations 
        WHERE event_id = p_event_id 
        AND status = 'confirmed'
    LOOP
        -- Verificar se já existe taxa para esta inscrição
        IF NOT EXISTS (
            SELECT 1 FROM organizer_taxa 
            WHERE event_id = p_event_id 
            AND registration_id = v_registrations.id
            AND user_id = v_registrations.user_id
        ) THEN
            -- Calcular taxa baseada no plano ou faixa de preço
            IF v_plan IS NOT NULL THEN
                -- Taxa baseada no plano
                v_fee_amount := (v_event.price * (v_plan.fee_percent / 100)) + COALESCE(v_plan.fee_fixed, 0);
            ELSE
                -- Taxa fixa por faixa de preço
                IF v_event.price = 0 THEN
                    v_fee_amount := 0;
                ELSIF v_event.price > 0 AND v_event.price <= 50 THEN
                    v_fee_amount := 0.50;
                ELSIF v_event.price > 50 AND v_event.price <= 100 THEN
                    v_fee_amount := 0.60;
                ELSIF v_event.price > 100 AND v_event.price <= 500 THEN
                    v_fee_amount := 0.65;
                ELSE
                    v_fee_amount := 0.70; -- Para valores acima de 500
                END IF;
            END IF;
            
            -- Inserir taxa se valor > 0
            IF v_fee_amount > 0 THEN
                INSERT INTO organizer_taxa (
                    event_id,
                    organizer_id,
                    registration_id,
                    user_id,
                    fee_amount,
                    status,
                    created_at,
                    description
                ) VALUES (
                    p_event_id,
                    v_event.organizer_id,
                    v_registrations.id,
                    v_registrations.user_id,
                    v_fee_amount,
                    'pending',
                    NOW(),
                    CASE 
                        WHEN v_plan IS NOT NULL THEN 
                            'Taxa gerada manualmente (plano: ' || v_plan.name || ')'
                        ELSE 
                            'Taxa gerada manualmente (faixa: ' || v_event.price || ')'
                    END
                );
                
                v_fees_generated := v_fees_generated + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        TRUE, 
        'Taxas geradas com sucesso: ' || v_fees_generated || ' taxa(s) criada(s)'::TEXT,
        v_fees_generated;
        
END;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION get_admin_dashboard_data() IS 'Retorna dados completos para o dashboard admin: métricas, histórico de taxas e eventos sem taxa';
COMMENT ON FUNCTION generate_event_service_fee(UUID) IS 'Gera taxas de serviço manualmente para um evento específico'; 