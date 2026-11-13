# Automações Instagram, backend

## Entrega

- `supabase/migrations/0008_automacoes.sql`: tabelas de contas, automações e eventos; RLS por dono, bloqueio restritivo de parceiro, grants de coluna para ativar conta, controle otimista de versão e limites do contrato. A migration foi criada, mas não executada.
- `shared/automacoes/{validar,casar,mensagem,linha}.ts`: validação, correspondência determinística, personalização da mensagem e conversão snake_case/camelCase. `tipos.ts` permaneceu intacto.
- `server/automacoes/zernio.ts`: chamadas ao Zernio com base fixa, timeout, redirect bloqueado, erros sem corpo do provedor e assinatura HMAC-SHA256.
- `server/automacoes/{webhook,painel}.ts`: webhook idempotente e processamento inline com orçamento de até 4 s para chamadas externas; painel autenticado pelo JWT, restrito ao dono e limitado a 30 chamadas/minuto em memória.
- `api/automacoes/{webhook,painel}.js`: bundles gerados. `api/radar/busca.js` foi regenerado para refletir mudanças já presentes em `shared/radar/normalizar.ts`.
- `package.json` e `.env.example`: script `build:api` gera as três funções e documenta as variáveis sem valores.
- Testes novos: `shared/automacoes/automacoes.test.ts`, `server/automacoes/webhook.test.ts` e `server/automacoes/painel.test.ts`.

## Decisões e verificação

- O webhook processa no próprio request, sem `waitUntil` nem dependência adicional. As chamadas ao Zernio recebem o tempo restante de um orçamento de 4 s para deixar folga antes do limite de 5 s informado pelo provedor. As operações Supabase também precisam permanecer rápidas em produção.
- Timeout, rede ambígua e respostas 5xx deixam o evento como `incerto`; reentregas não disparam um novo envio. Resposta pública usa `Idempotency-Key`.
- `pnpm check`: passou.
- `pnpm test`: 35 arquivos, 331 testes passaram.
- `pnpm build:api`: passou, gerando Radar, webhook e painel.
- Não houve migration, chamada real ao Zernio, teste com Instagram, nem teste ponta a ponta. Nenhuma dependência foi instalada. Nenhum arquivo em `client/` foi alterado por esta tarefa.

## Pontos do Zernio ainda sem confirmação real

- A forma e os nomes exatos dos campos do webhook para Direct/story, incluindo `metadata.storyReply`, `standby`, `isStoryMention` e `isOwnAccount`.
- A aceitação de `secret`, `events`, `isActive` e `_id` no POST/PUT de `/webhooks/settings`, além da forma exata de resposta de contas, publicações e webhooks.
- A disponibilidade e o limite efetivo de botões de URL em resposta privada a comentário e em Direct, e o limite de texto aplicado pelo Zernio/Instagram.
- Os formatos foram implementados conforme as referências OpenReply e Sistema LV indicadas no brief; precisam de validação em ambiente de teste antes de ativar as credenciais.
