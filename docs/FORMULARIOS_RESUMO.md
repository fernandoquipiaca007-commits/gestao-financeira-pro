# Formulários: resumo por ficheiro

## 1. Pagamento parcial
**Ficheiro:** `src/components/modals/IncomeModal.tsx`
- Registar pelo formulário de **receita** (Financeiro), com valor e data de recebimento.
- Campos: cliente, projeto (opcional), descrição, valor, moeda, data prevista, data de recebimento, método de pagamento, estado e notas.
- Não editar o campo "Valor pago" do projeto: cria uma receita pela diferença e pode duplicar.
- "Marcar como Pago" (em `src/App.tsx`, função `handleMarkProjectAsPaid`) só deve ser usado quando recebeu o total.

## 2. Campos obrigatórios
**Cliente nova:** `src/components/modals/ClientModal.tsx`
- Só o **nome** é obrigatório (`Nome do Cliente *`).

**Projeto novo:** `src/components/modals/ProjectModal.tsx`
- Nome do projeto (`*`)
- Cliente principal (`*`)
- Valor total (`*`)
- Data de início (`*`)
- Data de entrega, ou "Data indefinida"
- Se for recorrente: valor por período (`*`)

**Receita:** `src/components/modals/IncomeModal.tsx`
- Cliente (`*`), descrição (`*`) e valor.

## 3. Estados possíveis
**Projeto:** `src/components/modals/ProjectModal.tsx` (linhas 516–519)
- Em andamento
- Aguardando cliente
- Concluído
- Cancelado
- Flag separada: **Arquivado** (sai dos ativos e do valor a receber, mas mantém o histórico)

**Receita:** `src/components/modals/IncomeModal.tsx` (linhas 261–263)
- Pendente
- Recebido
- Atrasado
