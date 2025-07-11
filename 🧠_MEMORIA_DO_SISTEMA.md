# MEMÓRIA DO SISTEMA

## Visão Geral
Este sistema é uma plataforma para gestão de eventos, inscrições, vendas de ingressos, stands e controle financeiro para organizadores e participantes.

## Regras de Negócio Importantes
- O identificador principal de usuário é `user_id` (não o e-mail).
- Taxas de serviço são calculadas por faixa de preço do ingresso, não por plano.
- Cada inscrição aprovada gera uma taxa de serviço registrada na tabela `organizer_taxa`.
- O organizador pode visualizar extratos, vendas, taxas pendentes e realizar pagamentos pelo painel financeiro.

## Principais Tabelas e Relacionamentos
- **users**: armazena dados dos usuários (participantes e organizadores).
- **events**: eventos criados por organizadores. Relacionamento: `events.organizer_id` → `users.id`.
- **registrations**: inscrições dos participantes nos eventos.
- **organizer_taxa**: taxas de serviço geradas por inscrições aprovadas. Relacionamentos:
  - `organizer_taxa.event_id` → `events.id`
  - `organizer_taxa.organizer_id` → `users.id`
  - `organizer_taxa.user_id` → `users.id` (participante)

## Funções SQL/RPC Importantes
- **get_organizer_ticket_sales(organizer_uuid uuid)**: retorna vendas de ingressos dos eventos do organizador.
- **get_organizer_service_fees(p_organizer_id uuid)**: retorna o extrato de taxas de serviço do organizador.

## Decisões Técnicas
- O sistema utiliza Supabase como backend e banco de dados.
- Todas as funções SQL/RPC relevantes estão (ou devem estar) versionadas em arquivos `.sql` no repositório.
- O frontend consome as funções RPC para exibir dados financeiros e extratos.

## Exemplos de Uso das Funções
```js
// Buscar vendas de ingressos
const { data: ticketSales } = await supabase.rpc('get_organizer_ticket_sales', { organizer_uuid: user.id });

// Buscar extrato de taxas de serviço
const { data: serviceFees } = await supabase.rpc('get_organizer_service_fees', { p_organizer_id: user.id });
```

## Histórico de Mudanças Relevantes
- [2024-06] Implementada função get_organizer_service_fees para extrato de taxas de serviço.
- [2024-06] Padronização do uso de user_id como identificador principal.
- [2024-06] Removida dependência de planos para cálculo de taxas de serviço.

---

> **Mantenha este arquivo atualizado sempre que houver mudanças importantes no sistema, regras de negócio ou funções SQL/RPC.** 