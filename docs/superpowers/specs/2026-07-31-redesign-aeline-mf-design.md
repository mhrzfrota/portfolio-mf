# Redesign "Aeline MF" — Portfólio MF Services

**Data:** 2026-07-31 · **Status:** aprovado em brainstorming
**Substitui:** `2026-07-24-redesign-atelie-design.md` (nunca implementado)

## 1. Contexto

O usuário trouxe uma análise detalhada da landing "Aeline" (consultoria de IA) como
referência a replicar. A direção é oposta à do spec Ateliê aprovado em 24/07 — que
propunha greige monocromático, tipografia gigante e rabiscos manuscritos, com motion
leve em CSS puro. O Ateliê nunca saiu do papel (nenhum step marcado no plano) e fica
arquivado.

Decisões tomadas no brainstorming:

| Questão | Decisão |
|---|---|
| Direção | Aeline substitui o Ateliê |
| Paleta | Estrutura Aeline (preto/cinzas/blocos) com o azul MF `#0C2AFE` no lugar do lime |
| Escopo | Linguagem nova aplicada às seções que já existem; nenhuma seção inventada |
| Hero 3D | Monograma **e** anel, os dois |
| Profundidade | Reconstrução da linguagem: tokens + padrões estruturais, reescrevendo componentes onde o DOM não comporta |
| Motion | GSAP 3.x + ScrollTrigger |

Nada de negócio muda: mesmas rotas, mesmos CTAs de WhatsApp com as mesmas mensagens,
currículo, i18n PT/EN, tema claro/escuro, acessibilidade.

## 2. Paleta

O lime `#D6FD70` do Aeline é uma cor **clara** usada como superfície com texto preto.
O `#0C2AFE` é **escura**, usada com texto branco (7.56:1). A troca não é 1:1 — preto
sobre `#0C2AFE` dá 2.6:1 e reprova. O papel do lime se divide:

- **CTA** → `#0C2AFE` com texto branco.
- **Superfície em destaque** (plano do meio, card de número) → `#0C2AFE` sólido com
  texto branco, em vez de superfície clara. O Combos já destaca o card do meio com
  `--brand-ink`; ele só troca de preto para azul.
- **Círculo preto do botão arrow** → círculo branco sobre a pílula azul.

### Tema claro

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#131313` | blocos escuros, texto primário |
| `--white` | `#FFFFFF` | página, cards |
| `--grey-50` | `#F2F2F2` | cards neutros, fundo de input |
| `--grey-100` | `#ECECEC` | bordas e divisores decorativos |
| `--grey-300` | `#C7C7C7` | **somente** estado desabilitado |
| `--grey-600` | `#585858` | texto secundário (7.08:1 no branco) |
| `--accent` | `#0C2AFE` | CTA e destaque — ocupa o lugar do lime |
| `--accent-ink` | `#001FDD` | hover do acento |
| `--sky` | `#38C6F6` | dados, ícone de destaque |
| `--green` / `--green-soft` | `#1DB82B` / `#CDFAD1` | delta positivo e seu badge |
| `--glass` | `rgba(18,40,53,.25)` | botão secundário sobre o hero |

### Tema escuro

O Aeline é light-only, mas o toggle existe e é preservado. A lógica "página clara,
blocos escuros flutuando" inverte preservando a relação:

página `#0A0A0A`, blocos de seção `#161616`, cards `#1E1E1E`, bordas `#2A2A2A`,
texto primário `#F2F2F2`, secundário `#9A9A9A`. Os blocos que já eram pretos
(Diagnóstico, footer) ficam `#1E1E1E` — mais claros que a página, mantendo a leitura
de "outro material". O acento clareia para `#5B7CFF` para manter contraste no escuro.

## 3. Tipografia

**Plus Jakarta Sans** (300–700) para headings e corpo. **Geist Mono** (400) para
eyebrows, labels e botões — sempre uppercase, `letter-spacing: 0.12em`, 16px.

Saem duas famílias: **Inter** (o Aeline usa Jakarta também no corpo) e
**Instrument Serif**, hoje usada só pelo TypeCycler. O `-0.06em` do Jakarta passa a
ser a voz da página.

O `@theme` atual remapeia os pesos (`--font-weight-bold: 600`, `--font-weight-normal: 300`).
O mapa é normalizado: headings em 500, corpo em 400.

| Papel | Tamanho | Tracking | Peso |
|---|---|---|---|
| h1 | `clamp(2.25rem, 6vw, 3.75rem)` | −0.06em | 500 |
| h2 | `clamp(1.875rem, 5vw, 3rem)` | −0.06em | 500 |
| h3 | `2.25rem` | −0.04em | 500 |
| h4 | `1.5rem` | 0 | 500 |
| h5/h6 | `1.125rem` | 0 | 500 |
| corpo | `1rem` | −0.02em | 400 |
| mono label | `16px` uppercase | 0.12em | 400 |

Todo heading com `line-height: 1.2`.

## 4. Layout

