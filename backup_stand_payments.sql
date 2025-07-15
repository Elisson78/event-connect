-- Script de BACKUP da tabela stand_payments
-- Execute este script ANTES de fazer qualquer alteração

-- Criar tabela de backup
CREATE TABLE IF NOT EXISTS stand_payments_backup AS 
SELECT * FROM stand_payments;

-- Verificar se o backup foi criado
SELECT 'BACKUP CRIADO' as status, COUNT(*) as total_records 
FROM stand_payments_backup;

-- Verificar dados originais
SELECT 'DADOS ORIGINAIS' as status, COUNT(*) as total_records 
FROM stand_payments;

-- Para restaurar (se necessário), execute:
-- DROP TABLE stand_payments;
-- ALTER TABLE stand_payments_backup RENAME TO stand_payments; 