# BRIEF · Finanças dentro do portfólio (backend, dados e migração)

> Escrito pelo Claude (arquiteto e frontend) em 2026-11-27. O Codex faz **só** o que está aqui. As telas são do Claude, depois.

## Contexto (3 linhas)
- O FRTCASH (`~/Desktop/projects/FRTCASH`, **só leitura**: não editar nada lá) é o app de finanças pessoais do Matheus, em Next.js + Supabase próprio. Ele vai morar dentro do sistema interno do portfólio como a aba **Finanças**, com o mesmo login e o mesmo Supabase do portfólio.
- O portfólio (**este worktree**: `~/Desktop/projects/portfolio-mf-financas`, branch `feat/financas`, criado a partir de `origin/main` em `aa6a2ae`) é React 19 + Vite + wouter + Tailwind 4 + Supabase. Funções da Vercel são escritas em `server/**.ts` e empacotadas para `api/**.js` pelo `pnpm build:api` (esbuild), com assinatura Node `req`/`res` (veja `server/automacoes/painel.ts`). Testes em **vitest**. Aliases `@/` (client/src) e `@shared/` (shared).
- O FRTCASH v3 **não foi para produção**: o banco do FRTCASH está no schema v2 (v1 + v2 do `supabase.sql`). O v3 (captura do Apple Pay, recorrentes, limites) está pronto e testado só localmente, e vai nascer direto aqui.

## A tarefa (1 frase)
Trazer para o portfólio o banco, a camada de dados, a captura do iPhone e os testes do FRTCASH v3, e um script que copia os dados do Supabase do FRTCASH para o do portfólio sem perder nada.

## Decisões já tomadas (não reabrir)
1. **Mesmos nomes de tabela e função** (`frtcash_*`) e mesmas regras do `FRTCASH/supabase.sql` atual (que já inclui a correção `generated_until` do recorrente). Reaproveita o código e os testes como estão.
2. **Só o dono usa.** RLS por `auth.uid()` como no FRTCASH. O parceiro do Radar é outro usuário e não vê nada (a aba some para ele na tela; o banco já garante).
3. **Meta a Dois vai para o banco.** No FRTCASH o plano do casal fica no `localStorage` (`components/CoupleGoal.tsx`, chave `COUPLE_PLAN_KEY`, formato em `lib/coupleGoal.ts`). Aqui vira a tabela `frtcash_couple_plans` (uma linha por usuário, `plan jsonb` validado por `check` de tipo objeto, `updated_at`), RLS completo do dono.
4. **Captura em `/api/financas/captura`**, mesma lógica e mesmos códigos do `FRTCASH/lib/capture/handler.ts` e `docs/API-CAPTURA.md` (401, 405, 413, 422, 429, 500, mensagens em português curto). Usa a RPC `frtcash_capture_payment` com a **chave publicável** (`VITE_SUPABASE_PUBLISHABLE_KEY`, cair para `VITE_SUPABASE_ANON_KEY`) e `VITE_SUPABASE_URL` do `process.env`. Nada de service role nessa função.
5. **Migração de dados por script local**, nunca pela tela: lê o Supabase do FRTCASH e grava no do portfólio com a service role de cada um, só os dados do dono, **mantendo os `id`** (upsert idempotente), trocando `user_id` pelo id do dono no portfólio.

