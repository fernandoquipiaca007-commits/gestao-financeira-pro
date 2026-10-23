# Como o sistema funciona (para leitura e atualização)

Referência para quem vai atualizar o sistema à mão ou por automação. Os factos vêm do código (`src/types.ts`, `src/components/modals/ClientModal.tsx`) e da documentação em `docs/`.

## 1. Estados de um projeto

O projeto tem **dois eixos separados**. Não confundir.

**Estado do projeto** (`status`) — só muda à mão:

| Estado | Significado |
|---|---|
| Em andamento | Trabalho a decorrer. É o estado por defeito. |
| Aguardando cliente | Parado à espera de algo da cliente (vídeos, acesso, pagamento). |
| Concluído | Entregue. **Nunca** passa a Concluído sozinho, mesmo pago a 100%. |
| Cancelado | Não vai avançar. |

Não existe um estado "Proposta" nem "Ativo" no sistema. Para uma proposta ainda não aceite, a prática é criar o projeto como *Aguardando cliente*, com o valor previsto.

**Pagamento** (calculado, não é um estado): o projeto está pago quando a soma das receitas recebidas cobre o valor total. Vê-se como "Já pago / Em falta" e como percentagem.

**Receitas** (`incomes`, estado por lançamento): `Pendente`, `Recebido` ou `Atrasado`. "Não pago" = receita `Pendente`.

**Arquivado** (`archived`): flag separada. Um projeto arquivado mantém o histórico, mas sai do valor a receber, dos ativos e dos alertas. Não altera o caixa.

**Tipo de cobrança** (`billingType`): `unico`, `mensal`, `trimestral` ou `anual`. Os recorrentes geram cobranças pendentes por período.

## 2. Campos obrigatórios de uma doutora (cliente) nova

No formulário, **só o nome é obrigatório** (`Nome do Cliente *`). Tudo o resto é opcional.

Recomendado para qualquer cliente nova:
- **Nome** (obrigatório)
- **Tipo / nicho** (por defeito "Desenvolvimento"; para doutoras use *Tráfego Pago*)
- **País e moeda** (por defeito Brasil e BRL)
- **WhatsApp** (usado no botão de mensagem e na ligação com o WhatsApp)
- **Origem** (ex.: "Indicação Jorge Reis — Comunidade do Euro")
- **Fase** do funil (Lead novo, Em negociação, Quase a fechar, Contrato fechado, Em execução, Recorrente, Pausado, Inativo, Perdido)
- **Próximo contacto** e **Próximo passo** (geram o alarme do painel "Contactar hoje")

## 3. O que nunca deve tocar

Estas áreas têm regras de negócio. Alterá-las sem aprovação mexe no dinheiro real.

1. **Receitas e despesas já lançadas** (`incomes`, `expenses`): não editar valores nem datas. Só o utilizador regista e corrige.
2. **Estado "Recebido" / "Pago"**: não alterar. Marcar como pago passa as receitas a recebidas e regista a diferença.
3. **Valor pago de um projeto**: não alterar. Subir o valor pago cria uma receita pela diferença.
4. **Estado "Concluído" e "Arquivado"** de projetos: só o utilizador.
5. **Reservas de caixa** (`cash_reserves`): não criar, fechar nem alterar.
6. **Distribuições e retiradas** (Caixa e sócios, categorias "Distribuição a sócios", "Retirada Própria", "Adiantamento a sócio", "Valor retido", "Comissão Parceiro"): só o utilizador. Retiradas não são custos.
7. **Percentagens dos sócios** (Definições → Sócios): nunca.
8. **Comissões de parceiros** (`commission_amount`, `commission_paid`): nunca.
9. **Histórico de alterações** (`record_history`): só leitura; é o registo de auditoria.
10. **Projetos e clientes com histórico financeiro**: não apagar. Usar "Concluído", "Cancelado" ou "Arquivar".
11. **Valores de projetos** (`total_amount`): não alterar sem o utilizador confirmar o valor.

Pode atualizar sem aprovação (campos comerciais e de acompanhamento):
- Fase, classificação, preferida, tipo de contrato, datas de contacto, próximo passo e resumo da cliente (secção **Acompanhamento comercial**).
- Tarefas e alarmes da Agenda.
- Uma linha no fim das notas do projeto.

## 4. Onde estão os dados

- Base de dados: Supabase `ixwcdkkskhcmwdopexwt` (gestao-financeira-pro).
- Não tocar em `gestao-pro-saas` (outro sistema, em produção).
- Regras financeiras: `docs/FINANCEIRO.md`.
- Acompanhamento comercial: `docs/CRM.md`.
- Integração WhatsApp (só leitura): `docs/WHATSAPP.md`.
