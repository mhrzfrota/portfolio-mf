---
name: enviar
description: Envia pelo Direct do Instagram @emefeservices as mensagens que o Matheus aprovou na fila do Radar, dentro do limite do dia e com pausa entre uma e outra. Use quando o Matheus disser "/enviar", "envia os aprovados", "manda as mensagens da fila" ou "dispara o Radar".
---

# /enviar

Objetivo: tirar da fila do Radar as mensagens **aprovadas pelo Matheus no painel** e enviar cada uma pelo Direct do @emefeservices, no Chrome dele (Claude in Chrome), sem passar do limite.

**Só sai o que está `aprovado` na fila e foi confirmado no chat nesta conversa.** Nunca envia rascunho, nunca muda o texto aprovado, nunca escreve para quem não está na fila.

## Passo 1: pode enviar agora?

`pnpm radar:envio -- status --json`

- `pode.ok` falso: diga o motivo em uma linha e pare. `pausado`: o Matheus pausou (`pnpm radar:envio -- retomar` só se ele pedir). `fora-da-janela`, `fim-de-semana`, `limite-do-dia`: diga quando abre (`proximoEm`).
- Sem aprovados: "Nada aprovado na fila. Aprove no painel (https://emefeservices.vercel.app/radar, aba Fila)."

## Passo 2: confirmar o lote no chat

`pnpm radar:envio -- fila --status aprovado --json` (sem `--json` a mensagem sai cortada; não use essa saída para confirmar).

Monte o lote: os aprovados na ordem da fila, até o que falta para o limite do dia (`limite - enviadosHoje`). Mostre ao Matheus, numa lista curta: @, nome, nota e a **mensagem inteira, copiada do JSON**. Guarde o lote confirmado (id, destino, tipo e mensagem de cada um): é contra ele que cada envio é conferido no Passo 3. Pergunte: **"Envio estes N agora, com X a Y minutos entre um e outro?"** e espere o sim. Sem sim, não envia.

## Passo 3: enviar um por um

Carregue as ferramentas do Chrome numa única ToolSearch e abra uma aba nova. Para cada envio do lote:

1. `pnpm radar:envio -- proximo --json`. Se `pode.ok` vier falso por `intervalo`, espere `esperaSeg` (comando `sleep` em segundo plano e aguarde o aviso; nunca encurte a espera). Compare id, destino, tipo **e a mensagem inteira** com o lote confirmado: o id se repete quando uma mensagem é cancelada e refeita, então id igual não basta. Qualquer diferença: pare o lote e avise.
2. `pnpm radar:envio -- marcar-enviando <envioId> --confirmada "<mensagem confirmada>" --destino <destino confirmado>`. O script recusa se o texto ou o @ mudaram; nesse caso, pare o lote.
3. Abra `https://www.instagram.com/<destino>/`. Confira que é o perfil certo (o @ na página e o nome batem com o lead). Se não for, `marcar-falhou --erro "Perfil não confere"` e siga.
4. Clique em **Enviar mensagem** (perfil sem esse botão: `marcar-falhou --erro "Perfil sem botão de mensagem"`).
5. **O problema citado na mensagem ainda existe?** A mensagem foi escrita dias antes. Confira no perfil (link da bio, botões) e, se a mensagem citar o site ou o domínio, com `curl`. Se mudou, **não envie**: `marcar-falhou --erro "Mensagem desatualizada: <o que mudou>"` e avise o Matheus para reescrever.
6. Na conversa, confira se já existe mensagem do @emefeservices para essa pessoa. Se existir, **não envie**: `marcar-falhou --erro "Já existe conversa"` e avise o Matheus.
7. Clique no campo da mensagem e digite o texto aprovado, exatamente como está na fila. Quebra de linha: Shift+Enter.
8. Pressione Enter **uma vez só** e confira que o balão apareceu na conversa com o texto inteiro. Nunca aperte Enter de novo nem redigite. Se o balão não aparecer em uns 10 segundos, recarregue a conversa e olhe: se a mensagem está lá, siga para o passo 9; se não está ou não dá para ter certeza, `marcar-falhou --erro "Envio não confirmado"`, pare o lote e avise o Matheus com print. Nada de nova tentativa sem ele.
9. `pnpm radar:envio -- marcar-enviado <envioId>` (isso também leva o lead para "Abordado" no funil).
10. Uma linha no chat: "Enviado para @x (n/N)".

## Pare tudo na hora se

- O Instagram mostrar qualquer aviso de limite ("Tente novamente mais tarde", "Ação bloqueada", "Restringimos certas atividades"), pedir verificação ou deslogar: `pnpm radar:envio -- marcar-falhou <envioId> --erro "<aviso>"`, depois `pnpm radar:envio -- pausar`, e avise o Matheus com print. Não tente de novo no mesmo dia.
- O perfil disser que não aceita mensagens, ou a pessoa já tiver pedido para não receber: `pnpm radar:envio -- bloquear <instagram> --motivo "..."`.

## No fim

Relatório curto: enviados, falhas com motivo, quantos restam aprovados, quando abre o próximo envio. Feche a aba que abriu.

## Regras

- Ritmo de gente: limite e intervalo vêm da configuração do Radar, no Supabase (hoje 10 por dia, 3 a 8 minutos entre um e outro, das 9h às 18h, em dia útil). Não mexa nesses números sem o Matheus pedir.
- Só envia, não segue, não curte, não comenta, não responde ninguém.
- Pedido de "não quero receber" é para sempre: `pnpm radar:envio -- bloquear`.
- Nunca use o travessão "—".
