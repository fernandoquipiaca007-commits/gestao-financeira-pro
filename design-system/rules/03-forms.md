# Regra 03 — Formulários

> Um formulário bom parece curto, mesmo quando é longo: agrupa, explica pouco e nunca aperta.

## Estrutura

1. **Agrupar em secções** com título e 1 linha de descrição (ver modelo C da Regra 02). Ordem: o que identifica o registo → relações (clientes, pessoas) → dinheiro → anexos → zona de perigo.
2. **Uma coluna por defeito.** Dois campos por linha só quando ambos são curtos e relacionados (Moeda + Valor, Data início + Data fim, Estado + Prioridade). Nunca 3 por linha.
3. **Largura do campo = tamanho esperado do conteúdo.** Nome do projeto: linha inteira. Código postal: curto. Nenhum valor típico pode aparecer cortado.
4. **Sem scroll aninhado.** Listas longas dentro de um formulário são proibidas; ver "Escolher vários itens" abaixo.

## Labels e textos

- Label sempre visível, **acima do campo**, em *sentence case*: "Nome do projeto", nunca "NOME DO PROJETO".
- Obrigatórios: marca só os campos **opcionais** com "(opcional)" quando a maioria é obrigatória; caso contrário, asterisco discreto. Não misturar os dois métodos no mesmo formulário.
- Placeholder é um exemplo ("ex.: Loja online da Marta"), nunca a repetição da label nem uma instrução.
- Texto de ajuda só quando evita um erro real. Máximo 1 linha.
- Nada de rótulos ao lado com instruções óbvias (ex.: "Marque se o projeto envolve múltiplos clientes" ao lado de uma lista de clientes é ruído).

## Escolher o controlo certo

| Situação | Controlo |
|---|---|
| Sim/não com efeito imediato | `Switch` |
| Sim/não que se guarda com o formulário | `Checkbox` |
| 2–4 opções exclusivas e importantes, com explicação | **Cartões de opção** (radio cards) |
| 2–5 opções curtas | `SegmentedControl` ou radios |
| 6–15 opções | `Select` |
| Mais de 15 opções ou com pesquisa (clientes, utilizadores) | **Combobox** com pesquisa |
| Vários itens de uma lista grande | **Combobox múltiplo + chips** ou secção "lista + Adicionar" |
| Valor monetário | `MoneyInput` (moeda ao lado, alinhado à direita, teclado decimal) |
| Datas | Date picker com digitação permitida (dd/mm/aaaa) |

## Escolher vários itens (ex.: clientes participantes)

❌ Grelha de checkboxes com scroll interno (o que existe hoje no "Editar Projeto").

✅ Opção 1 — Combobox múltiplo: campo de pesquisa; os escolhidos aparecem como chips removíveis por baixo. O cliente principal aparece primeiro, com o badge "Principal".

✅ Opção 2 — Secção em lista: tabela curta dos itens escolhidos (nome, papel, ações) + botão "Adicionar cliente" que abre um combobox. Usar quando cada item tem dados próprios (papel, percentagem).

## Validação

- Validar ao sair do campo e ao submeter. Nunca mostrar erro enquanto a pessoa escreve pela primeira vez.
- A mensagem diz o que fazer: "Indique um email válido, por exemplo ana@empresa.pt". Nunca "Campo inválido" nem códigos técnicos.
- Ao submeter com erros: o foco vai para o primeiro campo com erro e a página faz scroll até ele. No topo aparece um `Alert` danger com a contagem ("2 campos precisam de atenção") e links para eles.
- Erros do servidor traduzidos para linguagem humana (ver Regra 05). O valor que a pessoa escreveu nunca se perde.

## Guardar

- Formulário de criação/edição: guardar explícito ("Criar projeto" / "Guardar alterações"). O botão principal diz exatamente o que acontece.
- Definições simples: guardar imediato com toast discreto "Preferência guardada".
- Durante o envio: botão em loading, campos bloqueados, nada salta de lugar.
- Proteção de saída quando há alterações por guardar (Regra 02, modelo C).
- Duplo clique não cria dois registos: o botão fica desativado até a resposta chegar.

## Valores por defeito

Preencher o que se sabe: moeda da empresa, responsável = utilizador atual, data = hoje, estado inicial do domínio. Menos campos para preencher = mais registos criados.