- `container` trava em **1280px** (as seções usam `max-w-[1440px]` hoje; unifica).
- Padding global: `16px 52px` desktop, `16px 24px` tablet, `16px 16px` mobile.
- **Seções encaixotadas:** cada seção é um bloco com `margin: 12px` e
  `border-radius: 24px` sobre fundo branco — a sensação de cartões flutuantes de
  página inteira é o que faz o site ler como Aeline. Em ≤767px: `margin 8px`,
  raio `16px`.
- Espaçamento vertical entre seções: 120px / 80px / 56px.
- Raios: cards internos 16–20px, pílulas e botões 80px.

### Botões (três variantes, substituem o RollButton atual)

1. **primary** — pílula azul sólida `#0C2AFE`, texto branco, altura 40–48px,
   `padding: 8px 20px`, `gap: 16px`.
2. **glass** — `rgba(18,40,53,.25)` + `backdrop-filter: blur(8px)`, texto branco.
   Só sobre o hero.
3. **arrow** — pílula azul com `padding: 4px` e círculo branco de 40px com seta
   diagonal ↗. No hover: o círculo gira 45°, a seta faz swap vertical com máscara de
   overflow, o fundo escurece 6%. Transição `cubic-bezier(.16,1,.3,1)` em 400ms.
   O roll do label do RollButton atual é preservado.

Uma quarta variante **dark** (`#131313`, texto branco) serve o botão full-width dos
cards de combo.

## 5. Mapeamento das seções

| Aeline | Componente MF | Tratamento |
|---|---|---|
| Navbar | `Layout.tsx` header | `absolute` sobre o hero, links Geist Mono uppercase, CTA azul |
| Hero + anel | `hero/Hero.tsx` | monograma + anel de projetos + céu fotográfico |
| Faixa de logos | `StackShowcase.tsx` | já é marquee; ganha máscara de gradiente lateral |
| Expertise 2×2 | `ProjectDeck.tsx` | mockups em 3D falso aplicados aos screenshots reais |
| Services 3 cards | `ProjectsCategoryPage.tsx` | borda `--grey-100`, hover desliza a foto para fora |
| — | `DiagnosticoSpotlight.tsx` | variantes `progress` e `orbit-reveal` (já tem `diag-bar` e `ScoreRing`) |
| Pricing | Combos, em `Home.tsx` | três cards, o do meio azul sólido |
| Blog | Blog, em `Home.tsx` | imagem full-bleed, hover zoom 1.06 |
| CTA final | Contato, em `Home.tsx` | bloco arredondado com foto de céu |
| Footer | `Layout.tsx` footer | bloco `#131313` arredondado com newsletter |

O Aeline pede foto de céu no hero e no CTA final. É a mesma imagem em loop que o
usuário está gerando à parte (ver §8).

## 6. O anel 3D do hero

Contêiner com `perspective: 2000px`. Wrapper com `transform-style: preserve-3d` e
`transform: rotateX(77deg) translateY(128px) translateZ(-320px)`, altura 1280px
(raio efetivo ≈ 640px). Três grupos rotacionados em Z com offsets 0°, −15° e −30°.
Cada grupo tem 9 itens distribuídos radialmente em passos de 45°; cada imagem
interna recebe `rotateX(-90deg)` para ficar em pé, perpendicular ao plano do disco.

Rotação contínua por `gsap.ticker.add()`, ~0.03°/frame, sentido único, sem easing.
`will-change: transform` e `backface-visibility: hidden` no wrapper, nunca nos filhos.

**Conteúdo:** os 27 slots são preenchidos com os screenshots reais dos projetos
(14 arquivos em `client/public/images`), cada um aparecendo cerca de duas vezes.
No Aeline os cards são mockups genéricos inventados; aqui o anel é a vitrine do
trabalho e antecipa a seção Projetos logo abaixo.

**Convivência com o monograma.** O anel é barato — 27 `<img>` e um único `rotateZ`
mutado por frame, trabalho de compositor. O caro é o canvas WebGL do monograma.

- Desktop: monograma vivo em Three.js + anel de três grupos, um `rAF` compartilhado.
- `pointer: coarse`: anel reduzido a dois grupos com cards de 110px; o monograma
  nunca libera o `sceneReady` do `useIdleReady`, ficando permanentemente no
  `FlatMonogram` SVG que já existe. O celular não paga WebGL nenhum.
- `prefers-reduced-motion`: o ticker não inicia, anel estático.

## 7. Sistema de animação

GSAP 3.x + ScrollTrigger, carregados com `defer`. Draggable, InertiaPlugin e Observer
ficam de fora — eram para o Swiper de depoimentos, que não é construído (os carrosséis
atuais usam `scroll-snap` nativo e continuam).

Sistema declarativo por atributo `data-anim`, com um `gsap.set('[data-anim]',
{ visibility: 'visible' })` na inicialização (o CSS inicia com `visibility: hidden`
para evitar FOUC). Smart trigger: se o elemento já está visível no load, dispara
imediatamente; se está abaixo da dobra, `ScrollTrigger` com `start: "top 85%"`,
`once: true`, tocando uma timeline `paused: true`.

