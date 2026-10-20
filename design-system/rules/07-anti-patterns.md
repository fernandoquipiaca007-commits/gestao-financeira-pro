# Regra 07 — Anti-padrões (o que nunca pode voltar a acontecer)

> Se um ecrã corresponde a uma entrada desta lista, está errado. Corrigir antes de entregar.

## Caso de estudo: "Editar Projeto" (estado atual)

O formulário abre num modal de ~560px sobre o dashboard desfocado. Problemas encontrados:

| # | Problema | Regra violada | Correção |
|---|---|---|---|
| 1 | Formulário com 5+ secções num modal | 01 — Superfícies | Página `/projetos/:id/editar` (modelo C) |
| 2 | Nome do projeto cortado ("…em Temp") | 03 — Largura = conteúdo | Campo a toda a largura da coluna de 640–760px |
| 3 | Cliente principal cortado no select | 03 | Combobox com pesquisa, largura total |
| 4 | Grelha de clientes com scroll próprio dentro do modal com scroll | 01 — Sem scroll aninhado | Combobox múltiplo + chips, ou lista + "Adicionar cliente" |
| 5 | Três selects apertados numa linha (Categoria, Moeda, Estado) | 03 — Máx. 2 por linha | Estado na secção Geral; Moeda na secção Finanças; Categoria ao lado do nome |
| 6 | Labels em MAIÚSCULAS ("NOME DO PROJETO *") | 05 — Sentence case | "Nome do projeto" |
| 7 | Títulos longos ("Responsabilidade & Atribuição do Projeto") e instruções óbvias ("Marque se o projeto envolve múltiplos clientes") | 05 — Sem ruído | "Responsável" · sem instrução |
| 8 | Mistura pt-BR/pt-PT ("Gerencie", "arquivos" numa app com "Utilizadores") | 05 — Variante única | "Gerir", "ficheiros" |
| 9 | Ações (Guardar) fora de vista, no fundo do modal | 02 — Barra de ações sticky | Barra sticky no topo (desktop) / fundo (mobile) |
| 10 | Sem URL: recarregar ou "Voltar" perde a edição | 06 — Rotas | Rota própria + aviso de alterações por guardar |
| 11 | Avatar/mascote a flutuar por cima do conteúdo da página | 07 (abaixo) | Elementos decorativos nunca tapam conteúdo nem overlays |

### Depois (especificação)

```
/projetos/:id/editar  ·  Modelo C (Formulário)

Barra sticky: ← Projetos › Dashboard Financeiro › Editar      [Cancelar] [Guardar alterações]

Nav de secções      Coluna do formulário (máx. 720px)
─────────────       ────────────────────────────────────────────────
Geral               GERAL — "Nome, categoria e estado do projeto."
Clientes              Nome do projeto           [ largura total               ]
Responsável           Categoria [IA & Automações ▾]   Estado [Concluído ▾]
Finanças              Descrição (opcional)      [ textarea                    ]
Ficheiros
──────────          CLIENTES — "Quem paga e quem participa."
Zona de perigo        Cliente principal         [ 🔍 Grupo Atlântico — Dr. António Barreto ▾ ]
                      Outros clientes           [ 🔍 Adicionar cliente…       ]
                                                [Lucas Brandão ×] [Vanessa Costa ×]

                    RESPONSÁVEL — "Quem executa o projeto."
                      ( ) Empresa      — sem responsável direto
                      ( ) Funcionário  — atribuir a um membro   → combobox de membros
                      ( ) Disponível   — a equipa pode assumir

                    FINANÇAS
                      Moeda [EUR ▾]   Valor total [ 12 400,00 € ]
                      Já pago [ 4 000,00 € ]   (falta: 8 400,00 €, calculado)

                    FICHEIROS — zona de arrastar + lista de ficheiros

                    ZONA DE PERIGO
                      Arquivar projeto  ·  [Eliminar projeto] (danger + confirmação)

Mobile: secções empilhadas, sem nav lateral, barra de ações fixa no fundo.
```

## Catálogo geral

### Estrutura
- **Formulário grande em modal.** → Página (Regra 01).
- **Modal sobre modal / drawer sobre modal.** → Fluxo numa página, ou passos.
- **Scroll dentro de scroll.** → Expandir o conteúdo ou mudar de controlo.
- **Conteúdo estreito centrado num ecrã largo** (ex.: formulário de 480px no meio de um monitor de 1440px). → Coluna à esquerda com nav de secções, ou layout com resumo lateral.
- **Tudo dentro de cards com o mesmo peso.** → Hierarquia de cards (README, regra 3): um destaque, o resto calmo.
- **Elementos decorativos (mascotes, ilustrações flutuantes, widgets) por cima do conteúdo ou de overlays.** → Ficam no seu espaço; nunca acima de modais, sheets ou toasts.

### Interação
- **Clicar numa linha abre um modal de edição.** → Abre a página de Detalhe.
- **Ações principais escondidas no fundo de um painel com scroll.** → Barra de ações sticky.
- **Perder dados ao fechar/recarregar.** → Aviso de alterações por guardar + rota própria.
- **Botões desativados sem explicação.** → Tooltip ou texto a dizer o que falta.
- **Hover como única forma de ver uma ação** (falha no touch). → Ação visível ou no menu "⋯".

### Feedback
- **`alert()` / `confirm()` do browser.** → `Modal` de confirmação ou `useToast` (Regra 04).
- **Toast "Sucesso!" depois de cada clique.** → Só quando o resultado não está à vista.
- **Banner que pisca ao carregar ou fica preso depois de o estado mudar.** → Regra 04, banners.
- **Spinner de página inteira para recarregar dados já visíveis.** → Conteúdo antigo a 60% de opacidade.

### Texto
- **MAIÚSCULAS em labels, "&" em menus, títulos de 5 palavras.** → Regra 05.
- **Mistura de idiomas ou de variantes do português.** → Regra 05.
- **Erros técnicos visíveis.** → Mensagem humana: o que aconteceu + como resolver.

### Visual (resolvido pelo design system — não reinventar)
- Cores em hex no componente, `bg-[#…]`, overrides `!important` por tema. → Tokens.
- Sombras cinzentas pesadas, bordas grossas, 5 raios diferentes no mesmo ecrã. → Tokens de sombra e raio.
- Mais de um card `accent` por ecrã. → Um destaque.
