# Livro de caixa

Registo das movimentações e do raciocínio por trás de cada fecho. As entradas mais recentes ficam no topo. Regras de cálculo em [FINANCEIRO.md](FINANCEIRO.md).

---

## 2026-10-21 — Novos registos feitos no sistema e situação do caixa

Registos feitos diretamente na app desde o fecho de setembro (conferidos no relatório Excel gerado com os dados reais):

| Data | Movimento | Valor |
|---|---|---|
| 03/10/2026 | Entrada — Funil de palestra (Dra. Nayara Xavier) | + R$ 2.325,00 |
| 19/10/2026 | Saída — Jorge Reis (registado como "Salário & Equipa") | − R$ 2.325,00 |
| 20/10/2026 | Entrada — Funil de palestra EURO KL (Karen Tiago Lopes) | + R$ 1.500,00 |

**Caixa a 21/10/2026: R$ 4.100,00** = R$ 1.600,00 reservados + R$ 1.000,00 por enviar ao Jorge (lote de setembro) + R$ 1.500,00 livres.

A confirmar: o pagamento de R$ 2.325,00 ao Jorge (19/10) é salário/serviço (custo) ou distribuição de sócio? Se for distribuição, mudar a categoria para "Distribuição a sócios" — o caixa não muda, mas o lucro sobe R$ 2.325,00.

---

## 2026-10-20 — Fecho do lote de setembro

Registado no sistema em 20/10/2026 (`supabase/data/2026-09-fecho-setembro.sql`). Bate com o relatório enviado ao Jorge.

### Ponto de partida: caixa a zero

O dinheiro dos projetos de julho e agosto já tinha sido todo usado:

| | Valor |
|---|---|
| Recebido (Rota docente 1 ×2, Campanha Diná jul., Rota docente 2, Captação de leds) | R$ 3.900,00 |
| Despesas pagas (envios para Angola, salários, PayPal) | − R$ 3.375,00 |
| Comissões pagas ao parceiro Jorge Reis | − R$ 525,00 |
| **Caixa antes do lote de setembro** | **R$ 0,00** |

### Entradas do lote

| Data | Projeto | Valor |
|---|---|---|
| 14/09/2026 | Funil de Palestras (Rebeka) | R$ 1.500,00 |
| 16/09/2026 | Campanha para palestra — Novo Mês (Diná) | R$ 1.000,00 |
| 17/09/2026 | Funil de palestra Euro (Maria Carolina) | R$ 1.300,00 |
| 25/09/2026 | Funil de palestra (Julianna) — *receita que faltava, registada neste fecho* | R$ 1.800,00 |
| | **Total recebido** | **R$ 5.600,00** |
| 25/09/2026 | Taxas Stripe/PayPal | − R$ 100,00 |
| | **Líquido (valor do relatório)** | **R$ 5.500,00** |

### Destino do valor

| Data | Movimento | Valor | Estado |
|---|---|---|---|
| 22/09/2026 | Edição de vídeo | R$ 800,00 | pago |
| 22/09/2026 | Ferramentas | R$ 600,00 | pago |
| 22/09/2026 | Reserva **Ferramentas futuras** | R$ 600,00 | em caixa |
| 22/09/2026 | Reserva **Meta dos 30 mil** | R$ 1.000,00 | em caixa |
| | **Total destinado** | **R$ 3.000,00** | |

### Divisão do restante (R$ 2.500,00)

| Data | Sócio | % | Valor | Estado |
|---|---|---|---|---|
| 09/10/2026 | Fernando Quipiaca | 40% | R$ 1.000,00 | enviado |
| 09/10/2026 | Jorge Reis | 40% | R$ 1.000,00 | **por enviar** |
| 09/10/2026 | Valdimiro Grão | 20% | R$ 500,00 | enviado |

### Caixa depois do fecho

| | Valor |
|---|---|
| **Saldo em caixa** | **R$ 2.600,00** |
| Reservado: Meta dos 30 mil | R$ 1.000,00 |
| Reservado: Ferramentas futuras | R$ 600,00 |
| Por enviar ao Jorge | R$ 1.000,00 |
| Livre | R$ 0,00 |

Verificado na base de dados: recebido R$ 9.500 − pago R$ 6.375 − comissões R$ 525 = R$ 2.600.

### Pendente

- Assinaturas do **Claude** e do **Supabase** (pagas com a reserva Ferramentas futuras): falta o valor em reais e a data de cada uma. Ao registá-las, escolher "Paga com a reserva: Ferramentas futuras".
- Envio dos R$ 1.000 ao Jorge: quando for feito, marcar a despesa "Jorge Reis (40%) - Lote de setembro" como paga.
