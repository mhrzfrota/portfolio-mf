# Brief: backend das Automações do Instagram (2026-11-12)

## O que é
Nova aba **Automações** (`/automacoes`) do sistema interno: um "ManyChat próprio". Alguém comenta uma palavra-chave num post, manda Direct ou responde um story, e a plataforma responde sozinha (resposta pública + Direct com até 2 botões), em **várias contas do Instagram**, tudo pelo **Zernio**. Referência de produto: OpenReply (MIT), github.com/diwenne/openreply (leia `lib/zernio/*`, `lib/instagram/send-messages.ts`, `lib/instagram/read-content.ts`, `docs/zernio.md` para os formatos exatos do Zernio). Referência de casa: o cliente do Zernio de outro projeto da casa, já em produção (não alterar aquele repositório).

Não é cópia do OpenReply: sem Redis, sem worker, sem Prisma, sem NextAuth. Aqui é Vite + função da Vercel + Supabase.

## Divisão (um agente por pasta)
- **Você (Codex):** `supabase/migrations/0008_automacoes.sql`, `shared/automacoes/*` (menos `tipos.ts`), `server/automacoes/*`, `api/automacoes/*` (gerado), testes, script `build:api` no `package.json`, `.env.example`.
- **Claude:** tudo em `client/`. **Não toque em `client/`.**
- **Contrato:** `shared/automacoes/tipos.ts` já está escrito. É a fonte da verdade. Se precisar mudar, pare e avise antes; não mude por conta própria.

## Regras da casa
- Repositório **público**: nenhum id de conta, @ de cliente, chave ou segredo em arquivo, teste ou exemplo. Use nomes genéricos (`conta_teste`).
- Nunca commitar. Nunca rodar migration no Supabase. Nunca chamar o Zernio de verdade (testes com `fetch` simulado).
- PT-BR nos nomes e comentários, no padrão do repo. Nunca usar o travessão "—".
- Sem dependência nova, salvo `@vercel/functions` (para `waitUntil`) se for mesmo necessário; justifique no relatório.
- Siga o padrão de `server/radar/busca.ts` → `api/radar/busca.js` (esbuild, arquivo gerado commitado, `pnpm build:api`).

## 1. Migration `0008_automacoes.sql`
Tabelas (todas com `owner uuid not null default auth.uid() references auth.users`, RLS ligada):
- `auto_contas`: `owner`, `id text` (id do Zernio), `usuario text`, `nome text`, `foto text`, `ativa boolean not null default false`, `sincronizada_em timestamptz`. PK `(owner, id)`.
- `auto_automacoes`: `id uuid pk default gen_random_uuid()`, `owner`, `nome`, `ativa boolean default false`, `contas text[]`, `gatilhos text[]` (check: subconjunto de comentario/direct/story e não vazio), `posts text[]`, `palavras text[]`, `correspondencia text` (check), `respostas_publicas text[]`, `mensagem text`, `botoes jsonb default '[]'`, `criada_em`, `atualizada_em`, `versao int default 1`.
  - Trigger de versão igual ao do Radar/Calendário (`radar_carimbar_versao`): update só passa se `versao` bater, e carimba `versao + 1` e `atualizada_em`.
  - Checks de tamanho conforme `LIMITES` do contrato.
- `auto_eventos`: `id text` (chave do comentário/mensagem), `owner`, `conta_id`, `automacao_id uuid null`, `tipo`, `usuario`, `texto`, `post_id`, `situacao` (check), `erro`, `criado_em default now()`. PK `(owner, id)`. Índice `(owner, criado_em desc)`.
- Políticas:
  - Dono (`owner = (select auth.uid())`): select/insert/update/delete em `auto_automacoes`; select e **update só de `ativa`** em `auto_contas` (use grant de coluna ou trigger); select em `auto_eventos`.
  - `auto_contas` (insert/demais colunas) e `auto_eventos` (insert/update) só pela service role.
  - **Parceiro bloqueado:** política `as restrictive ... using (not public.radar_eh_parceiro())` nas três tabelas, como em `0006_radar_parceiro.sql`.
- Idempotente (`if not exists`, `drop policy if exists`), no estilo das migrations 0005 a 0007.

## 2. `shared/automacoes/` (puro, sem I/O, testável)
- `validar.ts`: `validarRascunho(x): {ok:true, valor: AutomacaoRascunho} | {ok:false, erros: string[]}` com os `LIMITES`; URL de botão só `https://`; remove duplicadas e espaços das palavras.
- `casar.ts`: `normalizar(texto)` (minúsculas, sem acento, espaços colapsados) e `casa(automacao, evento)`:
  - conta do evento está em `automacao.contas`; gatilho do evento está em `gatilhos`;
  - comentário: `posts` vazio ou contém o post;
  - palavras vazias = casa sempre; `contem` (substring), `palavra` (palavra inteira, limite por não letra/dígito), `exata` (texto inteiro igual).
  - `escolher(automacoes, evento)`: entre as ativas que casam, vence a mais específica (com post específico > com palavra > sem palavra), desempate pela `atualizadaEm` mais recente. Uma só responde.
