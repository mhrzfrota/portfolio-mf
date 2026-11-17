# Brief: camada de dados da aba Conteúdo (Codex)

Repositório: `~/Desktop/projects/portfolio-mf`, branch `feat/aba-conteudo`. **Não commitar.** Não mexer em nenhum arquivo fora da lista abaixo. A interface (páginas e componentes) é do Claude: não criar nada em `client/src/pages` nem em `client/src/components`.

## Contexto
O sistema interno já tem a aba Plano (quadro estilo Trello). A aba nova, **Conteúdo**, é o estúdio de criação de conteúdo do Matheus (Instagram @emefeservices). Siga **exatamente o mesmo molde** do Plano:
- `client/src/features/plano/quadro.ts` (modelo, validação `ehQuadro`, operações puras, carregar/salvar no localStorage)
- `client/src/features/plano/nuvem.ts` (Supabase, trava de versão)
- `client/src/features/plano/use-quadro.ts` (hook: nuvem, cópia local, estado "local" quando a tabela não existe)
- `supabase/migrations/0003_plano.sql` (uma linha por usuário com o JSON inteiro, RLS do dono, `versao` carimbada pelo banco)
Leia esses quatro arquivos e os testes deles antes de começar.

## Arquivos a criar
1. `client/src/features/conteudo/estudio.ts`
2. `client/src/features/conteudo/estudio.test.ts`
3. `client/src/features/conteudo/nuvem.ts`
4. `client/src/features/conteudo/nuvem.test.ts`
5. `client/src/features/conteudo/use-estudio.ts`
6. `client/src/features/conteudo/semente.ts` **só o esqueleto**: `export function semente(): Estudio` retornando `estudioVazio()`. O Claude preenche depois.
7. `supabase/migrations/0009_conteudo.sql` (tabela `conteudo`, mesmo desenho da 0003, com `conteudo_carimbar`; limite de 2 MB; idempotente; NÃO aplicar no banco).

## Modelo (contrato, use estes nomes exatos)
```ts
export type EtapaId = "ideias" | "roteiro" | "producao" | "pronto" | "publicado";
export const ETAPAS: { id: EtapaId; titulo: string; descricao: string }[] = [
  { id: "ideias", titulo: "Ideias", descricao: "Semente: o assunto e o ângulo" },
  { id: "roteiro", titulo: "Roteiro", descricao: "Gancho, meio e fim escritos" },
  { id: "producao", titulo: "Produção", descricao: "Gravando, editando, montando slides" },
  { id: "pronto", titulo: "Pronto", descricao: "Aprovado, esperando a data" },
  { id: "publicado", titulo: "Publicado", descricao: "No ar, com os números" },
];

// As 7 categorias (ângulos) do método de conteúdo documentativo
export type AnguloId = "sacada" | "rotina" | "analise" | "faq" | "opiniao" | "reflexao" | "historia";
export const ANGULOS: { id: AnguloId; nome: string; cor: string; serve: string; esqueleto: string[] }[];
//  sacada   "Sacada"   #0A84FF serve "Insight rápido do dia"                         esqueleto ["O que eu percebi", "Por que importa", "O que fazer"]
//  rotina   "Rotina"   #30D158 serve "Bastidor e processo, humaniza sem ensinar"     esqueleto ["Onde eu estou", "O que estou fazendo", "Por que faço assim"]
//  analise  "Análise"  #BF5AF2 serve "Leitura crítica de algo do mercado"            esqueleto ["O que eu vi", "Minha leitura", "O que se tira disso"]
//  faq      "FAQ"      #FF9F0A serve "Dúvida real de cliente, tira objeção"          esqueleto ["A pergunta", "A resposta direta", "O próximo passo"]
//  opiniao  "Opinião"  #FF453A serve "Posição clara: atrai quem pensa igual"         esqueleto ["Minha posição", "Por quê", "O que eu faço no lugar"]
//  reflexao "Reflexão" #64D2FF serve "A pessoa por trás do profissional"            esqueleto ["O pensamento", "De onde veio", "O que mudou em mim"]
//  historia "História"  #FFD60A serve "Momento que me moldou, gera identificação"   esqueleto ["Contexto", "Conflito", "Virada"]

export type Profundidade = "raso" | "profundo";   // raso = alcance (topo), profundo = autoridade e venda (fundo)
export type FormatoId = "carrossel" | "reel" | "stories" | "foto" | "live" | "texto";
export const FORMATOS: { id: FormatoId; nome: string }[]; // Carrossel, Reel, Stories, Foto, Live, Texto

export type Metricas = { visualizacoes: number | null; alcance: number | null; curtidas: number | null; comentarios: number | null; salvamentos: number | null; compartilhamentos: number | null; visitasPerfil: number | null; seguidores: number | null; };

export type Peca = {
  id: string; etapa: EtapaId; titulo: string;          // título 1..140
  tematica: string;                                     // id de Tematica ou "" (deve existir em estudio.tematicas)
  angulo: AnguloId | ""; profundidade: Profundidade | ""; formato: FormatoId | "";
  gancho: string;                                       // até 300
  roteiro: string;                                      // até 8000 (texto livre, quebras de linha preservadas)
  legenda: string;                                      // até 2200 (limite do Instagram)
  data: string;                                         // "" ou YYYY-MM-DD (data de publicação planejada/real)
  link: string;                                         // "" ou URL http(s)
  metricas: Metricas;
  checklist: { id: string; texto: string; feito: boolean }[]; // até 30, texto até 200
  criadoEm: string; atualizadoEm: string; publicadoEm: string; // YYYY-MM-DD; publicadoEm preenchido ao entrar em "publicado", limpo ao sair
};

export type GrupoNota = "metodo" | "posicionamento" | "voz" | "ganchos" | "narrativas" | "referencias" | "aprendizados";
export const GRUPOS: { id: GrupoNota; nome: string }[]; // Método, Posicionamento, Voz, Ganchos, Narrativas, Referências, Aprendizados
export type Nota = { id: string; grupo: GrupoNota; titulo: string; texto: string; fixada: boolean; atualizadoEm: string }; // titulo 1..120, texto até 12000

export type Tematica = { id: string; nome: string; cliente: string; eu: string; cor: string }; // nome 1..60; cliente/eu até 1000 (os dois lados da interseção); cor #RRGGBB

export type Estudio = { versao: 1; pecas: Record<EtapaId, Peca[]>; notas: Nota[]; tematicas: Tematica[] };
```

