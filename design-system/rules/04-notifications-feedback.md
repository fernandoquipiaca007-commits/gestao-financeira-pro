# Regra 04 — Notificações e feedback

> Cada mensagem tem de merecer a atenção que pede. Se a pessoa já está a ver o resultado, não precisa de ser avisada.

## Hierarquia (do mais discreto ao mais intrusivo)

| Nível | Componente | Quando | Exemplo |
|---|---|---|---|
| 1. Inline | Texto junto ao elemento, `aura-error`, estado do botão | Validação, resultado de uma ação no próprio sítio | "Indique um valor maior que 0" |
| 2. Toast | `useToast()` | Confirmar uma ação que tirou a pessoa do sítio, ou oferecer "Anular" | "Fatura enviada para Grupo Atlântico" · [Anular] |
| 3. Banner | `Alert` no topo da página ou do card | Estado que persiste e afeta o trabalho | "O período de teste termina em 3 dias" |
| 4. Modal | `Modal` de decisão | Só quando é preciso decidir antes de continuar | "Eliminar cliente? Esta ação não pode ser anulada." |
| 5. Centro de notificações | Sino na topbar | Eventos de outras pessoas/sistemas, para ver depois | "Ana atribuiu-lhe a tarefa Revisão de contrato" |
| 6. Push / email | Fora da app | Só eventos urgentes e acionáveis, configuráveis | "Pagamento de 1 200 € recebido" |

**Regra de escolha:** usa sempre o nível mais baixo que resolve.

## Toasts

- **Quando sim:** ação concluída fora de vista (guardou e voltou à lista), ação reversível ("Anular"), erro de rede numa ação em segundo plano.
- **Quando não:** quando o resultado já está visível (a linha nova já aparece na tabela, o switch já mudou), para erros de validação (vão inline), para boas-vindas, para dicas.
- Texto: 1 linha, diz **o quê + em quê**: "Projeto atualizado", "3 tarefas marcadas como concluídas". Nunca "Sucesso!", "Operação realizada com sucesso", "Feito!".
- Duração: 4s; 8s se tiver ação. Erros ficam até serem fechados. Pausa ao passar o rato.
- **Máximo 3 visíveis.** O mesmo toast não se repete: mesma mensagem nos últimos 5s = substitui, não empilha (chave de deduplicação).
- Posição: canto inferior direito no desktop; topo no mobile (para não colidir com a BottomNav).
- Ações em massa geram **1** toast resumido ("12 transações exportadas"), nunca 12.

## Banners

- **Um de cada vez** por zona (topo da app, topo da página). Prioridade: falha de pagamento > acesso expirado > trial a terminar > novidades.
- Fecháveis, exceto quando bloqueiam o trabalho (pagamento falhado). Ao fechar, a decisão é lembrada e o banner não volta na mesma sessão.
- **Sem piscar:** o banner só aparece depois de os dados que o justificam estarem carregados. Nunca renderizar "por precaução" e esconder a seguir (aconteceu com o aviso de integridade financeira).
- **Sem ficar preso:** um banner de estado (ex.: pedido de permissão de push) desaparece assim que o estado muda, sem precisar de recarregar a página (aconteceu com o banner de notificações push).
- Banner não empurra o layout depois de a página estar pintada: reservar o espaço ou animar a entrada com altura (`motion` + `layout`).

## Centro de notificações

- Agrupar por dia ("Hoje", "Ontem", "Esta semana"). Não lidas com ponto ember à esquerda.
- Cada notificação: ícone/avatar · texto com o nome do objeto em negrito · tempo relativo ("há 5 min") · destino ao clicar (abre a página do objeto).
- "Marcar todas como lidas" no topo. Contador no sino só para **não lidas acionáveis**, até 99+.
- Notificações do próprio utilizador (ele criou a fatura) não lhe são enviadas.
- Agregar eventos repetidos: "Ana comentou 4 vezes em Revisão de contrato", não 4 linhas.

## Push e email

- Pedir permissão de push **só depois** de a pessoa fazer algo que beneficia disso (ex.: ativar "Avisar quando um pagamento chegar"), nunca ao entrar.
- Cada tipo de notificação pode ser desligado em Definições › Notificações.
- Sem push à noite (22h–8h no fuso do utilizador), exceto alertas de segurança.

## Confirmações

- Pedir confirmação só para ações **destrutivas ou caras** (eliminar, cancelar subscrição, enviar a 50 clientes). Para o resto, executar e oferecer "Anular" num toast.
- Título = pergunta com o objeto ("Eliminar o cliente Grupo Atlântico?"). Corpo = consequência ("Os 4 projetos associados ficam sem cliente."). Botões = verbos ("Eliminar cliente" / "Cancelar").
- Eliminações em massa ou irreversíveis de alto impacto: pedir para escrever o nome.

## Estados de carregamento

| Duração | Feedback |
|---|---|
| < 300ms | Nada (evita piscar) |
| 300ms – 2s | Skeleton (1ª carga) ou spinner no botão |
| > 2s | Skeleton + texto do que está a acontecer ("A gerar relatório…") |
| > 10s | Progresso real ou "Avisamos quando estiver pronto" + notificação |

Ao recarregar dados já visíveis, manter o conteúdo antigo a 60% de opacidade em vez de voltar ao skeleton.

## Proibido

- `alert()`, `confirm()`, `prompt()` do browser (existem 30 hoje — todos a substituir).
- Mostrar erros técnicos ao utilizador (`TypeError`, `duplicate key`, códigos HTTP, JSON).
- Toasts para eventos que a pessoa não causou e que não exigem ação.
- Exclamações e emojis em mensagens do sistema.
