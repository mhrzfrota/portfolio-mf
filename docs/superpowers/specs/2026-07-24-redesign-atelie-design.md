# Redesign "Ateliê" — Portfólio MF

**Data:** 2026-07-24 · **Status:** aprovado em brainstorming (companion visual, opção A)

## 1. Contexto e objetivo

Reformular o visual do portfólio (matheus-frota-portfolio) no estilo das referências
budarina.studio (dominante) e outcrowd.io (secundária). A direção foi escolhida entre
três variantes apresentadas visualmente; a aprovada foi **A — Ateliê**: site claro,
quase monocromático (greige + branco + preto), tipografia apertada e gigante,
humanizado por rabiscos manuscritos e balões de depoimento. **A cor entra pelos
projetos**, não pela interface. O azul MF `#0C2AFE` é demovido a micro-acento.

A pesquisa extraiu do CSS real das referências: Budarina usa fundo `#EDEDED`, cards
brancos, pílulas pretas `#1F1F1F`, Inter Display/Plus Jakarta Sans com tracking
−0.05em, anotações Gloria Hallelujah, dot vermelho `#ED3131` pulsante com glow,
folha preta no rodapé com feixes de luz (skewX 45°) e anel orbital de thumbnails.
Da Outcrowd herdamos apenas princípios de motion (reveals escalonados, marquees
com fade) — sem Lenis/GSAP: o motion do Ateliê é leve, CSS + IntersectionObserver.

Nenhuma estrutura de negócio muda: mesmas rotas, mesmos CTAs de WhatsApp com as
mesmas mensagens, currículo, i18n PT/EN, tema claro/escuro, acessibilidade.

## 2. Tokens de design (client/src/index.css)

