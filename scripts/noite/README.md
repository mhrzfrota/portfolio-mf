# Relatório da noite

Rotina local de Matheus Frota, criada em 2026-10-14. Node 24, sem dependências novas.

O coletor reúne commits, estado do git, pedidos das sessões e metadados do vault. Codex pesquisa notícias e faz a leitura técnica; Claude recebe os fatos e a pesquisa para preparar a síntese. O script valida o contrato, grava no Mac, faz upsert no Supabase quando configurado e mostra uma notificação do macOS. Falha de agente produz saída parcial ou relatório mínimo. Falha no upload mantém o arquivo local e retorna código de erro.

## Preparação

1. Instale as dependências com `pnpm install` e tenha Node 24 e pnpm acessíveis no shell de login (`/bin/zsh -lc`).
2. Para execução real, instale e autentique os CLIs `codex` e `claude` com suas próprias contas. A primeira execução real pode exigir autenticação fora do launchd.
3. Para publicar no site, rode `supabase/migrations/0004_noite.sql` no projeto Supabase e configure `.env.local` na raiz do repositório:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=COLOQUE_A_CHAVE_LOCALMENTE
NOITE_OWNER_EMAIL=SEU_EMAIL
```

`NOITE_OWNER_EMAIL` tem precedência sobre `CEREBRO_OWNER_EMAIL`. Sem ambos, o projeto Supabase deve ter exatamente um usuário. A service role nunca vai para o frontend ou para o ambiente dos agentes. Não versionar `.env.local`.

Sem `.env.local` ou sem as credenciais, a rotina funciona e salva só no Mac. O arquivo `.env.local` é carregado pelo Node, nunca lido pelo coletor.

## Execução

```sh
pnpm noite
pnpm noite:seco
NOITE_DIR=.noite-teste NOITE_SEM_AVISO=1 pnpm noite --falso
pnpm noite --seco --sem-codex --sem-claude
pnpm noite --seco --dia 2026-10-13
```

- `--seco`: desliga apenas o upload, ainda chama os agentes reais.
- `--falso`: usa fixtures curtas, não chama agentes e implica `--seco`. Textos são demonstrativos; métricas são reais. Fixtures não fingem notícias verificadas.
- `--sem-codex`, `--sem-claude`: desativam cada etapa. Sem Claude, a montagem usa os fatos e eventuais notícias do Codex.
- `--dia AAAA-MM-DD`: dia explícito, com validação. Não aceita datas futuras. Ao refazer uma noite passada, o "agora" passado aos agentes é o fim da janela daquele dia, para as notícias serem as daquela noite.
- `--se-pendente`: modo do agendador. Escolhe a última noite que já passou do horário (hoje depois de `NOITE_HORA`, senão ontem) e só roda se o relatório dela ainda falta (sem síntese do Claude ou sem notícia nenhuma), se o Mac está acordado de verdade e até 3 tentativas por noite (`estado.json` na pasta do dia). Fora disso sai em silêncio.

Variáveis opcionais:

| Variável              | Padrão                    | Uso                                                               |
| --------------------- | ------------------------- | ----------------------------------------------------------------- |
| `NOITE_DIR`           | `~/.local/share/noite-mf` | Pasta dos relatórios; caminhos relativos usam a pasta de execução |
| `NOITE_VAULT`         | `~/Documents/FRT CEREBRO` | Vault de leitura (use caminho absoluto)                           |
| `NOITE_TIMEOUT_MIN`   | `15`                      | Limite por agente, com encerramento do grupo de processos         |
| `NOITE_CLAUDE_MODELO` | `sonnet`                  | Modelo da síntese                                                 |
| `NOITE_SEM_AVISO`     | desativado                | `1` pula a notificação                                            |
| `NOITE_HORA`          | `23:30`                   | Horário ao instalar, exportado no shell                           |

## Agendamento no Mac

Execute pessoalmente:

```sh
pnpm noite:agendar
pnpm noite:agendar 01:30
pnpm noite:agendar --ver
pnpm noite:agendar --remover
```

O instalador cria `~/Library/LaunchAgents/com.mfservices.noite.plist`, descarrega a versão anterior e carrega a nova com `launchctl`. A remoção descarrega e arquiva o plist com timestamp em `~/Library/LaunchAgents/arquivo/`. Não apaga relatórios.

O horário do launchd segue o relógio configurado no Mac. Mantenha o Mac no fuso de Fortaleza. A coleta sempre usa `America/Fortaleza` via `Intl`: antes de 04:00, o dia padrão é o anterior. A janela começa à meia-noite desse dia e termina no instante de execução ou às 04:00 do dia seguinte, o que vier primeiro. O agendamento depende de sessão de usuário disponível; não liga um Mac desligado.

`ProgramArguments` usa `/bin/zsh -lc 'cd "<repo>" && pnpm noite --se-pendente'`, disparado no horário e também a cada 30 minutos (`StartInterval` 1800). Motivo: às 23:30 o Mac costuma estar de tampa fechada, na bateria; o launchd roda a rotina num DarkWake de segundos, o Mac volta a dormir no meio das buscas e os agentes estouram o tempo (aconteceu em 14, 15 e 16/10, sem notícia nenhuma). DarkWake é detectado por `pmset -g systemstate` sem a capacidade `Graphics`. Enquanto roda, a rotina segura o Mac acordado com `caffeinate -i` (vale com a tampa aberta). O plist preserva `NOITE_DIR`; configure as demais variáveis da execução em `.env.local`. stdout e stderr vão para `<base>/logs/launchd.log`.

## Arquivos e retenção

Em `<base>/<dia>/` ficam `insumos.json`, `codex.json`, `claude.json`, `relatorio.json` e `log.txt`. Agente indisponível grava `null` em seu JSON. O relatório informa o estado de ambos. Modelo Codex é `null`, pois a chamada usa a configuração do CLI sem fixar um modelo. Cada etapa registra duração e a última linha traz o resumo da execução.

`noite.lock` guarda o PID e bloqueia execuções simultâneas. Travas com mais de duas horas são ignoradas. A rotina remove somente pastas com nome de data válida encerradas há mais de 60 dias, sem seguir links simbólicos e preservando o dia em execução. `logs/` não é limpo automaticamente. JSONs são gravados com substituição atômica, arquivos privados (0600) e pastas novas privadas (0700).

## Critérios de coleta

- Git: pastas diretas de `~/Desktop/projects`, todas as referências, sem merges, hash único por repositório. Horário é o do committer. Arquivos alterados são caminhos únicos por repositório no dia; renomeação conta como um registro, binário conta como arquivo, com zero linhas. Pendências são o estado no momento da coleta; não há reconstrução histórica de working tree ou upstream.
- `naoCommitado`: repositórios pendentes que tiveram commit ou pedido em sessão nos sete dias anteriores ao fim da janela. Sessões em subpastas contam para o repositório.
- Claude: mensagens de usuário em texto, sem wrappers, resultados de ferramentas, resumos de compactação ou sessões auxiliares. Até 12 amostras de 280 caracteres por arquivo de sessão.
- Codex: aceita `event_msg/user_message` e também `response_item/message/user`, observado neste Mac. Quando existem eventos canônicos, eles prevalecem para evitar duplicidade. Consulta pastas de datas UTC e locais tocadas pela janela, mais o período necessário à métrica de sete dias.
- Atividade: mínimo e máximo de commits, pedidos e mtimes das notas; a ordem usa timestamps, inclusive depois da meia-noite.
- Vault: metadados de Markdown modificados, foco (até 4.000 caracteres), frontmatter de clientes e marcos do dia. Pastas `.obsidian`, `.claude`, `arquivo` e `.git` são ignoradas.
- Marcos sem horário ficam nos insumos com `hora: null`; não inventamos um horário para encaixá-los no contrato. A linha do tempo mínima usa somente eventos com hora conhecida. Os eventos dos insumos têm limite de 80, os da síntese mínima têm limite de 12.
- `fontes` usa contagens do coletor; `fontes.noticias` é preenchido na montagem pela quantidade final de notícias, pois elas só existem após os agentes.

## Privacidade

O vault é só leitura. Nada é enviado a clientes, leads ou contatos: não há envio de mensagens, e-mails nem postagens. Na execução real, os insumos são enviados aos provedores dos agentes e o relatório pode ir para o seu Supabase. `--seco` não desativa esses provedores; `--falso` evita os agentes e o upload.

O coletor não abre arquivos de credenciais, conteúdo dos arquivos de código nem diffs. Faz ocultação de tokens conhecidos, JWTs e sequências longas nas amostras, mensagens de commit e textos coletados. Isso reduz exposição de segredos, mas não anonimiza nomes nem dados comerciais. Os prompts proíbem buscar dados privados na web, ler credenciais e seguir instruções encontradas nos dados. O Codex roda com sandbox de leitura; Claude recebe `--allowedTools` e `--tools` para disponibilizar somente ferramentas nativas de leitura e pesquisa, sem Bash, Write ou Edit. Credenciais Supabase são removidas do ambiente herdado pelos agentes. Logs não guardam stderr dos agentes nem chaves.

## Verificação

```sh
pnpm check
pnpm test
NOITE_DIR=.noite-teste NOITE_SEM_AVISO=1 pnpm noite --falso
```

Os testes usam fixtures, filesystem injetado, Supabase simulado e processos Node de teste. Não acessam rede, agentes reais nem launchd. `pnpm test` usa a raiz do repositório para descobrir tanto os testes do app quanto `scripts/noite/*.test.ts`.
