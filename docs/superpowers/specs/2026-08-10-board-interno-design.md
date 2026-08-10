# Board interno — design

Data: 2026-08-10
Status: aprovado (colunas editáveis, link discreto na barra inferior do rodapé)

## Objetivo

Um quadro de tarefas pessoal ("tipo um Trello bem simples e minimalista") dentro
do portfolio, em rota própria, com visual liquid glass sobre fundo azul. Uso
interno do Matheus; por enquanto aberto, sem login.

## Escopo

- **Rota**: `/board`, registrada em `client/src/App.tsx` **fora do `Layout`** —
  a página é tela cheia, sem header/footer do site, com um link discreto
  "← voltar" para a home.
- **Página**: `client/src/pages/Board.tsx` (UI) + `client/src/features/board/`
  (lógica pura + testes), seguindo o padrão do diagnóstico.
- **Listas editáveis**: criar, renomear e excluir listas. O primeiro acesso
  semeia três listas padrão ("A fazer", "Fazendo", "Feito").
- **Cartões**: adicionar, editar texto, excluir e arrastar entre listas
  (drag & drop nativo HTML5, sem dependência nova).
- **Persistência**: `localStorage` (chave `mf-board:v1`). O servidor Express só
  serve estáticos, então não há backend a envolver.
- **Rodapé**: link pequeno na barra inferior (perto do copyright), com string
  pt/en em `client/src/i18n/strings.ts`. A UI do board em si é só pt-BR
  (ferramenta pessoal).

## Visual

- Fundo azul em gradiente com os tokens existentes (`--brand-blue` #2453ff →
  `--brand-blue-dark` #003cff) e blobs suaves de luz para o glass refratar.
- Listas e cartões em liquid glass: `backdrop-blur`, superfícies `bg-white/10`,
  bordas `white/15`, highlight interno no topo.
- Tipografia do site: Plus Jakarta Sans no corpo, Geist Mono (`mono-label`) em
  labels e contadores.
- Página sempre "escura" (texto branco sobre azul), independente do tema do
  site.

## Arquitetura

- `features/board/types.ts` — `BoardCard`, `BoardList`, `BoardState`.
- `features/board/store.ts` — funções puras (`addList`, `renameList`,
  `removeList`, `addCard`, `editCard`, `removeCard`, `moveCard`) +
  `loadBoard`/`saveBoard` sobre `localStorage`, com estado inicial semeado.
- `features/board/store.test.ts` — testes vitest das funções puras.
- `pages/Board.tsx` — componente com `useState` + persistência via efeito;
  drag & drop com atributos nativos (`draggable`, `onDragStart`, `onDrop`).

## Erros e limites

- `localStorage` indisponível ou corrompido → cai no estado semeado sem quebrar.
- Dados são por navegador/dispositivo (sem sync) — aceito para "por enquanto".
- Sem autenticação: a rota é pública, mas não listada na navegação principal.

## Testes

- Unitários (vitest) para todas as funções puras do store, incluindo casos de
  borda: mover para a mesma lista, remover lista com cartões, carregar JSON
  inválido.
- Verificação manual da UI via `pnpm dev` (drag & drop, persistência ao
  recarregar).
