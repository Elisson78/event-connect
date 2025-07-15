-- Função RPC para buscar dados de stands vendidos do organizador
-- Execute este script no Supabase SQL Editor

-- Criar função para buscar stands vendidos
CREATE OR REPLACE FUNCTION get_organizer_stand_sales(p_organizer_id UUID)
RETURNS TABLE (
  id UUID,
  amount DECIMAL,
  status TEXT,
  created_at TIMESTAMPTZ,
  stand_name TEXT,
  stand_price DECIMAL,
  event_name TEXT,
  user_name TEXT,
  user_email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.amount,
    sp.status,
    sp.created_at,
    es.name as stand_name,
    es.price as stand_price,
    e.name as event_name,
    u.name as user_name,
    u.email as user_email
  FROM stand_payments sp
  INNER JOIN event_stands es ON sp.stand_id = es.id
  INNER JOIN events e ON es.event_id = e.id
  LEFT JOIN users u ON sp.user_id = u.id
  WHERE sp.status = 'pago'
    AND e.organizer_id = p_organizer_id
  ORDER BY e.name, es.name;
END;
$$;

-- Criar função para buscar resumo de stands (somas)
CREATE OR REPLACE FUNCTION get_organizer_stands_summary(p_organizer_id UUID)
RETURNS TABLE (
  total_stands_sold INTEGER,
  total_revenue DECIMAL,
  pending_stands INTEGER,
  pending_amount DECIMAL,
  available_stands INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Stands vendidos
    COALESCE((
      SELECT COUNT(*)
      FROM stand_payments sp
      INNER JOIN event_stands es ON sp.stand_id = es.id
      INNER JOIN events e ON es.event_id = e.id
      WHERE sp.status = 'pago' AND e.organizer_id = p_organizer_id
    ), 0) as total_stands_sold,
    
    -- Receita total
    COALESCE((
      SELECT SUM(sp.amount)
      FROM stand_payments sp
      INNER JOIN event_stands es ON sp.stand_id = es.id
      INNER JOIN events e ON es.event_id = e.id
      WHERE sp.status = 'pago' AND e.organizer_id = p_organizer_id
    ), 0) as total_revenue,
    
    -- Stands pendentes
    COALESCE((
      SELECT COUNT(*)
      FROM stand_payments sp
      INNER JOIN event_stands es ON sp.stand_id = es.id
      INNER JOIN events e ON es.event_id = e.id
      WHERE sp.status IN ('pending', 'em_analise') AND e.organizer_id = p_organizer_id
    ), 0) as pending_stands,
    
    -- Valor pendente
    COALESCE((
      SELECT SUM(sp.amount)
      FROM stand_payments sp
      INNER JOIN event_stands es ON sp.stand_id = es.id
      INNER JOIN events e ON es.event_id = e.id
      WHERE sp.status IN ('pending', 'em_analise') AND e.organizer_id = p_organizer_id
    ), 0) as pending_amount,
    
    -- Stands disponíveis
    COALESCE((
      SELECT COUNT(*)
      FROM event_stands es
      INNER JOIN events e ON es.event_id = e.id
      WHERE es.status = 'disponivel' AND e.organizer_id = p_organizer_id
    ), 0) as available_stands;
END;
$$;

-- Testar as funções
SELECT * FROM get_organizer_stand_sales('59cd93d6-07c3-44e6-8a2b-044f485d40ea');
SELECT * FROM get_organizer_stands_summary('59cd93d6-07c3-44e6-8a2b-044f485d40ea'); 