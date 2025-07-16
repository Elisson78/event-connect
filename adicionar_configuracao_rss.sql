-- Script para adicionar configuração do RSS feed no painel admin
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar configuração para ativar/desativar RSS feed
INSERT INTO site_settings (
  setting_key,
  setting_value,
  setting_type,
  label,
  description,
  category,
  is_active,
  created_at,
  updated_at
) VALUES (
  'rss_feed_enabled',
  'true', -- Ativado por padrão
  'toggle',
  'Feed RSS de Eventos Externos',
  'Ativa ou desativa a exibição de eventos externos na página de eventos',
  'geral',
  true,
  NOW(),
  NOW()
);

-- 2. Adicionar configuração para URL do RSS feed
INSERT INTO site_settings (
  setting_key,
  setting_value,
  setting_type,
  label,
  description,
  category,
  is_active,
  created_at,
  updated_at
) VALUES (
  'rss_feed_url',
  'https://www.ge.ch/feed/evenements',
  'url',
  'URL do Feed RSS',
  'URL do feed RSS para buscar eventos externos',
  'geral',
  true,
  NOW(),
  NOW()
);

-- 3. Adicionar configuração para número máximo de eventos
INSERT INTO site_settings (
  setting_key,
  setting_value,
  setting_type,
  label,
  description,
  category,
  is_active,
  created_at,
  updated_at
) VALUES (
  'rss_feed_max_events',
  '10',
  'text',
  'Máximo de Eventos Externos',
  'Número máximo de eventos externos a serem exibidos',
  'geral',
  true,
  NOW(),
  NOW()
);

-- 4. Verificar se as configurações foram adicionadas
SELECT 
  setting_key,
  setting_value,
  setting_type,
  label,
  description,
  category
FROM site_settings 
WHERE setting_key LIKE 'rss_feed%'
ORDER BY setting_key; 