## Funções (puras, imutáveis, lançam Error com mensagem em PT-BR quando a regra recusa)
- `estudioVazio()`, `ehEstudio(v: unknown): v is Estudio` (validação completa e estrita, como `ehQuadro`; ids únicos no estúdio inteiro; peça na lista da etapa certa; `tematica` referencia uma existente)
- Peças: `adicionarPeca(e, entrada: NovaPeca, hoje?)`, `editarPeca(e, id, patch)`, `moverPeca(e, id, etapa, indice)`, `duplicarPeca`, `removerPeca`, `encontrarPeca`, `adicionarItem/alternarItem/editarItem/removerItem` (checklist), `editarMetricas(e, id, patch: Partial<Metricas>)` (inteiros >= 0 ou null)
- Temáticas: `adicionarTematica`, `editarTematica`, `removerTematica` (remover limpa `tematica` das peças que usavam)
- Notas: `adicionarNota`, `editarNota`, `removerNota`, `alternarFixada`
- Consultas: `filtrarPecas(e, { busca?, angulo?, tematica?, profundidade?, formato? })` (busca sem acento em título, gancho, roteiro e legenda; devolve Estudio com as mesmas etapas), `notasDoGrupo(e, grupo)` (fixadas primeiro, depois mais recentes), `equilibrio(e, { de, ate })` → contagem por ângulo, por profundidade e por formato das peças com `data` no intervalo (inclusive), `semana(e, inicioISO)` → 7 dias com as peças de cada dia (por `data`), `atrasada(p, hoje?)` (tem data < hoje e etapa diferente de publicado)
- `carregarEstudio(storage, userId, semente)` / `salvarEstudio(storage, userId, e)` com chave `mf-conteudo:v1:${userId}` (mesmo comportamento das funções do Plano: inválido não sobrescreve)
- `hojeISO` reaproveitar de `@/features/plano/store` (data local, não UTC).

## nuvem.ts e use-estudio.ts
Copiar o desenho de `plano/nuvem.ts` e `plano/use-quadro.ts`, trocando a tabela para `conteudo`, o validador para `ehEstudio` e a semente. Hook: `useEstudioNuvem(userId, avisar)` → `{ estudio, aplicar, estado, salvando }`, mesmos estados (`carregando | pronto | local | sem-conexao | invalido`). Mensagens falando em "estúdio" em vez de "quadro".

## Testes (vitest)
Cobrir: validação (aceita o vazio e a semente; recusa id repetido, etapa errada, temática inexistente, data inválida, métrica negativa, legenda > 2200), cada operação, `publicadoEm` entrando e saindo, remover temática limpando peças, `equilibrio`, `semana`, `filtrarPecas` sem acento, nuvem (ok, vazio, sem-tabela, conflito) com cliente falso como em `plano/nuvem.test.ts`.

## Pronto quando
`pnpm check` e `pnpm test` passam (a suíte inteira, não só os novos). Ao terminar, responda com `maestri ask "Claude Maestro" "<resumo: arquivos, o que testou, o que ficou de fora>"`.
