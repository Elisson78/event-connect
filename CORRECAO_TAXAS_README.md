# 🔧 Correção da Lógica de Geração de Taxas

## 🚨 Problema Identificado

A lógica de geração de taxas estava usando o campo **`ad_plan_id`** (plano de marketing) para calcular as taxas, quando deveria usar o campo **`plan_id`** (plano de taxa).

## ✅ Correções Implementadas

### 1. **OrganizerRegistrations.jsx**
- **Antes:** Usava `eventData.ad_plan_id` para buscar o plano de taxa
- **Depois:** Usa `eventData.plan_id` para buscar o plano de taxa
- **Impacto:** Agora a taxa é calculada corretamente baseada no plano de taxa selecionado

### 2. **PaymentPage.jsx**
- **Antes:** Usava `eventData.ad_plan_id` para buscar o plano de taxa
- **Depois:** Usa `eventData.plan_id` para buscar o plano de taxa
- **Impacto:** Taxa gerada corretamente durante o processo de pagamento

### 3. **EventContext.jsx**
- **Mantido:** `ad_plan_id` continua sendo usado para determinar se o evento é **featured** (destaque)
- **Justificativa:** O campo de marketing deve continuar controlando a visibilidade do evento

## 📋 Nova Lógica de Taxas

### **Quando a taxa é gerada:**
1. **Evento Pago:** `price > 0`
2. **Plano de Taxa:** `plan_id` preenchido (obrigatório para eventos pagos)
3. **Momento:** Quando o organizador aprova a inscrição

### **Cálculo da Taxa:**
```javascript
const feePercent = plan?.fee_percent ? parseFloat(plan.fee_percent) : 0;
const feeFixed = plan?.fee_fixed ? parseFloat(plan.fee_fixed) : 0;
const price = eventData.price ? parseFloat(eventData.price) : 0;
const feeAmount = price * (feePercent / 100) + feeFixed;
```

### **Exemplos:**
- **Evento gratuito (`price = 0`):** ❌ Não gera taxa
- **Evento pago sem plano:** ❌ Não gera taxa
- **Evento pago com plano Plus (`fee_fixed = 0.60`):** ✅ Gera taxa de CHF 0.60
- **Evento pago com plano Pro (`fee_fixed = 0.65`):** ✅ Gera taxa de CHF 0.65

## 🎯 Próximos Passos para Testar

1. **Criar evento pago** com plano de taxa selecionado
2. **Fazer inscrição** como participante
3. **Aprovar inscrição** como organizador
4. **Verificar** se a taxa foi gerada na tabela `platform_fees`

## 📊 Verificação no Banco

Execute no Supabase SQL Editor:
```sql
-- Verificar eventos com plan_id
SELECT id, name, price, plan_id, ad_plan_id FROM events WHERE price > 0;

-- Verificar taxas geradas
SELECT * FROM platform_fees ORDER BY created_at DESC;
```

## 🔍 Campos Separados

- **`plan_id`:** Plano de taxa (obrigatório para eventos pagos)
- **`ad_plan_id`:** Plano de marketing/publicidade (opcional)
- **`is_featured`:** Destaque do evento (controlado pelo plano de marketing) 

---

## **Passo a passo para criar a função no Supabase**

1. **Acesse o painel do Supabase** e vá em **SQL Editor**.
2. Clique em **New Query**.
3. Cole o SQL abaixo:

```sql
create or replace function get_organizer_ticket_sales(organizer_uuid uuid)
returns table (
  registration_id uuid,
  event_id uuid,
  event_name text,
  user_id uuid,
  user_name text,
  user_email text,
  price numeric,
  status text,
  created_at timestamp
)
language sql
as $$
  select
    r.id as registration_id,
    e.id as event_id,
    e.name as event_name,
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    e.price,
    r.status,
    r.created_at
  from registrations r
  join events e on r.event_id = e.id
  join users u on r.user_id = u.id
  where e.organizer_id = organizer_uuid
    and r.status = 'confirmed'
$$;
```

4. Clique em **Run** para executar e criar a função.

---

## **Como testar**

- Após criar a função, recarregue a página do dashboard financeiro.
- Se houver inscrições confirmadas para eventos do organizador, elas aparecerão na tabela de vendas de ingressos.
- Se não aparecer nada, confira se há dados na tabela `registrations` com status `confirmed` para eventos do organizador.

---

Se aparecer algum erro ao criar a função, me envie o print ou a mensagem de erro para que eu possa te ajudar a corrigir!  
Assim que a função estiver criada, seu dashboard estará pronto para mostrar os dados reais. 