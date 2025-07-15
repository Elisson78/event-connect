# 🔧 Correção do Sistema de Pagamentos de Stands

## 🚨 Problema Identificado

O erro "Could not find the 'updated_at' column of 'stand_payments' in the schema cache" indica que a tabela `stand_payments` não existe no banco de dados ou está com estrutura incorreta.

## ✅ Solução

### Passo 1: Executar Script SQL

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o conteúdo do arquivo `database_stand_payments.sql`

### Passo 2: Verificar Estrutura da Tabela

A tabela `stand_payments` deve ter as seguintes colunas:

```sql
CREATE TABLE stand_payments (
    id UUID PRIMARY KEY,
    stand_id UUID REFERENCES event_stands(id),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_receipt_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Passo 3: Testar o Sistema

Após executar o script:

1. **Acesse como participante** o Dashboard Financeiro
2. **Clique em "Pagar"** em um stand reservado
3. **Selecione um arquivo** de comprovante
4. **Clique em "Confirmar Pagamento"**

## 🔍 Verificação

Para verificar se a tabela foi criada corretamente:

```sql
-- No SQL Editor do Supabase
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stand_payments';
```

## 📋 Status dos Pagamentos

- `pending`: Aguardando pagamento
- `em_analise`: Comprovante enviado, aguardando análise
- `pago`: Pagamento aprovado
- `rejeitado`: Pagamento rejeitado

## 🚀 Fluxo Completo

1. **Participante reserva stand** → Cria registro em `stand_payments`
2. **Participante faz pagamento** → Fora do sistema (TWINT, banco, etc.)
3. **Participante envia comprovante** → Upload do arquivo
4. **Sistema atualiza status** → `pending` → `em_analise`
5. **Organizador analisa** → `em_analise` → `pago` ou `rejeitado`

## ⚠️ Importante

- A tabela `stand_payments` é diferente da tabela `event_stands`
- Cada pagamento de stand gera um registro único
- O sistema usa RLS (Row Level Security) para controle de acesso
- Apenas o participante pode ver/editar seus próprios pagamentos
- Organizadores podem ver pagamentos dos stands dos seus eventos 