- `mensagem.ts`: `montarMensagem(modelo, {usuario})` troca `{usuario}` (sem @ duplicado; se não houver usuário, tira o marcador sem deixar espaço duplo).
- `linha.ts`: conversão linha do banco (snake_case) ↔ tipo do contrato (camelCase), usada pelo servidor e pelo cliente.

## 3. `server/automacoes/`
- `zernio.ts`: cliente no molde do cliente do Zernio já em produção (base fixa `https://zernio.com/api/v1`, timeout 8 s, `redirect: "error"`, a chave nunca aparece em erro ou log, erros com código). Funções: listar contas do Instagram (todas as do perfil/chave), publicações de uma conta, resposta privada a comentário, resposta pública (com `Idempotency-Key`), Direct em conversa, Direct com botões (formato exato no OpenReply `sendZernioMessage`), listar/registrar webhook (`/webhooks/settings`, eventos `comment.received` e `message.received`, **sem apagar nem alterar webhooks de outros sistemas**: só cria ou atualiza o que tem a nossa URL). Conferência de assinatura HMAC-SHA256 hex do corpo cru (`x-zernio-signature`), com `timingSafeEqual`.
- `webhook.ts` → `api/automacoes/webhook.js` (POST):
  1. Lê o **corpo cru** (não use `req.body` antes; desligue o parser se preciso) e confere a assinatura com `AUTOMACOES_WEBHOOK_SECRET`. Falhou: 401.
  2. Responde 200 rápido (Zernio espera 5 s) e processa em seguida (`waitUntil`), ou processa dentro do prazo com folga. Explique a escolha.
  3. Ignora: `test`, plataforma diferente de instagram, comentário da própria conta (`isOwnAccount`), Direct `outgoing` ou `standby`, menção de story.
  4. Conta precisa existir em `auto_contas` com `ativa = true` (isso define o `owner`). Conta inativa: não grava nada e não responde (o Sistema LV pode estar cuidando dela).
  5. Classifica o gatilho: `comment.received` → comentario; `message.received` com `metadata.storyReply` → story; senão → direct.
  6. **Idempotência antes de enviar:** insere em `auto_eventos` com a chave do comentário/mensagem; conflito (23505) = já tratado, sai.
  7. `escolher(...)`. Sem automação: situação `ignorado`. Com automação: comentário → resposta privada (com botões se houver) e, se houver `respostasPublicas`, uma sorteada em público; direct/story → Direct na conversa.
  8. Atualiza o evento: `enviado`, `falhou` (com código do erro, sem texto do provedor que possa ecoar a chave) ou `incerto` (timeout ou 5xx: **não reenviar**).
  9. Usa a service role (`SUPABASE_SERVICE_ROLE_KEY`) só aqui e no painel.
- `painel.ts` → `api/automacoes/painel.js` (POST, `Authorization: Bearer <JWT do Supabase>`):
  - Valida o JWT como em `server/radar/busca.ts`; **só o dono** (recusa parceiro: 403). Implementa as 4 ações de `PedidoPainel` e devolve `RespostaPainel`.
  - `sincronizar-contas`: upsert em `auto_contas` preservando `ativa`; contas que sumiram do Zernio ficam, com `ativa = false`.
  - `registrar-webhook`: URL = `${AUTOMACOES_BASE_URL}/api/automacoes/webhook`; nunca devolve segredo.
  - Limite simples de chamadas por usuário (ex.: 30/min em memória) e respostas `no-store`.
- Variáveis (documentar em `.env.example`, sem valores): `ZERNIO_API_KEY`, `AUTOMACOES_WEBHOOK_SECRET`, `AUTOMACOES_BASE_URL`, e as do Supabase já usadas pelo Radar.

## 4. Testes (`vitest`, sem rede)
- `casar`: acento, maiúscula, `palavra` não casa dentro de outra palavra, post específico, conta errada, gatilho errado, prioridade.
- `validar`: limites, URL não https, palavras duplicadas.
- `webhook`: assinatura inválida (401), evento repetido (uma resposta só), conta inativa (nenhuma chamada ao Zernio), comentário próprio ignorado, story vs direct, timeout vira `incerto`, a chave não aparece em nenhum erro/log.
- `painel`: sem JWT (401), parceiro (403), sincronização preserva `ativa`.

## 5. Entrega
- `pnpm check`, `pnpm test` e `pnpm build:api` passando. `build:api` passa a gerar os três arquivos (radar e os dois novos).
- Relatório curto em `docs/RELATORIO-2026-11-12-automacoes-backend.md`: arquivos, decisões, o que NÃO foi testado de verdade (nada foi contra o Zernio real), e as dúvidas sobre o formato do Zernio que ficaram abertas.
- Ao terminar: `maestri ask "Claude Maestro" "Backend das Automações pronto: <resumo em 5 linhas>"`.
