-- Função para marcar uma taxa como paga
-- Use esta função quando um organizador pagar uma taxa

CREATE OR REPLACE FUNCTION marcar_taxa_como_paga(p_taxa_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    valor_pago NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_taxa RECORD;
    v_valor_pago NUMERIC := 0;
BEGIN
    -- Buscar a taxa
    SELECT * INTO v_taxa
    FROM organizer_taxa 
    WHERE id = p_taxa_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Taxa não encontrada'::TEXT, 0;
        RETURN;
    END IF;
    
    -- Verificar se já está paga
    IF v_taxa.status = 'paid' THEN
        RETURN QUERY SELECT FALSE, 'Taxa já está paga'::TEXT, v_taxa.fee_amount;
        RETURN;
    END IF;
    
    -- Marcar como paga
    UPDATE organizer_taxa 
    SET 
        status = 'paid',
        updated_at = NOW()
    WHERE id = p_taxa_id;
    
    v_valor_pago := v_taxa.fee_amount;
    
    RETURN QUERY SELECT 
        TRUE, 
        'Taxa marcada como paga com sucesso'::TEXT,
        v_valor_pago;
        
END;
$$;

-- Função para marcar todas as taxas de um organizador como pagas
CREATE OR REPLACE FUNCTION marcar_taxas_organizador_como_pagas(p_organizer_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    taxas_pagas INTEGER,
    valor_total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_taxas_pagas INTEGER := 0;
    v_valor_total NUMERIC := 0;
BEGIN
    -- Marcar todas as taxas pendentes do organizador como pagas
    UPDATE organizer_taxa 
    SET 
        status = 'paid',
        updated_at = NOW()
    WHERE organizer_id = p_organizer_id 
    AND status = 'pending';
    
    -- Contar quantas foram marcadas
    GET DIAGNOSTICS v_taxas_pagas = ROW_COUNT;
    
    -- Calcular valor total
    SELECT COALESCE(SUM(fee_amount), 0)
    INTO v_valor_total
    FROM organizer_taxa 
    WHERE organizer_id = p_organizer_id 
    AND status = 'paid';
    
    RETURN QUERY SELECT 
        TRUE, 
        'Taxas marcadas como pagas: ' || v_taxas_pagas || ' taxa(s)'::TEXT,
        v_taxas_pagas,
        v_valor_total;
        
END;
$$;

-- Exemplo de uso:
-- Para marcar uma taxa específica como paga:
-- SELECT * FROM marcar_taxa_como_paga('uuid-da-taxa-aqui');

-- Para marcar todas as taxas de um organizador como pagas:
-- SELECT * FROM marcar_taxas_organizador_como_pagas('uuid-do-organizador-aqui');

-- Comentários para documentação
COMMENT ON FUNCTION marcar_taxa_como_paga(UUID) IS 'Marca uma taxa específica como paga';
COMMENT ON FUNCTION marcar_taxas_organizador_como_pagas(UUID) IS 'Marca todas as taxas pendentes de um organizador como pagas'; 