## Lista por arquivo
1. `supabase/migrations/0010_financas.sql`: schema completo para banco novo (o do portfólio não tem nenhuma tabela `frtcash_*`), **idempotente**, a partir do `FRTCASH/supabase.sql` (v1 + v2 + v3). Pode simplificar os blocos que só existiam para migrar dados antigos do FRTCASH (linhas com `user_id` nulo), desde que o resultado final seja o mesmo schema, as mesmas constraints, RLS, grants, gatilhos e funções. Mais a tabela `frtcash_couple_plans` (decisão 3). Comentários em português.
2. `shared/financas/`: lógica pura sem dependência do navegador, portada do FRTCASH: `wallet.ts` (inclui `setMoneyHidden`/`formatBRL`), `categorize.ts`, `ofx.ts`, `coupleGoal.ts`, `captura.ts` (parse do valor, limpeza do estabelecimento, mensagem e o handler puro com a RPC injetada). Mesmos nomes exportados e mesmas assinaturas, para as telas portarem de forma mecânica.
3. `client/src/features/financas/dados.ts`: as funções de dados do `FRTCASH/lib/supabase.ts` (carregar e salvar lançamentos, metas, regras, importação em lote, `updateCardCategory`, tokens do iPhone, limites, recorrentes, `materializeRecurring`) mais `loadCouplePlan`/`saveCouplePlan`, recebendo o client do `@/lib/supabase`. Tipos do banco no mesmo arquivo ou em `tipos.ts`. **Sem** a parte de backup local e de dono legado do FRTCASH (`uploadLocalBackup`, `readLocalBackup`): aqui não existe dado antigo no navegador.
4. `server/financas/captura.ts` → `api/financas/captura.js` (acrescente ao script `build:api` com o mesmo padrão de banner "Gerado por pnpm build:api ... Não edite.") e rode o `build:api` para gerar o `.js`. Corpo até 4 KB, `Cache-Control: no-store`, nunca logar token nem corpo.
5. Testes vitest: portar `FRTCASH/tests/*` (parse, captura e conversão de registros) para `shared/financas/*.test.ts` e `client/src/features/financas/*.test.ts`. Mais um teste do banco com **PGlite** (`@electric-sql/pglite` como devDependency, a única dependência nova permitida) que roda o `0010_financas.sql` duas vezes e cobre: token só em hash, usuário sem acesso ao hash, RLS entre dois usuários, anon sem leitura, captura, duplicata em 3 min, categoria aprendida do mesmo lugar, regra do usuário, categoria padrão fora da lista vira Outros, fuso de Fortaleza, limite 30/h, token revogado, recorrente dia 31 em fevereiro, gerar de novo não duplica, **recorrente apagado não volta**, plano do casal só do dono. Base pronta para adaptar: `/private/tmp/claude-501/-Users-matheusfrota-Documents-FRT-CEREBRO/c7c54abd-6266-4f61-a2e0-97ccdc1e6811/scratchpad/pgtest/teste.mjs` (o PGlite não tem pgcrypto: o teste troca só a geração de bytes por um stub, como lá).
6. `scripts/financas/migrar.ts` + script `"financas:migrar": "node --env-file-if-exists=.env.local scripts/financas/migrar.ts"`:
   - Origem: `FRTCASH_SUPABASE_URL`, `FRTCASH_SERVICE_ROLE_KEY`, `FRTCASH_OWNER_EMAIL`. Destino: `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NOITE_OWNER_EMAIL` (o dono do portfólio). Faltou variável: para com mensagem clara, sem gravar nada.
   - Acha o id do dono em cada projeto pelo e-mail (`auth.admin.listUsers`, paginando).
   - Tabelas: `frtcash_cards`, `frtcash_investment_goals`, `frtcash_category_rules` (só as linhas do dono da origem). As colunas v3 que não existem na origem ficam com o padrão; `source = 'ofx'` quando `fitid` existir, como o v3 faz.
   - Sem `--gravar`: simulação. Mostra, por tabela e por cofre, quantas linhas e a soma de `amount`/`target_amount`, e quantas já existem no destino. **Nunca** imprime chave, e-mail, título de lançamento ou qualquer linha.
   - Com `--gravar`: antes, salva a cópia da origem em `~/.local/share/financas-mf/<AAAA-MM-DD-HHmm>/origem.json` (fora do repo, permissão 600); grava em lotes de 500 com upsert por `id` (metas por `user_id,month_key`, regras por `user_id,keyword`); depois **confere** contagem e soma por tabela e cofre na origem e no destino e sai com código 1 se diferir.
   - Se o destino ainda não tiver as tabelas (0010 não rodada), para antes de gravar com a mensagem "Rode a migration 0010_financas.sql no Supabase do portfólio".
7. `docs/FINANCAS.md`: o que existe, tabelas, a rota da captura (contrato), como rodar a migração de dados, e a ordem de ativação (SQL 0010 → simulação → `--gravar` → deploy).

## Regras
- **Trabalhe só neste worktree.** Não mexer em `~/Desktop/projects/portfolio-mf` (lá tem trabalho do Radar sem commit) nem no FRTCASH.
- **Não fazer telas**: nada em `client/src/pages`, `client/src/components`, `App.tsx`. É do Claude.
- **Sem commit, sem push, sem deploy. Não rodar SQL em banco nenhum. Não rodar o `migrar.ts` com `--gravar`** (a simulação também não: não há as chaves do FRTCASH no `.env.local`).
- Dependência nova só o `@electric-sql/pglite` (dev).
- Código no estilo do repo (português nos nomes de domínio onde o repo já faz assim), edição cirúrgica no que já existe, textos em português do Brasil, sem o travessão "—".

## Prova ao final
1. `pnpm check` sem erro novo (rode antes para ter a linha de base).
2. `pnpm test` com a contagem antes e depois.
3. `pnpm build` e `pnpm build:api` passando; o `api/financas/captura.js` gerado.
4. O teste do banco PGlite passando, com a lista das verificações.
5. Relatório em `docs/ENTREGA-FINANCAS-CODEX.md` e aviso com `maestri ask "Claude Maestro" "<resumo>"`.
