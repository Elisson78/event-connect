# MEMÓRIA DO SISTEMA

## Visão Geral
Este sistema é uma plataforma para gestão de eventos, inscrições, vendas de ingressos, stands e controle financeiro para organizadores e participantes.

## Regras de Negócio Importantes
- O identificador principal de usuário é `user_id` (não o e-mail).
- Taxas de serviço são calculadas por faixa de preço do ingresso, não por plano.
- Cada inscrição aprovada gera uma taxa de serviço registrada na tabela `organizer_taxa`.
- O organizador pode visualizar extratos, vendas, taxas pendentes e realizar pagamentos pelo painel financeiro.
- **Sistema de Stands**: Stands podem ser reservados por participantes e requerem pagamento para confirmação.
- **Pagamentos de Stands**: Participantes fazem upload de comprovantes que são aprovados/rejeitados pelos organizadores.

## Principais Tabelas e Relacionamentos

### Tabelas Existentes
- **users**: armazena dados dos usuários (participantes e organizadores).
- **events**: eventos criados por organizadores. Relacionamento: `events.organizer_id` → `users.id`.
- **registrations**: inscrições dos participantes nos eventos.
- **organizer_taxa**: taxas de serviço geradas por inscrições aprovadas. Relacionamentos:
  - `organizer_taxa.event_id` → `events.id`
  - `organizer_taxa.organizer_id` → `users.id`
  - `organizer_taxa.user_id` → `users.id` (participante)

### Novas Tabelas - Sistema de Stands
- **event_stands**: stands disponíveis para cada evento. Relacionamentos:
  - `event_stands.event_id` → `events.id`
  - `event_stands.user_id` → `users.id` (participante que reservou)
- **stand_payments**: pagamentos dos stands. Relacionamentos:
  - `stand_payments.stand_id` → `event_stands.id`
  - `stand_payments.user_id` → `users.id` (participante que pagou)
  - `stand_payments.event_id` → `events.id`

### Status dos Stands
- **"Disponível"**: stand não reservado
- **"Reservado"**: stand reservado por participante, aguardando pagamento
- **"Vendido"**: stand reservado e pagamento aprovado

### Status dos Pagamentos
- **"pendente"**: aguardando upload de comprovante
- **"em_analise"**: comprovante enviado, aguardando aprovação
- **"pago"**: pagamento aprovado pelo organizador
- **"rejeitado"**: pagamento rejeitado pelo organizador

### Sincronização Automática de Status
- **Stand → "vendido"**: pagamento automaticamente atualizado para "pago"
- **Stand → "reservado"**: pagamento automaticamente atualizado para "em_analise" (se estava "pago")
- **Stand → "disponivel"**: status do pagamento permanece inalterado

## Funções SQL/RPC Importantes

### Funções Existentes
- **get_organizer_ticket_sales(organizer_uuid uuid)**: retorna vendas de ingressos dos eventos do organizador.
- **get_organizer_service_fees(p_organizer_id uuid)**: retorna o extrato de taxas de serviço do organizador.

### Novas Funções - Sistema de Stands
- **get_organizer_stand_sales(p_organizer_id uuid)**: retorna todas as vendas de stands dos eventos do organizador.
- **get_organizer_stands_summary(p_organizer_id uuid)**: retorna resumo financeiro dos stands (total vendido, total pendente, etc.).

## Fluxos Implementados

### Fluxo do Participante
1. Participante reserva stand no evento
2. Sistema cria registro em `event_stands` com status "Reservado"
3. Sistema cria registro em `stand_payments` com status "pendente"
4. Participante faz upload de comprovante de pagamento
5. Status do pagamento muda para "em_analise"
6. Organizador aprova/rejeita o pagamento
7. Se aprovado: status do stand muda para "Vendido" e pagamento para "pago"

### Fluxo do Organizador
1. Organizador visualiza stands reservados no formulário do evento
2. Organizador visualiza pagamentos pendentes no painel financeiro
3. Organizador aprova/rejeita pagamentos
4. **Sincronização Automática**: Ao mudar status do stand para "vendido", pagamento automaticamente vira "pago"
5. **Sincronização Automática**: Ao mudar status do stand para "reservado", pagamento automaticamente vira "em_analise"

## Interface e Componentes

### Dashboard do Participante
- **ParticipantFinances.jsx**: mostra pagamentos pendentes e permite upload de comprovantes
- **ParticipantMyEvents.jsx**: mostra stands reservados pelo participante

### Dashboard do Organizador
- **OrganizerFinances.jsx**: painel financeiro com 6 cards organizados em 2x3:
  - Vendas de Ingressos
  - Taxas de Serviço
  - Vendas de Stands
  - Total Geral
  - Pagamentos Pendentes
  - Receita Líquida
- **OrganizerEventForm.jsx**: formulário do evento com aba "Status dos Stands"

### Modal de Pagamento
- Permite upload de comprovante
- Mostra métodos de pagamento ativos
- Validação de arquivo (PDF, JPG, PNG)
- Feedback visual do status do upload

## Decisões Técnicas
- O sistema utiliza Supabase como backend e banco de dados.
- Todas as funções SQL/RPC relevantes estão versionadas em arquivos `.sql` no repositório.
- O frontend consome as funções RPC para exibir dados financeiros e extratos.
- **Layout Financeiro**: Cards organizados em 2 linhas de 3 cards cada para melhor legibilidade.
- **Sincronização Automática**: Status de stands e pagamentos sempre sincronizados via lógica de aplicação no `handleSaveStandsStatus`.
- **Atualização em Tempo Real**: Função `getEventStands` ordena pagamentos por data para sempre pegar o mais recente.

## Exemplos de Uso das Funções
```js
// Buscar vendas de ingressos
const { data: ticketSales } = await supabase.rpc('get_organizer_ticket_sales', { organizer_uuid: user.id });

// Buscar extrato de taxas de serviço
const { data: serviceFees } = await supabase.rpc('get_organizer_service_fees', { p_organizer_id: user.id });

// Buscar vendas de stands
const { data: standSales } = await supabase.rpc('get_organizer_stand_sales', { p_organizer_id: user.id });

// Buscar resumo de stands
const { data: standsSummary } = await supabase.rpc('get_organizer_stands_summary', { p_organizer_id: user.id });
```

## Histórico de Mudanças Relevantes
- [2024-06] Implementada função get_organizer_service_fees para extrato de taxas de serviço.
- [2024-06] Padronização do uso de user_id como identificador principal.
- [2024-06] Removida dependência de planos para cálculo de taxas de serviço.
- **[2024-12] SISTEMA DE STANDS COMPLETO IMPLEMENTADO:**
  - Tabelas `event_stands` e `stand_payments` criadas
  - Fluxo completo de reserva → pagamento → aprovação
  - Modal de upload de comprovantes funcionando
  - Dashboard financeiro organizado em layout 2x3
  - Funções RPC `get_organizer_stand_sales` e `get_organizer_stands_summary` criadas
  - Interface sincronizada entre participante e organizador
  - Status de stands e pagamentos sempre alinhados
  - **SINCRONIZAÇÃO AUTOMÁTICA IMPLEMENTADA**: Mudança de status do stand automaticamente atualiza status do pagamento
  - **DEPLOY READY**: Sistema completo e testado para produção

---

> **Mantenha este arquivo atualizado sempre que houver mudanças importantes no sistema, regras de negócio ou funções SQL/RPC.** 