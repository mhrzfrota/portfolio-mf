---
name: caixa
description: Lê o Direct do @emefeservices para ver quem respondeu às mensagens do Radar, atualiza o funil e prepara o próximo passo (resposta sugerida e followups para aprovar). Nunca responde sozinho. Use quando o Matheus disser "/caixa", "alguém respondeu?", "olha o direct do radar" ou "como está a prospecção".
---

# /caixa

Objetivo: saber quem respondeu, mover o lead no funil e deixar pronto o que o Matheus precisa fazer. **Só leitura no Instagram: nunca responde, nunca envia.**

## Passo 1: quem esperar

`pnpm radar:envio -- fila --status enviado` e `pnpm radar:envio -- status --json`. Os leads com primeira mensagem ou followup enviados e etapa "Abordado" são os que podem ter respondido.

## Passo 2: ler as conversas (Chrome)

Carregue as ferramentas do Chrome numa única ToolSearch e abra uma aba nova. Para cada lead esperado:
1. Abra `https://www.instagram.com/<destino>/` e clique em **Enviar mensagem** para abrir a conversa (abrir não envia nada; **não digite nada**).
2. Leia as mensagens depois do nosso envio. Mensagem da outra pessoa depois do `enviadoEm` = respondeu.
3. Respondeu: `pnpm radar:envio -- resposta <leadId> --anotacao "<resumo de uma linha do que disse>"` (cancela o followup pendente).
4. Pediu para não receber, ou foi grosseiro: `pnpm radar:envio -- bloquear <instagram> --motivo "Pediu para não receber"`.

Leia só as conversas desses leads. Não abra outras conversas da caixa do Matheus.

## Passo 3: followups

`pnpm radar:envio -- followups`: cria em rascunho o followup de quem não respondeu em `oferta.followupDias` dias (um só por lead). Eles vão para a fila do painel e só saem depois de aprovados.

## Passo 4: relatório

- Quem respondeu, o que disse em uma linha e a **resposta sugerida** para o Matheus mandar (ele revisa e envia). Se aceitou a prévia: diga o que a prévia precisa ter (vem do `problemas` e da `oportunidade` do lead) e pergunte se começa.
- Followups criados para aprovar.
- Números da semana: abordados, responderam, prévias, reuniões.

## Regras

- Nunca responda, nunca envie, nunca marque como lida de propósito (abrir a conversa marca, e tudo bem).
- Nada de print ou cópia de conversa no vault: só o resumo de uma linha no funil.
- Nunca use o travessão "—".
