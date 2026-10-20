# Regra 06 — Navegação e rotas

> Cada ecrã, cada registo e cada tab tem o seu endereço. Copiar o URL e abri-lo noutro separador mostra exatamente o mesmo ecrã.

## Situação atual

A app troca de ecrã com estado (`activeView` em `src/App.tsx`, ~2400 linhas) e abre formulários em modais. Consequências: o botão "Voltar" do browser sai da app, não há links partilháveis, recarregar perde o contexto e o `App.tsx` concentra tudo.

## Alvo

Usar **React Router** (v7, modo biblioteca) com rotas aninhadas e carregamento preguiçoso por módulo (`lazy`).

```
/                          → Painel geral (Dashboard)
/agenda                    → Agenda (evento abre em drawer: ?evento=:id)
/projetos                  → Lista
/projetos/novo             → Formulário (criar)
/projetos/:id              → Detalhe › Visão geral
/projetos/:id/financas     → Detalhe › Finanças
/projetos/:id/tarefas      → Detalhe › Tarefas
/projetos/:id/ficheiros    → Detalhe › Ficheiros
/projetos/:id/atividade    → Detalhe › Atividade
/projetos/:id/editar       → Formulário (editar)
/tarefas · /tarefas/:id
/clientes · /clientes/novo · /clientes/:id · /clientes/:id/editar · /clientes/:id/email
/financeiro                → Transações (tabs: receitas, despesas)
/financeiro/receitas/nova · /financeiro/receitas/:id
/financeiro/despesas/nova · /financeiro/despesas/:id
/faturacao · /faturacao/pedidos/novo · /faturacao/pedidos/:id
/parceiros · /parceiros/novo · /parceiros/:id
/relatorios · /relatorios/:tipo
/utilizadores · /utilizadores/novo · /utilizadores/:id · /utilizadores/:id/permissoes
/auditoria · /ajuda · /ajuda/:artigo
/definicoes/:secao         → conta, empresa, faturacao, notificacoes, integracoes, seguranca
/planos
```

Slugs em pt-PT, minúsculas, sem acentos, hífen entre palavras.

## Regras

1. **Estado partilhável vai para a URL:** tab ativa, filtros, ordenação, página da tabela, pesquisa, registo aberto em drawer. Estado efémero (hover, menu aberto) fica em memória.
2. **"Voltar" funciona sempre** e devolve a pessoa ao estado anterior (mesma tab, mesmos filtros, mesma posição de scroll).
3. **Depois de criar:** ir para o Detalhe do registo criado (`replace`, para "Voltar" não regressar ao formulário vazio). **Depois de editar:** voltar ao Detalhe. **Cancelar:** voltar à página de origem.
4. **Breadcrumb** em Detalhe e Formulário: `Projetos › Dashboard Financeiro › Editar`. Cada nível é um link.
5. **Título do separador do browser** = `Página · CodeEngine Manager` (ex.: "Editar projeto · CodeEngine Manager").
6. **Permissões na rota:** uma rota sem permissão mostra um ecrã "Sem acesso" com a explicação e quem contactar, nunca uma página em branco nem um redirect silencioso.
7. **404 com saída:** "Esta página não existe" + links para o Painel e para a pesquisa.
8. **Transição entre páginas:** variante `page` de `motion/motion.ts` (fade + 10px). Sem transições laterais tipo app nativa no desktop.

## Navegação global

- **Desktop ≥1024:** rail lateral com os módulos (ícone + tooltip) e pill-nav no topo com as secções do módulo atual. Pesquisa global e ⌘K na topbar.
- **Tablet 768–1023:** rail lateral; a pill-nav vira tabs com scroll.
- **Mobile <768:** BottomNav com 4 destinos (Painel, Projetos, Financeiro, Mais) + FAB "Criar". "Mais" abre um sheet com os restantes módulos.
- O módulo ativo está sempre identificado (rail, BottomNav e título).

## Atalhos de teclado (desktop)

| Atalho | Ação |
|---|---|
| ⌘K / Ctrl K | Pesquisa e comandos |
| C | Criar (no contexto do módulo) |
| E | Editar o registo aberto |
| ⌘S / Ctrl S | Guardar o formulário |
| Esc | Fechar overlay / cancelar edição inline |
| G depois P / C / F | Ir para Projetos / Clientes / Financeiro |

Os atalhos aparecem nos tooltips e no menu ⌘K.
