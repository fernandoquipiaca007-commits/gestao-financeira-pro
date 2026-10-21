# WhatsApp — integração só de leitura

Regra: **o sistema só lê**. Não envia, não responde, não marca como lido e não mexe em contactos ou grupos (evita bloqueio do número). A função não tem nenhuma chamada à API de envio da Meta.

## Como funciona

1. A Meta (API oficial do WhatsApp) envia cada mensagem recebida para a função whatsapp-webhook (Supabase).
2. A função valida a assinatura da Meta e guarda a mensagem em whatsapp_messages (contacto, nome, texto, data, ligada à cliente quando o número coincide).
3. Em **modo coexistência**, as mensagens enviadas pela app do telemóvel também ficam registadas (só registo).
4. Todos os dias às 00:00, uma rotina do Claude lê as mensagens ainda não analisadas e atualiza o sistema (tarefas, alarmes, clientes; projetos e pagamentos ficam por aprovar).

## Configuração (feita pelo Fernando)

**Supabase → Project Settings → Edge Functions → Secrets:**

| Nome | Valor |
|---|---|
| WHATSAPP_APP_SECRET | App Secret da app na Meta (Configurações da app → Básico) |
| WHATSAPP_VERIFY_TOKEN | Um texto à escolha (ex.: uma frase longa) — o mesmo vai na Meta |

**Meta → a sua app → WhatsApp → Configuração → Webhook:**

- URL de retorno: https://ixwcdkkskhcmwdopexwt.supabase.co/functions/v1/whatsapp-webhook
- Token de verificação: o mesmo texto de WHATSAPP_VERIFY_TOKEN
- Campos a subscrever: messages (e smb_message_echoes, se usar coexistência)

Não é preciso token de envio: a integração não envia nada.

## Estado

- [x] Tabela whatsapp_messages (só a função escreve; a equipa só lê).
- [x] Função whatsapp-webhook publicada (recusa pedidos sem assinatura).
- [ ] Segredos e webhook configurados na Meta.
- [ ] Ecrã "Conversas" no sistema.
- [ ] Rotina diária às 00:00.
- [ ] Importação das conversas antigas.
