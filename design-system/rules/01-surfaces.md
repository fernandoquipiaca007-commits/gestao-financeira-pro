# Regra 01 — Que superfície usar (página, drawer, modal, popover, inline)

> Regra-mãe do sistema. Antes de criar qualquer ecrã de criação, edição ou detalhe, decide a superfície com esta tabela. **Na dúvida, é uma página.**

## Princípio

Uma tarefa tem o espaço que a sua complexidade pede. Formulários com secções, listas, ficheiros ou dinheiro **nunca** vivem numa janela flutuante. Têm a sua própria página, com URL, espaço para respirar e um botão "Voltar" que funciona. É assim que fazem a Stripe, a Linear e o Notion.

## Árvore de decisão

```
A tarefa tem mais de 4 campos? ─────────────── sim → PÁGINA
        │ não
Tem secções, listas, tabelas, upload ou valores monetários? ── sim → PÁGINA
        │ não
O utilizador precisa de ver a lista por trás enquanto trabalha?
        │ sim → DRAWER (consultar/editar 1 registo leve, ≤ 4 campos)
        │ não
É uma confirmação, uma decisão ou 1–3 campos rápidos? ── sim → MODAL pequeno
        │ não
É escolher 1 valor de uma lista curta / ações sobre um item? ── sim → POPOVER / MENU
        │ não
É mudar 1 valor que já está à vista (nome, estado, data)? ── sim → EDIÇÃO INLINE
```

## Limites rígidos

| Superfície | Pode conter | Não pode conter | Largura |
|---|---|---|---|
| **Página** | Qualquer coisa: secções, tabs, tabelas, uploads, histórico | — | Layout completo (ver Regra 02) |
| **Drawer** | Detalhe de 1 registo, ≤ 4 campos editáveis, timeline curta | Secções múltiplas, tabelas, scroll aninhado, outro overlay | 420–480px |
| **Modal** | Confirmação, decisão, 1–3 campos (ex.: "Renomear", "Convidar por email") | Scroll interno, grelhas de checkboxes, tabs, mais de 1 coluna de campos | 440–560px |
| **Popover / Menu** | Lista de ações, seletor de 1 valor, filtros rápidos | Formulários | 220–320px |
| **Inline** | 1 campo, guarda ao sair (blur/Enter), Esc cancela | Validações complexas | Igual ao texto |

**Proibido em qualquer superfície:**
- Modal dentro de modal (ou drawer sobre modal).
- Área com scroll dentro de uma área com scroll (*nested scroll*). Exceção única: tabelas largas com scroll horizontal.
- Texto cortado em inputs de uso normal (ex.: um nome de projeto típico tem de caber por inteiro no campo).
- `window.alert()`, `window.confirm()`, `window.prompt()`. Usar `Modal` de confirmação, `useToast` ou `Alert`.

## Mapa de migração do sistema atual

Os 14 modais de `src/components/modals/` passam a ter esta superfície:

| Atual | Linhas | Destino | Rota |
|---|---|---|---|
| `ProjectModal` | 738 | **Página** criar/editar com secções | `/projetos/novo` · `/projetos/:id/editar` |
| `ExpenseModal` | 424 | **Página** | `/financeiro/despesas/nova` · `/financeiro/despesas/:id` |
| `BillingRequestModal` | 370 | **Página** | `/faturacao/pedidos/novo` · `/faturacao/pedidos/:id` |
| `UserModal` | 330 | **Página** | `/utilizadores/novo` · `/utilizadores/:id` |
| `TaskModal` | 320 | **Página** (detalhe com comentários) | `/tarefas/:id` |
| `SendEmailModal` | 314 | **Página** (compositor) | `/clientes/:id/email` |
| `IncomeModal` | 290 | **Página** | `/financeiro/receitas/nova` · `/financeiro/receitas/:id` |
| `ClientModal` | 286 | **Página** | `/clientes/novo` · `/clientes/:id/editar` |
| `AgendaModal` | 260 | **Drawer** (evento) a partir do calendário | `/agenda?evento=:id` |
| `UserPermissionsModal` | 224 | **Página**, tab "Permissões" do utilizador | `/utilizadores/:id/permissoes` |
| `PartnerModal` | 190 | **Página** | `/parceiros/novo` · `/parceiros/:id` |
| `CategoryModal` | 176 | **Modal pequeno** (nome + cor + tipo = 3 campos) | — |
| `PlanLockedModal` | 98 | **Modal** de decisão ("Fazer upgrade" / "Agora não") | — |
| `SubscriptionModal` | 47 | **Modal** de decisão | — |

Regra para novos ecrãs: se não está nesta tabela, aplica a árvore de decisão acima.

## Criação rápida (exceção controlada)

Pode existir uma **criação rápida** em modal pequeno (ex.: "Nova tarefa" com título + responsável) desde que:
1. tenha no máximo 3 campos;
2. tenha um link "Abrir formulário completo" que leva à página;
3. depois de criar, mostre um toast com a ação "Abrir" para o registo.
