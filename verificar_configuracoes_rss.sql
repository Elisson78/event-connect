-- Script para verificar configurações do RSS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela site_settings existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'site_settings'
) as tabela_existe;

-- 2. Verificar estrutura da tabela site_settings
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'site_settings'
ORDER BY ordinal_position;

-- 3. Verificar todas as configurações existentes
SELECT 
    setting_key,
    setting_value,
    is_active,
    created_at,
    updated_at
FROM site_settings 
ORDER BY setting_key;

-- 4. Verificar especificamente as configurações do RSS
SELECT 
    setting_key,
    setting_value,
    is_active
FROM site_settings 
WHERE setting_key LIKE '%rss%'
ORDER BY setting_key;

-- 5. Verificar se as configurações padrão do RSS existem
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM site_settings WHERE setting_key = 'rss_feed_enabled') 
        THEN 'EXISTE' 
        ELSE 'NÃO EXISTE' 
    END as rss_feed_enabled,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM site_settings WHERE setting_key = 'rss_feed_url') 
        THEN 'EXISTE' 
        ELSE 'NÃO EXISTE' 
    END as rss_feed_url,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM site_settings WHERE setting_key = 'rss_feed_max_events') 
        THEN 'EXISTE' 
        ELSE 'NÃO EXISTE' 
    END as rss_feed_max_events;

-- 6. Se não existirem, criar as configurações padrão
-- Descomente as linhas abaixo se as configurações não existirem:

/*
INSERT INTO site_settings (setting_key, setting_value, is_active, created_at, updated_at) VALUES
('rss_feed_enabled', 'true', true, NOW(), NOW()),
('rss_feed_url', 'https://www.ge.ch/feed/evenements', true, NOW(), NOW()),
('rss_feed_max_events', '10', true, NOW(), NOW())
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
updated_at = NOW();
*/

-- 7. Verificar novamente após inserção (se aplicável)
SELECT 
    setting_key,
    setting_value,
    is_active
FROM site_settings 
WHERE setting_key LIKE '%rss%'
ORDER BY setting_key; 