# Entrega do backend de Finanças

> **Nota do Claude (2026-11-27):** o Matheus decidiu não importar os dados do FRTCASH. O migrador (`scripts/financas/migrar.ts`, `shared/financas/migracao.ts` e os testes deles) foi retirado antes do commit; o resto desta entrega vale como está.

2026-11-27 · Worktree `portfolio-mf-financas` · Branch `feat/financas` · Base `aa6a2ae`

O portfólio recebeu o schema do FRTCASH v3, a camada de dados com a sessão do portfólio, a captura do iPhone e o migrador local das três tabelas do FRTCASH v2. Nesta revisão, o migrador preservou os IDs de lançamentos, metas e regras nos testes com dois projetos simulados. A ativação do Supabase e a cópia dos dados reais continuam pendentes. [Guia de ativação e contrato da captura](./FINANCAS.md)

## Entregáveis

| Entregável | Conteúdo |
| --- | --- |
| [Migration 0010](../supabase/migrations/0010_financas.sql) | Oito tabelas com RLS. Lançamentos, metas de investimento, regras, tokens, log de captura, limites por categoria, recorrentes e plano do casal. |
| [Lógica compartilhada](../shared/financas) | Carteira, ocultação de valores, categorização, OFX, projeção da Meta a Dois, validação da captura e formatação da notificação. |
| [Camada de dados](../client/src/features/financas/dados.ts) | Leitura e escrita pelo cliente autenticado. Inclui atualização isolada de categoria, importação em lote, gestão de aparelhos, limites, recorrências e plano do casal. |
| [Função Vercel](../server/financas/captura.ts) | `POST /api/financas/captura`, corpo de até 4.096 bytes, chave publicável do portfólio e resposta em português com `Cache-Control: no-store`. [Bundle gerado](../api/financas/captura.js) |
| [Migrador local](../scripts/financas/migrar.ts) | Simulação por padrão. Com `--gravar`, faz backup privado, copia em lotes de até 500 e compara origem e destino. [Testes com clientes falsos](../scripts/financas/migrar.test.ts) |

As funções `frtcash_create_capture_token`, `frtcash_capture_payment` e `frtcash_materialize_recurring`, com seus grants, coincidem textualmente com a referência do FRTCASH. A comparação também confirmou a presença de `generated_until`, que preserva a exclusão de parcelas recorrentes. A tabela adicional `frtcash_couple_plans` aceita um objeto JSON por dono.

## Correções no migrador

- Os upserts de metas e regras agora levam o `id` original, mesmo quando encontram uma linha pela chave natural. Os registros v2 carregam seus campos e datas da origem. O dono passa a ser o usuário localizado no portfólio.
- A leitura usa um cursor de ID e continua até receber uma página vazia. O teste copiou 1.001 lançamentos com teto de leitura de 173 e gravou lotes de 500, 500 e 1.
- Todas as variáveis e tabelas necessárias são verificadas antes da escrita. O modo de simulação informa totais, valores por cofre e quantos registros da origem já existem no destino.
- O backup recebe permissão `0600` no caminho previsto, fora do repositório. Uma falha de backup interrompe a cópia. Outra tentativa no mesmo minuto conserva o arquivo anterior.
- A conferência relê os dois projetos, inclusive quando o destino já estava populado. Compara contagens e somas por tabela e cofre, IDs e campos copiados. O gatilho do destino controla `updated_at` nas atualizações. Diferenças resultam em código de saída 1.
- Os clientes e o ambiente são injetáveis. Importar o módulo nos testes não dispara o CLI. Os testes verificaram as saídas de sucesso e de erro, inclusive quando o transporte devolveu uma mensagem com dados privados.

## Validação

| Verificação | Resultado |
| --- | --- |
| Linha de base, antes das alterações | `pnpm check` passou. `pnpm test` passou com **410 testes em 39 arquivos**. |
| `pnpm check` na entrega | Código 0. |
| `pnpm test --exclude shared/financas/banco.test.ts` | **465 testes aprovados em 44 arquivos**, zero falhas. O comando excluiu apenas a suíte que executa SQL. |
| Novos testes abrangidos pelos 465 | 34 portados de captura, parsing e dados, 2 do cálculo dos resumos e 19 do migrador com clientes falsos. |
| `pnpm build:api` | Código 0. Gerou `api/financas/captura.js` com o banner do repositório. |
| Verificação do bundle em Node | GET retornou 405, POST sem token retornou 401 e corpo em blocos com 4.097 bytes retornou 413. Compras válidas em fluxo e em objeto já interpretado retornaram 200, com a frase esperada e RPC simulada. |
| `pnpm build` | Código 0. O Vite avisou que o bundle principal ultrapassa 500 kB após minificação. |

Os 19 testes do migrador usaram transporte em memória e HOME temporário. Incluem ausência de cada uma das seis variáveis, destino sem a 0010, permissão e ordem do backup, preservação de IDs e troca do dono, repetição da cópia, colisão com registro de outro usuário, divergências de contagem e soma em destino já populado e sigilo da saída.

### Evidência anterior do PGlite

Antes de rodar os testes desta revisão, o cache do Vitest do worktree, de **2026-11-27 às 21h29**, registrava `shared/financas/banco.test.ts` com `failed: false`. O registro era posterior à migration e ao arquivo de teste. A suíte contém nove casos. Ela não foi reexecutada nesta revisão, conforme a instrução de não rodar SQL. [Suíte de banco](../shared/financas/banco.test.ts)

Os casos cobrem a segunda aplicação da 0010 com dados existentes, o hash do token e suas permissões, RLS entre usuários e acesso anônimo, captura e duplicata dentro e fora de três minutos, data civil de Fortaleza, ordem de categorização e fallback para `Outros`, cota de 30 por hora, revogação, limite de aparelhos, fevereiro com 28 e 29 dias, repetição da geração, exclusão de parcela e isolamento da Meta a Dois.

A revisão ficou na árvore de trabalho. O FRTCASH serviu de referência de leitura. Não houve SQL, migração real, commit, push ou deploy nesta revisão.
