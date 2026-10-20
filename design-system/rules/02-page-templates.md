# Regra 02 — Modelos de página

> Todo o ecrã do sistema encaixa num destes 5 modelos. Um agente que refatora um ecrã começa por dizer **qual modelo aplica** e segue a estrutura à letra.

| Modelo | Quando | Exemplos |
|---|---|---|
| **A. Lista** | Ver, filtrar e agir sobre muitos registos | Projetos, Clientes, Transações, Tarefas |
| **B. Detalhe** | Ver tudo sobre 1 registo, com tabs | Projeto, Cliente, Utilizador |
| **C. Formulário** (criar/editar) | Criar ou editar 1 registo | Novo projeto, Editar cliente |
| **D. Definições** | Preferências agrupadas | Configurações, Perfil, Faturação |
| **E. Dashboard** | Resumo e atenção | Painel geral, Relatórios |

## Medidas comuns

- Margem lateral do conteúdo: 32px desktop · 24px tablet · 16px mobile.
- Espaço entre secções: **48px** desktop · 32px mobile. Entre campos: **24px**. Entre label e campo: 8px.
- Conteúdo alinhado **à esquerda**, dentro de um contentor de no máximo 1200px (listas e dashboards até 1440px). Nada de colunas estreitas centradas no meio de um ecrã largo.
- Cabeçalho de página: breadcrumb (12–13px) → título (h1, Outfit) → descrição opcional (1 linha) → ações à direita.

---

## A. Lista

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Projetos                                          [Exportar] [+ Novo projeto] │
│ 24 ativos · 3 com prazo esta semana                                      │
├──────────────────────────────────────────────────────────────────────────┤
│ [Todos 31] [Em andamento 24] [Concluídos 7]      🔍 Pesquisar…  [Filtros ▾] │
├──────────────────────────────────────────────────────────────────────────┤
│ ☐  Nome                 Cliente          Estado        Valor      Prazo  │
│ ☐  Dashboard Financeiro Grupo Atlântico  ● Em andamento 12 400 €  15 out │
│ ...  (clique na linha → página de Detalhe)                               │
├──────────────────────────────────────────────────────────────────────────┤
│ 1–20 de 31                                              ‹ 1 2 ›          │
└──────────────────────────────────────────────────────────────────────────┘
```
- Clicar numa linha abre a **página de Detalhe** (nunca um modal). O botão "⋯" abre menu de ações rápidas.
- Filtros numa única linha acima da tabela; o estado dos filtros fica na URL (`?estado=ativo`), para "Voltar" os manter.
- Seleção múltipla mostra uma barra de ações em massa no lugar dos filtros.
- **Mobile:** a tabela vira lista de cards (título, cliente, estado, valor); filtros vão para um bottom sheet; "+ Novo" vai para o FAB da BottomNav.

## B. Detalhe (com tabs)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Projetos › Dashboard Financeiro                                          │
│ Dashboard Financeiro Executivo em Tempo Real      [Editar] [⋯]           │
│ ● Em andamento · Grupo Atlântico · Prazo 15 out                          │
│ [Visão geral] [Finanças] [Tarefas 8] [Ficheiros 3] [Atividade]           │
├────────────────────────────────────────────┬─────────────────────────────┤
│ conteúdo da tab                             │ Resumo (sticky)             │
│                                             │ Valor total · Pago · Falta  │
│                                             │ Responsável · Datas         │
└────────────────────────────────────────────┴─────────────────────────────┘
```
- Cada tab tem a sua rota (`/projetos/:id/financas`). Recarregar a página mantém a tab.
- Coluna principal flexível + coluna de resumo de 320px (sticky). Abaixo de 1024px o resumo passa para cima, em cards horizontais.

## C. Formulário (criar / editar) — o modelo mais importante

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Projetos › Dashboard Financeiro › Editar      [Cancelar] [Guardar alterações] │  ← barra sticky
├───────────────┬──────────────────────────────────────────────────────────┤
│ Geral       ● │  Geral                                                    │
│ Clientes      │  Nome, cliente principal e estado do projeto.             │
│ Responsável   │  ┌──────────────────────────────────────────────┐         │
│ Finanças      │  │ Nome do projeto                              │         │
│ Ficheiros     │  │ [Dashboard Financeiro Executivo em Tempo Real]│        │
│ ───────────── │  │ Cliente principal      Estado                │         │
│ Zona de perigo│  │ [Grupo Atlântico ▾]    [Em andamento ▾]      │         │
│               │  └──────────────────────────────────────────────┘         │
│ (nav de       │                                                           │
│  secções,     │  Clientes participantes                                   │
│  sticky)      │  ...                                                      │
└───────────────┴──────────────────────────────────────────────────────────┘
```
- **Nav de secções** à esquerda (200–220px, sticky) com âncoras; realça a secção visível. Abaixo de 1024px desaparece e as secções ficam empilhadas.
- **Coluna do formulário: 640–760px de largura máxima**, alinhada à esquerda junto da nav. Campos curtos (moeda, estado, datas) podem ficar 2 por linha; texto longo ocupa a linha inteira.
- Cada secção: título (h3) + 1 linha de descrição + campos. Secções separadas por 48px e um divisor subtil.
- **Barra de ações sticky** no topo (desktop) ou no fundo (mobile, acima da safe-area): "Cancelar" (ghost) + "Guardar alterações" (primary). O botão fica desativado até haver alterações e mostra loading ao guardar.
- **Alterações por guardar:** sair da página (link, voltar, fechar separador) pergunta "Descartar alterações?" com as opções "Continuar a editar" e "Descartar".
- Depois de guardar: volta à página de Detalhe e mostra o toast "Projeto atualizado".
- "Zona de perigo" (arquivar, eliminar) fica sempre na última secção, separada, com botão `danger` e confirmação em modal.
- Componentes prontos: `FormPage`, `FormSection`, `SectionNav`, `ActionBar` em `components/page-templates.tsx`.

## D. Definições

Igual ao modelo C, mas cada secção guarda sozinha (botão "Guardar" por secção ou interruptores com guardar imediato + toast discreto). Navegação lateral com grupos: Conta, Empresa, Faturação, Notificações, Integrações, Segurança.

## E. Dashboard

Ver `foundations` e `patterns/dashboard.md`: saudação + 1 número herói, grelha de 12 colunas, cards de vidro, máximo 1 card `accent`. Cada card tem um destino: o "↗" leva à página de Lista ou Detalhe correspondente.

---

## Mobile (<768px) — regras transversais

- Uma coluna. Nada de 2 campos lado a lado, exceto pares muito curtos (ex.: dia / hora).
- Cabeçalho compacto: "←" + título (1 linha, truncado) + 1 ação. Ações secundárias no menu "⋯".
- Barra de ações do formulário fixa no fundo, com a ação principal a toda a largura.
- Tabs com scroll horizontal; nunca quebrar em 2 linhas.
- Alvos de toque com pelo menos 44px.