Variantes:

| Variante | Comportamento |
|---|---|
| `hero` | split por palavra via JS (preserva espaços e o `aria-label` do h1); `autoAlpha` 0→1, `y` 24→0, `blur(8px)`→0, stagger 0.08, `power3.out`. Subtítulo e botões em sequência; o céu faz `scale` 1.08→1 em 1.6s |
| `card-reveal` | `autoAlpha` 0, `scale` 0.92→1, 0.55s, `power3.out` |
| `fade-up` | `autoAlpha` 0, `y` 10→0, 0.4s, stagger 0.1, `power2.out` |
| `progress` | `width` 0%→final, `power2.inOut` |
| `stagger-rows` | filhos de `x` 20→0 com `autoAlpha`, 0.4s, stagger 0.1 |
| `bar-grow` | `scaleY` 0→1, `transformOrigin: bottom center`, 0.6s, stagger 0.09, `back.out(1.4)` |
| `stagger-text` | linhas de `autoAlpha` 0, `y` 12→0, 0.35s, stagger 0.09 |
| `orbit-reveal` | anéis em fade 0.25s; pílulas orbitais `scale` 0→1, 0.45s, `back.out(2)`, ângulo por `Math.cos/sin` |
| `pill-float` | loop `yoyo` de ±6px, `delay` dessincronizado, `sine.inOut` |
| `marquee-left/right` | conteúdo duplicado, `x` animado com `repeat: -1`, `ease: none`, `modifiers` com `gsap.utils.unitize`; velocidade proporcional à largura; pausa no hover |
| contadores | valor inicial→final em ~1.2s ao entrar na viewport |

`useRevealOnScroll` e o CSS `[data-reveal]` são **removidos**. Ter GSAP e
IntersectionObserver animando ao mesmo tempo traria de volta o travamento que o
commit `7ceba1b` corrigiu.

Em `prefers-reduced-motion: reduce`, todo motion não essencial é desativado; só
fades curtos permanecem.

## 8. Fundo de céu

O hero e o bloco de CTA final usam uma foto de céu com nuvens em movimento, gerada
à parte pelo usuário. A integração:

- `.hero-sky` (o degradê CSS atual) permanece como camada base e fallback.
- Vídeo por cima com `object-fit: cover`, `object-position: 50% 30%`,
  `autoplay muted loop playsinline preload="none"` e `poster`.
- Scrim obrigatório sobre o vídeo:
  `linear-gradient(180deg, transparent 0%, rgba(255,255,255,.35) 45%, rgba(255,255,255,.85) 78%, #fff 100%)`.
  Garante os 4.5:1 do parágrafo e costura a emenda com o fundo da página.
- Em `pointer: coarse` e `prefers-reduced-motion`: só o poster, sem vídeo.

Enquanto os arquivos não existem, o degradê CSS atual serve sozinho e o markup do
vídeo fica pronto para receber os arquivos.

## 9. Contraste

Correções medidas na auditoria, embutidas no redesign:

| Problema | Medido | Resolução |
|---|---|---|
| `outline-ring/50` | 2.07:1 claro, 2.26:1 escuro | anel `--accent` 2px sólido + `outline-offset: 2px` → 7.56:1 |
| `--border` em 1px | 1.25:1 | `--grey-100` fica em divisor decorativo; **inputs passam a ter fundo `--grey-50`** e deixam de depender da borda para serem identificados |
| `text-muted-foreground/50` e `/60` | 2.27–2.84:1 | removidos; `--grey-600` sólido dá 7.08:1 |
| `text-border` no toggle PT/EN | 1.29:1 | `--grey-600` + `aria-hidden` |
| hover que enfraquece o link | — | hover reforça: `--grey-600` → `--ink` |
| parágrafo do hero sobre o céu | 4.42:1 | scrim (§8) |

`--grey-300` (~1.9:1 no branco) é usado **somente** em estado desabilitado, que a
WCAG 1.4.3 isenta — nunca para texto de apoio.

## 10. Acessibilidade e performance

Landmarks semânticos, hierarquia de headings correta, `aria-label` no h1 com split
de texto e `aria-hidden` nos spans decorativos, `aria-expanded`/`aria-controls` no
menu mobile, foco visível em todos os interativos, alt text descritivo.

Imagens do anel em WebP com `loading="lazy"` fora da dobra; anima apenas `transform`
e `opacity`; `will-change` cirúrgico; `content-visibility: auto` nas seções distantes.

Alvos: LCP < 2.5s, CLS < 0.05, 60fps na rotação do anel.

## 11. Fora de escopo

- Swiper 11 e o slider de depoimentos (não há depoimentos reais).
- Seções About bento, Expertise com mockups inventados e Pricing de agência —
  Combos já é o Pricing, Projetos já é o Expertise.
- Reescrita em HTML/CSS/vanilla: o React 19 + Vite + Tailwind 4 existente reproduz
  a referência 1:1.
