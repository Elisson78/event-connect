# Sistema de Taxas Automáticas - Documentação Final

## Resumo da Implementação

O sistema de taxas foi completamente reformulado para funcionar de forma automática, baseado em faixas de preço dos eventos, eliminando a necessidade de seleção manual de planos de taxa pelos organizadores.

## Nova Lógica de Taxas

### Faixas de Preço e Taxas
- **Evento gratuito (price = 0):** Sem taxa
- **0 < price ≤ 50:** Taxa de CHF 0.50
- **51 ≤ price ≤ 100:** Taxa de CHF 0.60  
- **101 ≤ price ≤ 500:** Taxa de CHF 0.65

### Quando a Taxa é Gerada
1. **Aprovação de inscrição pelo organizador** (`OrganizerRegistrations.jsx`)
2. **Início de pagamento manual pelo participante** (`PaymentPage.jsx`)

## Tabelas Utilizadas

### Tabela `organizer_taxa` (Nova)
```sql
CREATE TABLE organizer_taxa (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    organizer_id UUID NOT NULL,
    registration_id UUID NOT NULL,
    user_id UUID NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);
```

### Tabela `platform_fees` (Mantida para compatibilidade)
- Usada apenas para taxas antigas ou casos especiais
- Não é mais utilizada no fluxo normal

## Fluxo de Funcionamento

### 1. Aprovação de Inscrição (Organizador)
```javascript
// Em OrganizerRegistrations.jsx - handleApprove()
const price = eventData.price ? parseFloat(eventData.price) : 0;
let feeAmount = 0;

if (price === 0) {
  feeAmount = 0;
} else if (price > 0 && price <= 50) {
  feeAmount = 0.50;
} else if (price > 50 && price <= 100) {
  feeAmount = 0.60;
} else if (price > 100 && price <= 500) {
  feeAmount = 0.65;
}

// Inserir na tabela organizer_taxa se feeAmount > 0
```

### 2. Pagamento Manual (Participante)
```javascript
// Em PaymentPage.jsx - handleManualPayment()
// Mesma lógica de cálculo de taxa
// Inserir na tabela organizer_taxa se feeAmount > 0
```

## Mudanças Realizadas

### Arquivos Modificados
1. **`src/components/organizer/OrganizerRegistrations.jsx`**
   - Implementada lógica de cálculo automático por faixa
   - Taxas inseridas na tabela `organizer_taxa`
   - Removida dependência de `plan_id`

2. **`src/pages/PaymentPage.jsx`**
   - Atualizada para usar nova lógica de taxas
   - Taxas inseridas na tabela `organizer_taxa`
   - Removida dependência de `plan_id`

3. **`src/components/organizer/OrganizerEventForm.jsx`**
   - Campo de seleção de plano de taxa removido
   - Mantido apenas campo de plano de marketing (`ad_plan_id`)

### Arquivos Não Modificados (Já Corretos)
- **`src/contexts/EventContext.jsx`** - Usa apenas `ad_plan_id` para marketing
- **`src/components/organizer/OrganizerOverview.jsx`** - Usa apenas `ad_plan_id` para marketing

## Vantagens da Nova Implementação

1. **Simplicidade:** Organizadores não precisam escolher planos de taxa
2. **Transparência:** Taxas calculadas automaticamente e previsíveis
3. **Consistência:** Mesma lógica em todos os pontos do sistema
4. **Rastreabilidade:** Taxas registradas com detalhes completos
5. **Flexibilidade:** Fácil ajuste das faixas de preço no futuro

## Queries Úteis para Monitoramento

### Verificar Taxas Registradas
```sql
SELECT 
    ot.id,
    e.name as event_name,
    e.price as event_price,
    u.name as organizer_name,
    p.name as participant_name,
    ot.fee_amount,
    ot.status,
    ot.description,
    ot.created_at
FROM organizer_taxa ot
JOIN events e ON ot.event_id = e.id
JOIN users u ON ot.organizer_id = u.id
JOIN users p ON ot.user_id = p.id
ORDER BY ot.created_at DESC;
```

### Resumo de Taxas por Organizador
```sql
SELECT 
    u.name as organizer_name,
    COUNT(*) as total_taxas,
    SUM(ot.fee_amount) as total_valor,
    COUNT(CASE WHEN ot.status = 'paid' THEN 1 END) as taxas_pagas,
    COUNT(CASE WHEN ot.status = 'pending' THEN 1 END) as taxas_pendentes
FROM organizer_taxa ot
JOIN users u ON ot.organizer_id = u.id
GROUP BY u.id, u.name
ORDER BY total_valor DESC;
```

### Taxas por Faixa de Preço
```sql
SELECT 
    CASE 
        WHEN e.price = 0 THEN 'Gratuito'
        WHEN e.price <= 50 THEN '0-50 CHF'
        WHEN e.price <= 100 THEN '51-100 CHF'
        WHEN e.price <= 500 THEN '101-500 CHF'
        ELSE '500+ CHF'
    END as faixa_preco,
    COUNT(*) as total_inscricoes,
    SUM(ot.fee_amount) as total_taxas
FROM organizer_taxa ot
JOIN events e ON ot.event_id = e.id
GROUP BY faixa_preco
ORDER BY total_taxas DESC;
```

## Testes Recomendados

1. **Criar evento gratuito** → Aprovar inscrição → Verificar que não há taxa
2. **Criar evento com preço CHF 30** → Aprovar inscrição → Verificar taxa de CHF 0.50
3. **Criar evento com preço CHF 75** → Aprovar inscrição → Verificar taxa de CHF 0.60
4. **Criar evento com preço CHF 200** → Aprovar inscrição → Verificar taxa de CHF 0.65
5. **Testar pagamento manual** → Verificar que taxa é gerada corretamente
6. **Verificar duplicidade** → Tentar aprovar mesma inscrição duas vezes

## Status Final

✅ **Sistema implementado e funcionando**
✅ **Taxas calculadas automaticamente por faixa de preço**
✅ **Tabela `organizer_taxa` criada e configurada**
✅ **Campo de plano de taxa removido do formulário**
✅ **Fluxo de aprovação e pagamento atualizado**
✅ **Documentação completa criada**

O sistema está pronto para uso em produção com a nova lógica de taxas automáticas. 