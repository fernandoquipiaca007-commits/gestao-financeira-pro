# Acompanhamento comercial (CRM)

Cada ficha de cliente tem a secção **Acompanhamento comercial**:

| Campo | Para quê |
|---|---|
| **Fase** | Lead novo → Em negociação → Quase a fechar → Contrato fechado → Em execução → Cliente recorrente. Também: Pausado / sem resposta, Inativo, Perdido. |
| **Preferida** (estrela) | Marca as melhores clientes. |
| **Classificação 1–5** | Valor da cliente para o negócio. |
| **Tipo de contrato** | Ex.: funil de palestra, tráfego mensal. |
| **Último / próximo contacto** | Datas. O próximo contacto põe a cliente no topo da lista. |
| **Próximo passo** | O que fazer no próximo contacto. |
| **Resumo das conversas** | Histórico, valores combinados, objeções. |

Na página **Clientes**, o painel do topo mostra **Contactar hoje** (inclui os atrasados), **Próximos contactos** e filtros por fase e por preferidas.
A lista fica ordenada pelo próximo contacto.

Os follow-ups também ficam na Agenda como **alarmes** (às 10:00).

## Carga inicial (21/10/2026)

As 25 conversas de WhatsApp exportadas foram lidas e cada cliente foi classificada diretamente na base de dados.
Foram registadas 3 clientes novas que não estavam no sistema e criados 17 alarmes de follow-up até 31/10.
O conteúdo das conversas **não** fica no repositório: está só nas fichas, dentro do sistema.

Migração: `supabase/migrations/20261022120000_client_pipeline.sql`.
