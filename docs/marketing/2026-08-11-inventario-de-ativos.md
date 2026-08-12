# Inventário de ativos MF Services — auditoria externa

**Data:** 2026-08-11 · **Método:** varredura automatizada dos links do
`projects.ts`, do código de analytics e das fontes externas públicas (GitHub,
link-in-bio, Instagram). **Serve a:** `docs/marketing/2026-08-10-analise-e-comercial-mf.md`
e ao plano no board interno (`/board`).

> Este doc registra **o que está no ar hoje**, não o que deveria estar. Cada
> achado marcado com 🔴 virou cartão no board.

---

## 1. Cases e provas — 14 projetos, 13 no ar

Todos os `liveUrl` de `client/src/data/projects.ts` foram testados
(HTTP GET com follow de redirect, 2026-08-11).

| Status | Projeto                        | URL                                     |
| ------ | ------------------------------ | --------------------------------------- |
| 200    | Mar&Mov — Moda Praia           | maremovsuamoda.vercel.app               |
| 200    | MG Aldeota ⭐                  | mgaldeota.vercel.app                    |
| 200    | BarretoFit                     | barretofit.com.br                       |
| 200    | Lyre Store                     | lyrestore.vercel.app                    |
| 200    | FERPRO Contabilidade           | ferprocontabilidade.com.br              |
| 200    | TZ Produções ⭐                | tzproducoes.com.br                      |
| 200    | Ramires Barbosa                | lp-ramirespersonal.vercel.app           |
| 200    | Via Shopping Car ⭐            | viashoppingcar.com.br                   |
| 200    | Dashboard Meta Analytics (MSL) | monitor.mslestrategia.com.br            |
| 200    | Montadora Fênix ⭐             | montadorafenix.com.br                   |
| 200    | Amsterdam Advocacia            | amsterdan.vercel.app                    |
| 200    | Lopes Veículos ⭐              | lopesveiculos.com                       |
| 200    | Colégio La'Marques             | colegiolamarques.vercel.app             |
| 🔴 000 | Landing Page E-book Virtual    | albertocid.com.br — **DNS não resolve** |

⭐ = `featured: true` (aparece no deck da home).

**🔴 Achado 1:** `albertocid.com.br` não existe mais (`Could not resolve host`).
O card "Landing Page E-book Virtual" oferece "Ver no ar" para um domínio morto —
prova que desmente a si mesma. Decidir entre remover o case, trocar o link por
print/estudo de caso sem link, ou hospedar uma cópia estática.

**Observação de portfólio:** 8 dos 14 são landing pages e sites institucionais;
apenas 3 são plataforma/operação (Lopes, Via Shopping Car, Dashboard MSL) — que
são justamente os cases que sustentam a oferta principal "Operação sem Planilha".
A prova mais forte é a menos numerosa.

## 2. Instrumentação — o funil é cego

- **Umami instalado** em `client/index.html` (`data-website-id`
  `a3d18df0-2571-4da1-a2b5-3fa0e1f2cc33`), carregado com `defer`.
- **Zero eventos customizados:** `grep -rn "umami\|data-umami" client/src` não
  retorna nada.

**🔴 Achado 2:** há pageview, não há conversão. Os CTAs de WhatsApp
(`WHATSAPP_BUDGET_URL` em `const.ts`, usado no Hero, na topbar, no rodapé e no
bloco de contato) não emitem evento nenhum. Não dá para saber quantas visitas
viram conversa — e §6.5 da análise comercial depende disso para medir qualquer
melhoria.

## 3. Link-in-bio — bio.site/mfservices

Descoberto pelo perfil do GitHub; não estava registrado em nenhum doc do projeto.
É a porta de entrada de quem vem do Instagram.

Conteúdo atual: título "MF Services", tagline "Soluções digitais", links para
Instagram, LinkedIn, e-mail, WhatsApp, portfólio e GitHub.

- **🔴 Achado 3 — erro de digitação:** o card do portfólio está escrito
  "Matheus Frota - **Portóflio**". Quem vende presença digital não pode errar a
  própria vitrine.
- **🔴 Achado 4 — vazamento de funil:** o link de Instagram aponta para
  **@matheuslfrota**, conta **pessoal, privada, 85 seguidores** — e não para
  @emefeservices, a conta profissional com 1.577. Quem clica bate numa porta
  fechada.
- **🔴 Achado 5 — página sem oferta:** "Soluções digitais" não diz nada, não há
  case, prova, nem chamada. É tráfego qualificado caindo num diretório.

## 4. Instagram

| Perfil             | Seguidores | Estado                                 |
| ------------------ | ---------- | -------------------------------------- |
| **@emefeservices** | 1.577      | público, ativo (posts e reels em 2026) |
| @matheuslfrota     | 85         | privado, pessoal                       |

Bio atual de @emefeservices: _"software developer \| SaaS apps and client
projects"_.

**🔴 Achado 6:** a bio está **em inglês e falando com desenvolvedores** —
exatamente o oposto do posicionamento definido no doc de marca (primeira pessoa,
português, dono de PME, "o herói é o tempo do empresário", tecniquês proibido).
1.577 pessoas são um ativo de distribuição real; a bio desperdiça o clique.

## 5. GitHub — github.com/mhrzfrota

16 repositórios públicos, 11 seguidores, 23 estrelas dadas. Pinned:
`mgaldeota`, `portfolio-mf`, `site-dropshipping`. Bio menciona MSL Estratégia,
"Data, APIs and Automation".

Baixa prioridade comercial: dono de PME não vai ao GitHub. Serve como prova
técnica secundária para parceria com agência (canal 3 da §5).

## 6. Dependência quebrada pelo próprio site

O **MF Diagnóstico IA foi removido do portfolio em 2026-08-11** (rota, feature e
textos). A análise comercial de 2026-08-10 apoia-se nele em cinco pontos:
escada de ofertas (§4.1), bônus 1 da oferta de entrada (§4.2), elevator pitch
(§4.5), as duas mensagens de prospecção (§4.5) e o diferencial "método visível"
do product-marketing.

**🔴 Achado 7:** o degrau gratuito da escada não existe mais. Enquanto não for
substituído, o pitch e as mensagens de prospecção prometem algo que não há.

---

## Resumo dos achados

| #   | Achado                                           | Custo de correção  |
| --- | ------------------------------------------------ | ------------------ |
| 1   | Case com link morto (albertocid.com.br)          | minutos            |
| 2   | Zero eventos de conversão no Umami               | ~1 hora            |
| 3   | Typo "Portóflio" no link-in-bio                  | 1 minuto           |
| 4   | Link-in-bio manda para Instagram pessoal privado | 1 minuto           |
| 5   | Link-in-bio sem oferta nem prova                 | ~30 min            |
| 6   | Bio do Instagram em inglês, falando com devs     | 5 minutos          |
| 7   | Escada de ofertas sem o degrau gratuito          | decisão + execução |

Os achados 3, 4 e 6 somados custam menos de dez minutos e ficam entre o
Instagram (1.577 pessoas) e o portfólio. É o melhor retorno por minuto do
inventário inteiro.
