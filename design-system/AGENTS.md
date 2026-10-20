# AGENTS.md — Como um agente de IA trabalha com o Aura

> Instruções obrigatórias para qualquer agente que crie, altere ou refatore interface no CodeEngine Manager. Em caso de conflito: pedido explícito do fundador > estas regras > preferências do agente.

## 1. Ordem de leitura (antes de escrever código)

1. `README.md` — identidade, estrutura e 10 regras visuais.
2. `rules/01-surfaces.md` — página, drawer, modal, popover ou inline.
3. `rules/02-page-templates.md` — os 5 modelos de página.
4. A regra do tema da tarefa: `03-forms`, `04-notifications-feedback`, `05-ux-writing`, `06-navigation-routing`.
5. `rules/07-anti-patterns.md` — o que nunca pode voltar a acontecer.
6. `components/` e `styles/aura.css` — reutilizar antes de criar.

## 2. Decisões que o agente tem de escrever antes de codificar

Para cada ecrã tocado, responder por escrito (na descrição do PR ou na resposta):

```
Ecrã:         Editar projeto
Superfície:   Página (Regra 01: 5 secções, valores monetários, ficheiros)
Modelo:       C — Formulário
Rota:         /projetos/:id/editar
Secções:      Geral · Clientes · Responsável · Finanças · Ficheiros · Zona de perigo
Componentes:  FormPage, FormSection, ActionBar, Input, Combobox múltiplo, MoneyInput, Modal (confirmar eliminação)
Mobile:       secções empilhadas, ActionBar no fundo
Feedback:     toast "Projeto atualizado" ao guardar; erros inline; confirmação só para eliminar
```

Se alguma resposta contradiz uma regra, a regra ganha. Exceções só com pedido explícito do fundador.

## 3. Protocolo de refatoração de um ecrã existente

1. **Auditar:** abrir o ecrã, listar cada violação com o número da regra (formato da tabela do caso de estudo em `rules/07-anti-patterns.md`).
2. **Classificar:** escolher superfície e modelo de página.
3. **Mapear dados:** listar campos e agrupá-los em secções (ordem da Regra 03).
4. **Construir com o sistema:** componentes de `design-system/components`, classes `.aura-*`, tokens. Zero hex, zero `!important`, zero `bg-[#…]`.
5. **Rever textos** com a Regra 05 (variante pt-PT, glossário, sentence case).
6. **Ligar feedback** com a Regra 04 (sem `alert`/`confirm`, toasts só quando necessários, sem duplicados).
7. **Testar** desktop 1440, tablet 820, mobile 390, tema claro e escuro, teclado (Tab, Esc, ⌘S) e `prefers-reduced-motion`.
8. **Remover** o código antigo (modal substituído, CSS de override) no mesmo PR. Nada de duas versões a conviver.

## 4. Ordem recomendada da migração do sistema

1. Fundação: importar tokens + `aura.css` no `src/index.css`; `AuroraBackground` + `ToastProvider` na raiz; remover os overrides "Boro UI" por tema.
2. Rotas: introduzir React Router com as rotas da Regra 06; `App.tsx` passa a ser só o shell.
3. Substituir os 30 `alert()`/`confirm()` por `useToast` e `Modal` de confirmação.
4. Converter os modais grandes em páginas, por esta ordem: `ProjectModal` → `ClientModal` → `IncomeModal` / `ExpenseModal` → `BillingRequestModal` → `UserModal` + `UserPermissionsModal` → `TaskModal` → `PartnerModal` → `SendEmailModal`.
5. Listas (modelo A) com filtros na URL; detalhes (modelo B) com tabs em rota.
6. Dashboard (modelo E) com o novo visual.
7. Revisão final de textos (Regra 05) em todo o `LanguageContext`.

## 5. Definição de pronto (checklist do PR)

**Estrutura**
- [ ] Superfície correta (Regra 01); nenhum formulário com mais de 4 campos em modal.
- [ ] Modelo de página aplicado (Regra 02); conteúdo alinhado à esquerda, sem colunas estreitas centradas.
- [ ] Ecrã com rota própria; "Voltar" e recarregar mantêm o estado (Regra 06).
- [ ] Sem scroll aninhado, sem overlay sobre overlay.

**Formulários**
- [ ] Labels visíveis em sentence case; nenhum valor típico cortado.
- [ ] Máx. 2 campos por linha; 1 no mobile.
- [ ] Validação inline com mensagem que diz como corrigir; foco no 1º erro.
- [ ] Barra de ações sticky; aviso de alterações por guardar.

**Feedback e texto**
- [ ] Zero `alert`/`confirm`/`prompt`.
- [ ] Toasts só quando o resultado não está visível; sem duplicados; texto "o quê + em quê".
- [ ] Banners sem piscar e sem ficar presos.
- [ ] Textos em pt-PT, glossário respeitado, sem MAIÚSCULAS, sem "&" na navegação, sem jargão técnico.

**Visual e acessibilidade**
- [ ] Só tokens e componentes do Aura; tema claro e escuro corretos.
- [ ] Foco visível; navegação completa por teclado; alvos de toque ≥ 44px.
- [ ] Contraste AA; estado nunca só por cor.
- [ ] Animações só dos presets; respeita `prefers-reduced-motion`.
- [ ] Testado em 1440 / 820 / 390.

## 6. Quando o sistema não cobre um caso

Não inventar um padrão novo dentro de um ecrã. Primeiro propor o padrão (problema, superfície, componente, exemplo), adicioná-lo ao design system (`components/` + `rules/`), e só depois usá-lo.