### Cores — tema claro (padrão)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#EDEDED` | fundo da página (hero incluso — o degradê hero-sky morre) |
| `--card` | `#FFFFFF` | cards, navbar pill |
| `--secondary` / `--muted` | `#F3F3F3` | caixas internas, chips, capas neutras |
| `--foreground` | `#161616` | headings |
| `--body` (novo) | `rgba(0,0,0,0.65)` | texto corrido (padrão Budarina `#000000A6`) |
| `--muted-foreground` | `#6A6A6A` | secundário (≥4.5:1 sobre #EDEDED) |
| `--brand-ink` | `#1F1F1F` | pílulas pretas, balões, folha do rodapé |
| `--border` | `#D9D9D9` | bordas e divisores |
| `--dot` (novo) | `#ED3131` | exclusivo do dot de disponibilidade (glow `0 0 20px rgba(237,49,49,.5)`) |
| `--accent-blue` (novo, tokeniza o hardcoded) | `#0C2AFE` | links, micro-acentos, hover de título |

### Cores — tema escuro (adaptação, toggle preservado)

`--background #0F0F0F`, `--card #1A1A1A`, `--secondary #171717`, `--foreground #F2F2F2`,
`--body rgba(255,255,255,0.65)`, `--muted-foreground #9A9A9A`, `--border #2A2A2A`.
Pílulas de CTA invertem: fundo `#EDEDED`, texto `#161616`. `--brand-ink` continua escuro
(a folha do rodapé é escura nos dois temas). Dot vermelho igual.

Sombras canônicas (substituem as ad-hoc): cards `0 3px 4px -2px rgba(0,0,0,.1)`,
hover `0 18px 40px rgba(0,0,0,.10)`, chips inset `inset 0 2px 3px rgba(0,0,0,.08)`.
Raios: pills `999px`, cards `16–24px`, folhas full-bleed `40–64px`.

### Tipografia (client/index.html + index.css)

| Papel | Fonte | Detalhes |
|---|---|---|
| Display/headings | **Plus Jakarta Sans** 500/600/700 + itálico 600 | H1 `clamp(2.2rem, 6vw, 4.5rem)`, ls −0.05em, lh 0.95–1.0, text-wrap balance; H2 seção `clamp(1.8rem, 4vw, 3.5rem)`, ls −0.04em |
| Corpo | **Inter** 400/500 | 15–16px, lh 1.5 |
| Rabiscos | **Gloria Hallelujah** (fallback Caveat, cursive) | anotações decorativas; verificar acentos PT no build |
| Status/labels | **Noto Sans Mono** 500 | 12px, uppercase, ls 0.12em |

Saem: Titillium Web, Instrument Serif, e o remapeamento de pesos `.font-*` do
`@theme` (volta escala padrão). Carregamento mantém o padrão não-bloqueante atual.

## 3. Seção por seção

### 3.1 Navbar (Layout.tsx)
Pill branca flutuante com `backdrop-blur` e sombra leve (dark: `#1A1A1A`). Logo à
esquerda, 5 âncoras (scroll-spy mantido; item ativo **preto e bold**, não azul),
relógio de Fortaleza, toggles PT/EN e tema, CTA pill preta "Vamos conversar" →
`WHATSAPP_BUDGET_URL`. Bottom-sheet mobile re-estilizado com os mesmos tokens.

### 3.2 Hero (Hero.tsx — reescrito)
Centralizado, fundo chapado `--background`, sem monograma, sem sky/clouds/grain:
1. **Balões de depoimento** flutuando ao redor da headline (1–3): card `--brand-ink`,
   radius 14px, rabinho SVG, quote Inter itálica 14px + autor 11px, rotações ±4°.
   Lidos de `data/testimonials.ts` (novo): `{ quote, author, role }` por idioma —
   **se vazio, não renderizam** (usuário fornece frases reais depois).
2. **Rabisco** Gloria Hallelujah (i18n, ex.: "é sério, olha os projetos ↓") apontando
   para a âncora #projetos, `aria-hidden`.
3. **H1** Plus Jakarta 600: frase com **TypeCycler mantido** — a palavra final cicla
   em *itálico 600* (landing pages → dashboards → automações, de `t.hero.areas`,
   reiniciado por `key={lang}`). O caret `.type-caret` continua.
4. Sub de 1–2 linhas (Inter, `--body`).
5. **CTA primário**: pill preta com cluster de avatares dentro — círculo "Você" +
   círculo com foto/logo MF — "Chamar no WhatsApp" → `WHATSAPP_BUDGET_URL`.
   **CTA secundário**: microcopy com seta ASCII "Ver projetos →" (âncora).
6. **Status**: Noto Sans Mono uppercase "DISPONÍVEL PARA NOVOS PROJETOS" + dot
   vermelho pulsante (i18n; texto editável em strings.ts).

`RotatingFacts` sai do hero (componente removido; strings de facts permanecem no
i18n para uso futuro). Classes mortas `btn-drain-*` removidas.

### 3.3 Stack (StackShowcase.tsx)
Marquee atual mantido, logos com `filter: grayscale(1) opacity(.55)` e hover que
devolve cor; kicker vira mono uppercase. Fade lateral por mask já existe.

### 3.4 Projetos
- **BentoCollage** (novo, substitui ProjectDeck — arquivo deletado): colagem
  full-bleed logo após o hero, 6–8 tiles em grid assimétrico (2 fileiras), misturando
  imagens e **vídeos autoplay muted** dos projetos featured (reusa `LazyVideo` com
  IntersectionObserver + `preload="none"` + poster). Tiles radius 16px, sombra suave,
  hover: leve zoom + rabisco "ver case →" (Gloria) aparecendo. Cada tile → `/projetos/:slug`.
  Reduced-motion: vídeos viram posters estáticos.
- **ProjectsCategoryPage**: estrutura e drag-scroll mantidos; re-skin: filtros em
  pills (ativa preta, inativa branca com borda), cards brancos, tags outline,
  ícones de link em círculos com borda.

### 3.5 MF Diagnóstico IA (DiagnosticoSpotlight.tsx)
De painel azul-escuro para **folha branca full-bleed de cantos gigantes (radius
48–64px)** — o momento "produto": badge pill preta "PRODUTO", título com palavra em
itálico, bullets com check, CTA pill preta → `/diagnostico` (único caminho, mantido
fora da navbar). À direita, o anel de score re-colorido: traço `#161616` sobre
`#F3F3F3`, número gigante, micro-acento azul. Glows azuis saem.

### 3.6 Combos (Home.tsx)
Padrão de pricing Budarina: **1 card largo destacado** (Operação & Dados, tag pill
preta "Mais escolhido", lista de features à direita em 2 colunas) sobre **2 cards
lado a lado**. Todos brancos; destaque por tamanho e tag, não por fundo escuro.
Preços no formato "R$ 500 **[fixo]**" (colchete em `--muted-foreground`); chips
outline com escopo/prazo; CTA pill preta full-width por card. Links de WhatsApp
com mensagens pré-preenchidas inalterados.

### 3.7 Blog (Home.tsx + data/posts.ts)
Cards brancos; capas trocam degradês azuis por **tons neutros** (`#E4E2DE`,
`#DCDCDA`, `#D6D8DC` — campo `cover` em posts.ts atualizado), número grande
`#161616/85`, StarburstIcon mantido em `#161616/8`, pill de readTime outline.
Título hover: sublinhado + `--accent-blue`.

### 3.8 Contato + rodapé → ContactSheet (novo componente, extrai o inline de Home.tsx + footer do Layout)
**Folha preta full-bleed** (`#0B0B0B→#161616`) de cantos superiores arredondados
(~40px), contendo, em ordem:
1. Badge mono "CONTATO" + título central "Pronto para construir algo *grande*?"
   (itálico na palavra final) + CTA pill **branca** com avatares → WhatsApp;
   microcopy "(85) 99637-0080" linkado.
2. Linha com dois botões outline brancos: "Baixar currículo [PDF]" (download
   mantido) e e-mail/socials.
3. **Anel orbital**: 12–16 thumbnails circulares dos projetos girando devagar
   (CSS `rotate` 60s linear infinite; reduced-motion: estático) com o
   **monograma 3D cromado no centro** — `MonogramScene` realocado, lazy-load só
   quando a folha se aproxima (IntersectionObserver), environment fixo escuro
   (prop nova `variant="footer"`), **drag-para-girar mantido**; fallback (WebGL
   ausente/reduced-motion): logo SVG estático. Feixes de luz `skewX(45deg)` atrás.
4. Rodapé mínimo dentro da folha: links das âncoras, socials, copyright.

A seção `#contato` (id/âncora) permanece para o scroll-spy. Os 3 mini-cards de
destaques atuais viram uma linha discreta de 3 itens texto.

### 3.9 Páginas internas (ProjectDetail, BlogPost, Diagnostico, NotFound)
Sem mudança estrutural: herdam tokens novos + RollButton re-estilizado; passada
de consistência (fundos, cards brancos, pills).

### 3.10 RollButton
Vira o sistema canônico de CTA pill: variantes `black` (padrão), `white` (sobre
folha preta), `outline`; animação de roll do label mantida; suporta o cluster de
avatares do hero via prop opcional.

## 4. Sistema de movimento

- **Entradas**: `[data-reveal]` atualizado para `translateY(60px)` + opacity com
  `cubic-bezier(0.22, 1, 0.36, 1)` 0.8s (sensação de spring Framer), stagger pelos
  `.reveal-delay-*`; mecanismo `useRevealOnScroll` inalterado.
- **Marquees**: stack (existente) + anel orbital do rodapé.
- **Micro**: pulso do dot (1.6s), rabiscos com fade+rotate no reveal, hover de
  cards `-translate-y-1` + sombra, roll dos botões.
- **prefers-reduced-motion**: tudo desligado pelo bloco existente no index.css;
  orbital estático; vídeos do bento viram posters; monograma sem autogiro.
- **Sem bibliotecas novas.** Remove-se mais motion do que se adiciona (deck sai).

## 5. i18n (strings.ts)

Todas as strings novas em PT e EN: `hero.scribble`, `hero.status`, `hero.ctaWhats`,
`hero.viewProjects`, `contact.sheetTitle`, `contact.sheetCta`, `combos.fixedTag`,
`bento.viewCase`, `footer.*`. Copy na voz Budarina: direta, quantificada, humana
("de fundador para fundador"), sentence case — caps só em badges/status mono.
Textos hardcoded continuam proibidos; `key={lang}` do TypeCycler preservado.

## 6. O que é removido

| Item | Motivo |
|---|---|
| `hero-sky`, `hero-clouds`, `hero-grain`, `hero-monogram-in` (CSS) | hero vira chapado |
| `ProjectDeck.tsx` | substituído pelo BentoCollage |
| `ProjectCarousel.tsx`, `SectionBadge.tsx`, `ui/button.tsx` | órfãos (Carousel era o único uso do ui/button) |
| `RotatingFacts.tsx` | hero novo usa status mono; strings ficam |
| Classes `btn-drain-*` no Hero | nunca existiram no CSS |
| Titillium Web + Instrument Serif (index.html) | substituídas |
| Degradês azuis das capas de blog e glows dos painéis | direção monocromática |

## 7. Arquivos afetados

**Novos:** `components/BentoCollage.tsx`, `components/ContactSheet.tsx`,
`data/testimonials.ts`.
**Reescritos:** `components/hero/Hero.tsx`, `index.css` (tokens + classes),
seções inline de `Home.tsx`.
**Editados:** `Layout.tsx`, `StackShowcase.tsx`, `DiagnosticoSpotlight.tsx`,
`ProjectsCategoryPage.tsx`, `RollButton.tsx`, `MonogramScene.tsx` (prop `variant`), `hero/HeroMonogram.tsx`
(wrapper lazy/fallback reutilizado pelo ContactSheet),
`i18n/strings.ts`, `data/posts.ts`, `client/index.html`, `pages/ProjectDetail.tsx`,
`pages/BlogPost.tsx`, `pages/NotFound.tsx` (consistência leve).
**Removidos:** `ProjectDeck.tsx`, `ProjectCarousel.tsx`, `SectionBadge.tsx`,
`components/ui/button.tsx`, `components/hero/RotatingFacts.tsx`.

## 8. Verificação

1. `pnpm check` e `pnpm test` limpos; `pnpm build` ok.
2. Passada manual: 2 temas × 2 idiomas × desktop/mobile × reduced-motion.
3. Todos os deep links de WhatsApp intactos (hero, navbar mobile, combos ×3,
   contato, telefone); download do currículo; rotas e âncoras/scroll-spy.
4. Contraste AA: `--body` e `--muted-foreground` sobre `#EDEDED` e sobre a folha preta.
5. Performance: LCP do hero melhora (texto em vez de WebGL); Three.js só carrega
   ao aproximar do rodapé; fontes trocadas 1:1 no padrão não-bloqueante.

## 9. Fora de escopo

Conteúdo novo de posts/projetos, depoimentos reais (entram via
`data/testimonials.ts` quando o usuário enviar), overhaul de SEO/meta, mudanças na
lógica interna do /diagnostico (só re-skin), tradução de conteúdo longo do blog.
