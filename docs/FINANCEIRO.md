# Regras financeiras do sistema

Como o CodeEngine Gestão calcula o dinheiro. Estas regras estão no código (`src/lib/finance/`) e têm testes (`npm test`).

## Saldo em caixa

```
Saldo em caixa = receitas recebidas − despesas pagas − comissões pagas a parceiros
```

- **Receitas** contam na data em que o dinheiro entrou (`received_date`).
- **Despesas pendentes** (não pagas) não saem do caixa.
- **Retiradas** ("Retirada Própria") e **distribuições a sócios** saem do caixa, mas **não são custo do negócio**: não entram nos custos, no lucro nem na margem.
- **Comissões a parceiros** (ex.: Jorge Reis como parceiro de indicação) são custo. Contam no mês em que o cliente pagou o projeto.

## Onde está o caixa

O saldo divide-se em três partes (Financeiro → Caixa e sócios):

| Parte | O que é |
|---|---|
| **Reservado** | Dinheiro que fica em caixa mas já tem destino. As reservas são escritas à mão (ex.: "Meta dos 30 mil", "Ferramentas futuras"). As despesas pagas *com* uma reserva vão-na reduzindo. |
| **Por enviar a sócios** | Partes da distribuição já calculadas mas ainda não enviadas. Continuam no caixa até serem marcadas como pagas. |
| **Livre** | O resto. É o que pode ser usado ou distribuído. |

## Projetos e pagamentos

- **Pagar não conclui o projeto.** Um projeto pago a 100% continua "Em andamento" até ser entregue; o estado só muda à mão.
- O **valor pago** de um projeto é a soma das receitas recebidas ligadas a ele.
- Aumentar o "valor pago" ao editar um projeto regista uma receita recebida pela diferença.
- "Marcar como Pago" passa as receitas pendentes a "Recebido" e regista a diferença em falta.
- Um projeto, cliente ou parceiro com histórico financeiro **não pode ser apagado**: encerra-se como "Concluído" ou "Cancelado".

- **Entrega sem data:** no projeto, marcar "Data indefinida" quando ainda não se sabe quando termina (ex.: funis). Estes projetos não geram alertas de prazo.
- **Arquivar projeto:** botão de caixa no cartão do projeto. Um projeto arquivado continua guardado (com receitas e histórico), mas sai do valor a receber, dos projetos ativos, da receita contratada, dos alertas e dos relatórios de projetos. O caixa não muda. Fica no filtro "Arquivados" e pode ser desarquivado.
- **Próximo pagamento:** só aparece enquanto falta receber; num projeto pago a 100% o campo desaparece.

## Projetos recorrentes

No projeto, escolher o **tipo de cobrança**:

| Tipo | Como funciona |
|---|---|
| **Único** | Feito de uma vez: valor total e o que já foi pago. |
| **Mensal / Trimestral / Anual** | Indica-se o valor por período e, se houver, o fim do contrato. O sistema cria sozinho uma cobrança pendente em cada período (a partir da data de início, 30 dias antes de cada vencimento) e nunca duplica nem altera uma cobrança já paga. O valor total do projeto acompanha os períodos já gerados. |

Cada cobrança marca-se como recebida no Financeiro, como qualquer receita. Projetos recorrentes arquivados, concluídos ou cancelados deixam de gerar cobranças.

## Caixa antes → depois

No Financeiro, cada receita recebida e cada despesa paga mostra por baixo do valor o caixa **antes** e **depois** desse movimento (por ordem de data; no mesmo dia, entradas antes de saídas). Os movimentos pendentes não mexem no caixa e não mostram saldo.

## Relatório Excel

Em Relatórios, escolher o **período** (atalhos como "Mês passado", "Últimos 30 dias", "Este ano", ou as datas "de … até …" no calendário) e carregar em **Exportar Excel**. O ficheiro tem quatro folhas, todas prontas a imprimir (A4, ajustadas à largura, cabeçalho repetido, páginas numeradas):

| Folha | Conteúdo |
|---|---|
| **Resumo** | Recebido, custos, comissões, lucro, margem, retiradas/sócios, saldo no início e no fim do período, onde está o caixa hoje e a tabela mês a mês com totais. Cada número tem uma explicação simples ao lado. |
| **Movimentos** | Cada entrada e saída do período, com cliente, projeto, reserva e o saldo acumulado linha a linha. Tem filtros nas colunas. |
| **Projetos** | Valor total, pago, em falta e % pago de cada projeto, com o estado a cores. |
| **Caixa e sócios** | Reservas (reservado, gasto, disponível) e distribuições aos sócios (enviado / por enviar). |

O CSV continua disponível para quem quiser os dados em bruto.

## Distribuição aos sócios

Percentagens em Definições → Sócios (têm de somar 100%):

| Sócio | % |
|---|---|
| Fernando Quipiaca | 40% |
| Jorge Reis | 40% |
| Valdimiro Grão | 20% |

Procedimento de cada lote:

