-- Script para criar a tabela site_settings e configurações do RSS
-- Execute este script no SQL Editor do Supabase se a tabela não existir

-- 1. Criar a tabela site_settings
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir configurações padrão do RSS
INSERT INTO site_settings (setting_key, setting_value, is_active, created_at, updated_at) VALUES
('rss_feed_enabled', 'true', true, NOW(), NOW()),
('rss_feed_url', 'https://www.ge.ch/feed/evenements', true, NOW(), NOW()),
('rss_feed_max_events', '10', true, NOW(), NOW())
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
updated_at = NOW();

-- 3. Verificar se foi criado corretamente
SELECT 
    setting_key,
    setting_value,
    is_active
FROM site_settings 
ORDER BY setting_key;

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_active ON site_settings(is_active);

-- 5. Verificar se o contexto está funcionando
-- Esta consulta simula o que o SettingsContext faz
SELECT 
    setting_key,
    setting_value
FROM site_settings 
WHERE is_active = true
ORDER BY setting_key; 