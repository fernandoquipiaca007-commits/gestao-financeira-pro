# Regra 05 — Escrita da interface

> As palavras são parte do design. Um texto que não ajuda a pessoa a decidir ou a agir não aparece.

## Princípios

1. **Do lado de quem usa.** Nomes que a pessoa reconhece ("Notificações"), não como o sistema está construído ("Webhooks de eventos").
2. **Curto e concreto.** "Guardar alterações", não "Clique aqui para guardar as suas alterações".
3. **Um texto, uma função.** Se o título já diz, o subtítulo não repete.
4. **Sem ruído:** nada de frases de marketing dentro da app ("Gerencie tudo com poder total!"), nada de instruções óbvias, nada de exclamações nem emojis.

## Variante de português: pt-PT (padrão)

A app já usa "Utilizadores", "Registo", "Equipa": a variante oficial é **português europeu**, que também é a norma em Angola e Moçambique. Não misturar com pt-BR no mesmo idioma. Cada idioma da app (`LanguageContext`) é coerente consigo mesmo.

| Usar (pt-PT) | Não usar (pt-BR) |
|---|---|
| Utilizador | Usuário |
| Ficheiro | Arquivo |
| Gerir | Gerenciar |
| Faturação | Faturamento |
| Equipa | Equipe |
| Registo | Registro |
| Ecrã | Tela |
| Definições | Configurações* |
| Guardar | Salvar |
| Eliminar | Excluir / Deletar |
| Telemóvel | Celular |

\* "Configurações" é aceitável se já estiver em uso em toda a app; o que não pode é ter os dois.

## Glossário do produto (um nome por conceito)

| Conceito | Nome único | Evitar |
|---|---|---|
| Entrada de dinheiro | Receita | Income, entrada, recebimento (como substantivo) |
| Saída de dinheiro | Despesa | Gasto, custo, saída |
| Pedido para faturar | Pedido de faturação | Billing request, solicitação |
| Pessoa/empresa que paga | Cliente | Conta, contacto (quando é cliente) |
| Trabalho com prazo e valor | Projeto | Job, operação |
| Unidade de trabalho | Tarefa | Entrega, to-do |
| Quem usa a app | Utilizador | Membro, colaborador (exceto no contexto de cargos) |

## Navegação

- Rótulos de 1–2 palavras, sem "&": "Projetos", "Tarefas", "Clientes", "Financeiro", "Relatórios", "Agenda", "Parceiros", "Utilizadores", "Auditoria", "Ajuda", "Definições".
- O título da página é igual ao rótulo da navegação que lá levou.

## Botões e ações

- Verbo + objeto: "Criar projeto", "Enviar fatura", "Exportar CSV".
- O botão de confirmação de um modal repete a ação do título ("Eliminar cliente?" → "Eliminar cliente").
- Nunca "OK", "Sim/Não", "Submeter", "Clique aqui".

## Títulos e descrições

- Título de página: o objeto ("Editar projeto"). Descrição só se acrescentar contexto útil — ex.: "Alterações visíveis para a equipa" — e no máximo 1 linha.
- Títulos de secção curtos: "Clientes", "Responsável", "Finanças". Sem "Responsabilidade & Atribuição do Projeto".
- Contagens no próprio rótulo quando úteis: "Tarefas 8".

## Mensagens de erro

Formato: **o que aconteceu + como resolver.**
- ✅ "Não foi possível guardar. Verifique a ligação à internet e tente novamente."
- ✅ "Este email já pertence a outro utilizador. Use outro email ou convide essa pessoa."
- ❌ "Erro 500", "Something went wrong", "duplicate key value violates unique constraint".

## Estados vazios

Formato: **o que vai aparecer aqui + como começar.**
- Título: "Ainda não há despesas este mês"
- Descrição: "Registe a primeira despesa para acompanhar a margem dos projetos."
- Ação: "Registar despesa"

## Números, datas e moeda

- Moeda com `Intl.NumberFormat` e o símbolo da moeda do registo: `12 400,00 €`, `Kz 1 250 000`, `US$ 3 200`.
- Valores grandes em cards podem compactar: `12,4 mil €`, `1,2 M Kz`. Em tabelas, valor completo.
- Datas: "15 out 2026" em listas; "15 de outubro de 2026" em documentos; relativas ("há 5 min", "ontem") em atividade e notificações.
- Percentagens com o período: "+5% vs. mês anterior".

## Proibido

- Texto em MAIÚSCULAS para labels ou títulos (exceto *overline* de 11px com espaçamento, usado com moderação).
- Termos técnicos fora das áreas técnicas (MCP, API key, webhook só em "Integrações").
- Texto de debug, IDs internos ou chaves de tradução visíveis (`nav.projects`).
- Frases que mudam de idioma a meio.
