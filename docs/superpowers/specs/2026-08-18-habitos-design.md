# Hábitos (tela interna) — design

Data: 2026-08-18
Status: implementado

## Objetivo

Marcar todo dia um check em tarefas recorrentes ("tomar creatina", "ler um
livro") e depois olhar relatórios desse histórico. Segue a linguagem do
[board interno](2026-08-10-board-interno-design.md), com as superfícies mais
encorpadas — as caixas do board ficaram claras demais para uma tela que é
quase toda caixa.

## Escopo

- **Rota**: `/habitos`, registrada em `client/src/App.tsx` **fora do `Layout`**,
  como o board. Links cruzados: pílula "Hábitos" no topo do board, pílula
  "Board" no topo dos hábitos e link discreto no rodapé do site.
- **Aba Hoje**: navegação por dia (dá para marcar dias passados), barra de
  progresso do dia, uma linha por hábito com círculo de check grande, sequência
  atual e fita dos últimos 7 dias. Criar, renomear, excluir e reordenar
  (drag & drop nativo, igual ao board).
- **Aba Relatórios**: quatro números do conjunto (hábitos, aderência 30d,
  sequência atual, marcações totais), barras dos últimos 14 dias e, por hábito,
  7d/30d/total mais um heatmap de 26 semanas.
- **Persistência**: `localStorage`, chave `mf-habits:v1`.

## Arquitetura

- `features/habits/types.ts` — `Habit`, `HabitsState`, `HabitStats`.
- `features/habits/store.ts` — datas em ISO local, mutações puras
  (`addHabit`, `renameHabit`, `removeHabit`, `toggleDay`, `reorderHabits`) e
  relatórios (`currentStreak`, `bestStreak`, `statsFor`, `doneOn`, `activeOn`).
- `features/habits/store.test.ts` — 27 testes vitest das funções puras.
- `pages/Habits.tsx` — UI, com `useState` + persistência por efeito.

## Decisões

- **Datas em ISO local, nunca `toISOString()`**: em UTC-3 o dia viraria às 21h.
- **Sequência conta de ontem quando hoje está em aberto** — senão o número
  zeraria toda madrugada, antes de o dia ter chance de ser cumprido.
- **`createdAt` por hábito**: o denominador de "3 de 5" e as janelas de 7/30
  dias ignoram dias anteriores à criação, e o heatmap deixa esses dias ocos.
  Marcar retroativamente um dia anterior à criação recua o `createdAt`.
- **Contraste**: `.habit-glass` / `.habit-card` sobem fundo (0.19–0.20) e borda
  interna (0.24–0.26) em relação ao board; a linha marcada vai a 0.33.

## Erros e limites

- `localStorage` indisponível ou corrompido → cai no estado semeado (três
  hábitos de exemplo) sem quebrar.
- Dados por navegador/dispositivo, sem sync nem login — mesma escolha do board.