1. Registar as receitas do lote.
2. Lançar os custos do lote (edição, ferramentas, taxas…).
3. Criar as reservas à mão, se houver (o valor depende de cada lote).
4. Em Financeiro → Caixa e sócios → **Registar distribuição**: escrever o valor a dividir e marcar quem já recebeu. Cada sócio fica como despesa "Distribuição a sócios"; os que ainda não receberam ficam "por enviar".
5. Quando um sócio receber, marcar a despesa dele como paga.
6. **Adiantamento a sócio:** se um sócio receber mais do que lhe cabe (ex.: um cliente paga diretamente ao sócio), regista-se **um só envio** com o valor total e, no campo "parte adiantada", quanto é a mais — essa parte é dívida dele à empresa (não é custo). Na distribuição seguinte, "Descontar no adiantamento" regista a parte dele como *compensada*: não sai dinheiro do caixa e a dívida diminui.

## Segurança dos dados

- Cada alteração ou apagamento fica guardado em `record_history`; um registo apagado pode ser reposto (`restore_deleted_record`).
- Os registos feitos diretamente na base de dados ficam em `supabase/data/` (ficheiros SQL datados), para se saber de onde veio cada valor.

Ver o histórico de lançamentos em [LIVRO_DE_CAIXA.md](LIVRO_DE_CAIXA.md).

## Projetos vinculados (ex.: a palestra de cada mês)

Em vez de duplicar um projeto, usa-se **Vincular novo projeto** (no cartão do projeto ou na página dele). O projeto novo fica ligado ao de origem (aparece em "Projetos vinculados") e copia cliente, categoria e moeda. A comissão do parceiro não é copiada.

Há duas formas de pagar o projeto novo, e podem combinar-se:

| Campo | O que faz |
|---|---|
| **Coberto pelo pagamento anterior** | Conta como já pago, **sem criar receita** e sem mexer no caixa (o dinheiro já entrou antes). |
| **Nova cobrança** (o resto do valor) | Cria uma receita **Pendente** com o que falta. Registe-a como Recebida quando o dinheiro chegar. |

Exemplo: a Dra Mirtes pagou antes duas palestras. Na palestra do mês: valor 600, coberto 600, nova cobrança 0. Fica paga no projeto, sem receita duplicada.
O "valor pago" do projeto passa a ser: receitas recebidas + parte coberta.

## Ver em outra moeda (Real, Kwanza, Dólar, Euro)

No painel, o botão da moeda no cartão **Saldo em caixa** (ex.: "BRL ▾") muda a visualização do painel, do Financeiro e dos Relatórios (incluindo o Excel). Os registos **não mudam**: continuam na moeda original. Por defeito é Real.

- Ao escolher uma moeda, o sistema vai buscar o câmbio **desse momento** (o mais recente publicado).
- **Saldo, a receber, reservas e valores pendentes**: ao câmbio de hoje (quanto valem agora).
- **Cada transação e os totais de um período** (recebido, custos, retiradas, comissões, gráficos mês a mês): ao câmbio **do dia em que aconteceram**. No Financeiro, cada linha mostra "≈ valor (câmbio de DD/MM)".

Fonte: [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) — gratuita, sem chave, tem o Kwanza e o histórico diário (desde 02/03/2024). Usa dois servidores (Cloudflare e jsDelivr); se falharem, o câmbio de hoje vem do open.er-api. O câmbio de cada dia fica guardado no navegador.

Notas:
- O câmbio é diário (não minuto a minuto): não existe fonte gratuita fiável em tempo real com Kwanza.
- É o câmbio oficial/de mercado internacional. O câmbio de rua em Angola pode ser bem diferente.

## Produtos e preços (tabela de preços)

Menu **Trabalho → Produtos e preços**. Cada plano tem: tipo (plano principal, adicional ou trabalho auxiliar), cobrança (por projeto ou mensal), faixa de preço, descrição, o que inclui, condições e **notas internas** (nunca vão para a cliente). Cada plano mostra quantos projetos saíram dele e o valor médio fechado.

Valores atuais (24/10/2026):

| Plano | Preço |
|---|---|
| Funil de Palestra | R$ 1.200 – 1.500 |
| Funil de Palestra + Edição de vídeos | R$ 1.800 – 2.500 |
| Gestão mensal de tráfego | R$ 1.500 – 2.000 / mês |
| Assessoria mensal completa (com edição) | R$ 2.000 – 2.500 / mês |
| Gestão mensal para quem já tem funil (adicional) | + R$ 1.000 / mês |
| Trabalho auxiliar (clientes parceiras) | R$ 600 – 1.000 |
| Captação direta de leads (sem palestra) | R$ 800 – 1.500 |

- **Tabela para enviar:** escolher os planos, o nome da doutora, faixa ou "a partir de", e resultados reais (anónimos). Abre uma página pronta a imprimir/guardar em PDF, ou copia o texto para o WhatsApp.
- **Novo projeto:** escolher o plano preenche o nome, o tipo de cobrança e o valor inicial; escreve-se o valor fechado e o sistema avisa se ficar fora da faixa.
