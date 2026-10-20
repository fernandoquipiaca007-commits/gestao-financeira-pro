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

## Segurança dos dados

- Cada alteração ou apagamento fica guardado em `record_history`; um registo apagado pode ser reposto (`restore_deleted_record`).
- Os registos feitos diretamente na base de dados ficam em `supabase/data/` (ficheiros SQL datados), para se saber de onde veio cada valor.

Ver o histórico de lançamentos em [LIVRO_DE_CAIXA.md](LIVRO_DE_CAIXA.md).
