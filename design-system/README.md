# Aura Design System — CodeEngine Manager

Design system próprio do CodeEngine Manager. Inspirado em duas referências do Dribbble (Finexy, de Sujon Hossain, e Crextio, de Nixtio), com identidade própria: **vidro fosco sobre um canvas translúcido prata → champanhe**, botões "Ink 3D" em preto quente, **Ember** (laranja) como cor de marca e **Citrine** (amarelo) como destaque de dados.

> **Para agentes de IA:** lê este ficheiro e depois o [`AGENTS.md`](AGENTS.md) antes de criar ou alterar UI. As regras são obrigatórias.

O sistema tem duas camadas:
1. **Visual** (tokens, CSS, componentes, motion): como as coisas se parecem.
2. **Regras de produto** (`rules/`): como as coisas aparecem e onde estão — que superfície usar, modelos de página, formulários, notificações, textos, rotas. É esta camada que impede ecrãs apertados em modais, textos sem sentido e notificações repetidas.

## Estrutura

| Pasta / ficheiro | Conteúdo |
|---|---|
| `AGENTS.md` | Manual para agentes: ordem de leitura, decisões obrigatórias, protocolo de refatoração, checklist do PR |
| `rules/01-surfaces.md` | Página vs drawer vs modal vs popover vs inline (limites rígidos) + mapa de migração dos 14 modais atuais |
| `rules/02-page-templates.md` | Os 5 modelos de página (Lista, Detalhe, Formulário, Definições, Dashboard), desktop e mobile |
| `rules/03-forms.md` | Estrutura, labels, escolha de controlos, multi-seleção, validação, guardar |
| `rules/04-notifications-feedback.md` | Hierarquia de feedback, toasts, banners, centro de notificações, push, confirmações, loading |
| `rules/05-ux-writing.md` | Escrita da interface, variante pt-PT, glossário, erros, estados vazios, números |
| `rules/06-navigation-routing.md` | Rotas de todo o sistema, URL como estado, navegação desktop/tablet/mobile, atalhos |
| `rules/07-anti-patterns.md` | O que nunca pode acontecer, com o "Editar Projeto" como caso de estudo (antes → depois) |
| `tokens/tokens.css` | Fonte única de verdade: primitivos, semânticos claro ("Champagne Glass") e escuro ("Obsidian Glass"), tipografia, espaçamento, raios, sombras, blur, motion, z-index, layout |
| `tokens/tailwind.theme.css` | Mapeamento Tailwind v4 (`@theme inline`): `bg-surface-1`, `text-fg-muted`, `rounded-xl`, `shadow-glass`, `font-display`… |
| `styles/aura.css` | Classes `.aura-*` de todos os componentes (CSS puro, serve HTML e React) |
| `motion/motion.ts` | Durações, curvas, springs e variantes para `motion/react` |
| `components/*.tsx` | Biblioteca React: primitives, surfaces, forms, navigation, feedback, overlays, page-templates (`index.ts` exporta tudo) |

## Como aplicar no sistema

Em `src/index.css`, substituir os tokens antigos ("Boro UI") por:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Inter:opsz,wght@14..32,400..700&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";
@import "../design-system/tokens/tokens.css";
@import "../design-system/tokens/tailwind.theme.css";
@import "../design-system/styles/aura.css" layer(components); /* utilities Tailwind (hidden, md:flex…) vencem */
```

Depois, envolver a área autenticada em `<AuroraBackground>` e `<ToastProvider>` (de `components/`). O tema escuro continua a ser ativado por `html.dark` (já é o que o `ThemeContext` faz).

## Regras obrigatórias

1. **Só tokens.** Nunca hex/rgb em componentes nem classes como `bg-[#f1edec]`. Usa `var(--surface-2)` ou `bg-surface-2`.
2. **Fundo:** toda a área autenticada usa o `AuroraBackground` (canvas translúcido + aurora + grão). Cards nunca têm fundo opaco por defeito: usam `GlassCard` (`tone="glass"`).
3. **Hierarquia de cards:** `glass` (padrão) · `strong` (tabelas densas, modais) · `inverse` (1 foco escuro, ex.: tarefas) · `accent` (**máx. 1 por ecrã**, o KPI principal) · `highlight` (progresso/conquistas).
4. **Botões:** 1 `primary` ou `accent` por zona de ação; rótulo = verbo + objeto ("Criar fatura"). Botão só-ícone tem `aria-label`.
5. **Tipografia:** Outfit para display, títulos e números grandes (peso 300–500). Inter para UI e texto. JetBrains Mono para IDs e nº de fatura. `tabular-nums` só em colunas de números.
6. **Números:** KPIs animam com `NumberFlow` (`StatCard`). Um único número herói por ecrã.
7. **Estado nunca só por cor:** `Delta` tem seta, `Status` tem texto, alertas têm ícone. Usa o mapa `DOMAIN_STATUS` para estados do domínio.
8. **Motion:** usa só os presets de `motion/motion.ts`. Entradas com `stagger()` + `fadeUp`; overlays com `modal`/`sheet`/`drawer`. Tudo respeita `prefers-reduced-motion`.
9. **Responsivo:** desktop ≥1024 (rail + pill-nav), tablet 768–1023, mobile <768 (topbar + `BottomNav` com FAB). Em mobile o `Modal` vira bottom-sheet sozinho. Toque mínimo de 44px.
10. **Acessibilidade:** foco visível (`--focus-ring`), labels visíveis em todos os campos, contraste AA, Esc fecha overlays.
11. **Estrutura antes de estilo:** formulários com mais de 4 campos têm página própria (`rules/01`), com o modelo de página certo (`rules/02`). Nunca apertar conteúdo num modal.

## Estado

Pronto: tokens (claro e escuro), Tailwind, CSS de todos os componentes, motion, 7 módulos React (incluindo modelos de página), as 7 regras de produto e o showcase visual.

**Showcase:** `showcase/index.html` abre diretamente no browser e mostra todos os componentes com o CSS real. As fontes estão em `showcase/src/`; depois de alterar tokens ou `aura.css`, correr `bash design-system/showcase/build.sh` para regenerar.

Em falta: componentes React de dados e gráficos (Table, ListItem, Combobox múltiplo, temas Recharts), AppShell React e documentação por fundação (`foundations/`).
