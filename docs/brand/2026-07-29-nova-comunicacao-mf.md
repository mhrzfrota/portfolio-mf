# Nova comunicação MF Services — do "faz sites" ao "entende meu negócio"

**Data:** 2026-07-29 · **Escopo:** apenas textos (strings.ts, projects.ts, const.ts) · **Método:** Golden Circle (Sinek) — PORQUÊ → COMO → O QUÊ

> **REVISÃO v2 (mesma data, aplicada por cima):** o posicionamento mudou de "empresa/nós"
> para **marca pessoal — Matheus Frota, desenvolvedor pleno com visão de negócio**, em
> primeira pessoa do singular. Hero encurtado e re-ancorado na identidade de desenvolvedor
> ("Desenvolvedor" + Full Stack / IA aplicada / automações / sistemas web / software sob
> medida), com os três pilares do posicionamento pessoal como manchete dos facts:
> **"Tecnologia para resolver · IA para potencializar · visão de negócio para gerar resultado."**
> Credenciais técnicas (ADS/UNIFOR, stack) voltaram ao hero; "Quem assina os projetos"
> voltou a ser "Meu currículo"; todos os "nós/a gente/construímos" viraram "eu/comigo/construí".
> As seções abaixo continuam válidas como racional psicológico; onde houver conflito de
> voz, vale a v2 (o código é a fonte da verdade).

## Decisões estratégicas (valem para todas as seções)

1. **Voz (v2): primeira pessoa do singular.** Matheus Frota como marca pessoal — desenvolvedor pleno que entende de negócio. A autoridade vem de projetos reais, stack visível e formação, não de parecer empresa grande.
2. **O herói do texto é o tempo do empresário, nunca a tecnologia.** Toda seção responde a uma das ideias-guia: tecnologia devolve tempo, organiza, vende, dá credibilidade, elimina repetição.
3. **Restrição técnica respeitada:** cada texto novo mapeia 1:1 numa chave existente do i18n, com comprimento próximo do atual e mesmo número de itens em arrays. Nada de layout novo.
4. **Ordem psicológica da página já favorece o Golden Circle:** Hero (porquê) → Projetos (prova) → Diagnóstico (como pensamos) → Soluções (o quê, por momento de negócio) → Contato (conversa, não orçamento).
5. **SEO:** desenvolvimento web, sites institucionais, landing pages, automações, inteligência artificial, sistemas web, software sob medida, presença digital e transformação digital entram diluídos no corpo dos textos — nunca em lista.

---

## 1. Navbar / Topbar

- **Objetivo:** utilidade sem ansiedade de venda. O único texto "de marca" aqui é o CTA.
- **Problema que resolve:** "Solicitar orçamento" no topo grita fornecedor; convida a uma transação antes de existir confiança.
- **Emoção:** neutralidade segura.
- **Textos atuais → novos:**
  - `nav.combos`: "Combos" → **"Soluções"** (combo é vocabulário de cardápio, não de parceiro estratégico; a âncora `#combos` é código e não muda)
  - `topbar.requestQuote`: "Solicitar orçamento" → **"Vamos conversar"**
- **Justificativa:** o CTA global deixa de pedir dinheiro e passa a oferecer atenção. Todos os demais itens (Início, Projetos, Blog, Contato) permanecem — navegação é lugar de clareza, não de criatividade.

## 2. Hero

- **Objetivo:** espelhar o problema. O visitante deve se reconhecer antes de saber o que vendemos.
- **Problema que resolve:** o hero atual apresenta um cargo ("Desenvolvedor Full Stack") — vocabulário de currículo, invisível para um dono de clínica, indústria ou escritório.
- **Emoção:** identificação ("é exatamente isso que eu vivo") e alívio.
- **Texto atual:**
  - Headline: "Desenvolvedor" + cíclico: "Full Stack. / Back-end. / Web. / de Automações. / de Soluções Digitais."
  - Sub: "Desenvolvo sites, sistemas e automações sob medida para transformar ideias em soluções que vendem, organizam processos e economizam tempo."
  - CTAs: "Iniciar um projeto" / "Ver projetos"
  - Facts: formação UNIFOR / escopo claro / stack técnica
- **Texto novo:**
  - `hero.headline`: **"Menos operação,"**
  - `hero.areas` (cíclico, itálico): **"mais crescimento." / "mais clientes." / "mais tempo." / "mais controle." / "mais margem."**
  - `hero.ariaHeadline`: **"MF Services — tecnologia para empresas crescerem"**
  - `hero.description`: **"Seu tempo deveria ir para o crescimento da empresa — não para tarefas que a tecnologia já resolve. A MF Services entende sua operação e constrói software sob medida, automações e inteligência artificial que organizam, vendem e devolvem horas ao seu dia."**
  - `hero.startProject`: **"Falar sobre seu negócio"**
  - `hero.viewProjects`: **"Ver na prática"**
  - `hero.facts`:
    1. **"Antes de qualquer código, entendemos como sua empresa vende, atende e opera."**
    2. **"Do diagnóstico ao sistema no ar: escopo claro, comunicação direta, resultado medido."**
    3. **"Tecnologia boa é a que se paga — em tempo ganho, em vendas ou em clareza."**
- **Justificativa:** a headline nomeia a dor (a operação come o dia) e o cíclico entrega o desejo em cinco formas — cada rotação é uma promessa diferente para um leitor diferente. O sub abre com o PORQUÊ (tempo), passa pelo COMO (entender a operação) e só então toca o O QUÊ (software sob medida, automações, IA), com SEO natural. Os facts trocam credencial de desenvolvedor por crenças — o critério nº 3 é literalmente uma filosofia de compra que protege o cliente.

## 3. Stack (marquee de tecnologias)

- **Objetivo:** credibilidade técnica sem tecnicismo.
- **Problema que resolve:** "Tecnologias que uso nos projetos" centra em "eu" e em ferramenta.
- **Emoção:** segurança discreta.
- **Texto atual:** "Tecnologias que uso nos projetos"
- **Texto novo:** `stack.title`: **"A tecnologia por trás dos resultados"**
- **Justificativa:** as logos continuam provando domínio técnico; o título subordina a ferramenta ao resultado — exatamente a hierarquia da marca.

## 4. Projetos (deck + grade)

- **Objetivo:** prova. Não "telas bonitas": negócios que mudaram.
- **Problema que resolve:** "Projetos em destaque" apresenta portfólio; não induz leitura de transformação.
- **Emoção:** desejo de ser o próximo case.
- **Textos atuais → novos (i18n):**
  - `projects.title`: "Projetos em destaque" → **"Projetos que viraram resultado"**
  - `projects.allTitle`: "Todos os projetos" → **"Cada projeto, um problema resolvido"**
  - `projects.viewProject`: "Ver projeto" → **"Ver o case"**
  - `projects.visitProject`: "Acessar projeto" → **"Ver no ar"**
  - `projects.deckAria`: → **"Projetos em destaque e o resultado de cada um"**
- **Padrão para descrições em `data/projects.ts`** (fórmula: travava → construímos → mudou), com os 4 do deck reescritos:
  - **Montadora Fênix:** "Vinte anos de stands impecáveis — e um site que não mostrava isso. Construímos uma presença digital à altura da empresa: portfólio visual, prova de experiência e orçamento a um toque no WhatsApp."
  - **Via Shopping Car:** "Um shopping de carros inteiro, invisível para quem pesquisava online. A plataforma web reúne estoque, lojas e contato num só lugar — e transforma visita ao site em visita à loja."
  - **TZ Produções:** "Eventos memoráveis não podem depender de boca a boca. A landing page organiza portfólio, serviços e contato para transformar indicação em pedido de proposta."
  - **MG Aldeota:** "Quem chegava pela indicação não encontrava a empresa online. O site institucional apresenta serviços e diferenciais — e encurta o caminho até o contato."
  - *(Dashboard Meta Analytics e Clipradio já têm estrutura problema→solução→benefício nos cases; ajustar o mesmo tom na revisão final.)*
- **Justificativa:** cada descrição abre pelo problema de negócio (nunca pela stack), e o rótulo dos botões muda a promessa do clique: "Ver no ar" é prova viva, "Ver o case" é história de transformação.

## 5. MF Diagnóstico IA

- **Objetivo:** reciprocidade — entregar valor real antes de qualquer pedido. É o "COMO pensamos" em forma de produto.
- **Problema que resolve:** o visitante ainda não confia; "Ferramenta exclusiva" soa marketing.
- **Emoção:** curiosidade + sensação de ser analisado por quem entende.
- **Textos atuais → novos:**
  - `diagnostico.badge`: "Ferramenta exclusiva" → **"Comece por aqui"**
  - `diagnostico.title`: "Descubra o que trava as vendas do seu negócio no digital." → **"Antes de investir em site, descubra o que trava suas vendas."**
  - `diagnostico.subtitle`: → **"É assim que começamos qualquer projeto: entendendo. O MF Diagnóstico IA avalia posicionamento, presença digital, conversão, autoridade e automação — e devolve nota, prioridades e um plano de ação de 7 dias. Em menos de um minuto."**
  - `diagnostico.cta`: "Gerar meu diagnóstico" → **"Diagnosticar minha empresa"**
  - `diagnostico.note`: mantém **"Gratuito · sem cadastro · resultado na hora"** (já é perfeito: remove todas as objeções em seis palavras)
- **Justificativa:** o badge transforma a ferramenta em porta de entrada do processo; o título posiciona a MF contra a venda apressada de site — quem diz "antes de investir, entenda" é conselheiro, não fornecedor.

## 6. Combos → Soluções

- **Objetivo:** o visitante se localiza num momento de negócio, não num cardápio de serviços.
- **Problema que resolve:** "Combos de serviços" + "Quero este combo" é linguagem transacional; features são listas de entregáveis.
- **Emoção:** pertencimento ("esse sou eu") e progressão.
- **Textos atuais → novos:**
  - `combos.title`: "Combos de serviços" → **"Por onde começar"**
  - `combos.subtitle`: → **"Cada empresa está num momento diferente. Escolha o seu — ou nos conte o problema, e desenhamos o caminho sob medida."**
  - Item 1 — `name`: "Presença Digital" (mantém, é SEO e é claro) · `tagline`: → **"Para quem perde cliente por não ser encontrado — ou por parecer menor do que é."** · features: **"Site institucional ou landing page rápida e responsiva" / "Texto e design que conduzem ao contato" / "WhatsApp e formulário a um toque" / "Domínio, publicação e SEO desde o início"**
  - Item 2 — `name`: "Operação & Dados" · `tagline`: → **"Para quem já vende, mas decide no escuro e perde horas em rotina manual."** · features: **"Dashboard com os números do negócio em tempo quase real" / "Integrações entre os sistemas que você já usa" / "Automações que eliminam o trabalho repetitivo" / "Dados organizados para decidir com clareza"**
  - Item 3 — `name`: "Produto Completo" · `tagline`: → **"Para o processo que hoje só funciona na cabeça de alguém — e precisa virar sistema."** · features: **"Sistema web sob medida, do banco de dados à tela" / "Acessos e permissões para a equipe" / "Painel administrativo do seu jeito de operar" / "No ar com monitoramento, suporte e evolução"**
  - `combos.cta`: "Quero este combo" → **"Começar por aqui"**
  - `combos.mostChosen`: "Mais escolhido" mantém (prova social funciona).
- **Justificativa:** as taglines agora são espelhos de dor específicos por estágio (invisibilidade → cegueira operacional → dependência de pessoas), e os serviços aparecem dentro das features — o O QUÊ como consequência, nunca como abertura.

## 7. Blog

- **Objetivo:** demonstrar profundidade de pensamento para empresários (não para outros devs).
- **Problema que resolve:** "Notas sobre backend, dados e construção de produtos" fala com programadores.
- **Emoção:** respeito intelectual.
- **Textos atuais → novos:**
  - `blog.title`: "Notas & ideias" mantém.
  - `blog.subtitle`: → **"O que aprendemos usando tecnologia para destravar negócios reais — sem tecniquês."**
- **Justificativa:** mesma seção, novo leitor-alvo. ("Transformação digital" entra melhor nos posts em si do que forçada aqui.)

## 8. Contato

- **Objetivo:** transformar "pedir orçamento" em "ser ouvido". Aqui também mora o PROCESSO (pedido do brief), usando os três cards numerados 01/02/03 que o layout já tem.
- **Problema que resolve:** a copy atual fala de orçamento pré-preenchido e currículo — transação e freelancer, não parceria.
- **Emoção:** alívio e segurança ("posso contar o problema sem virar lead perseguido").
- **Textos atuais → novos:**
  - `contact.title`: "Vamos construir juntos." → **"Conte o problema. A tecnologia é conosco."**
  - `contact.subtitle`: → **"Sem compromisso e sem tecniquês: uma conversa sobre onde sua empresa perde tempo — e o que dá para resolver primeiro."**
  - `contact.directBadge`: "Atendimento direto" → **"Você fala com quem constrói"**
  - `contact.whatsappParagraph`: → **"A primeira conversa é sobre o seu negócio, não sobre proposta. Chame e conte o que hoje mais consome o seu dia."**
  - `contact.sendMessage`: "Enviar mensagem" → **"Começar a conversa"**
  - `contact.highlights` (viram o processo, na numeração 01/02/03 existente):
    1. **"Entender"** — "Primeiro, o seu negócio: como vende, onde trava, o que consome tempo."
    2. **"Desenhar"** — "Escopo claro e prazo real. Só entra no plano o que gera resultado."
    3. **"Construir e acompanhar"** — "Do código ao ar, com suporte e evolução contínua."
  - `contact.resumeTitle`: "Baixar currículo" → **"Quem assina os projetos"** · `resumeParagraph`: → **"A formação e a experiência de quem responde, pessoalmente, por cada entrega."** · `downloadPdf`: "Baixar PDF" mantém.
  - **`const.ts` — mensagem do WhatsApp:** "Olá! Quero fazer um orçamento." → **"Olá! Quero conversar sobre a minha empresa."** (uma string; muda a natureza da conversa que chega no seu WhatsApp)
- **Justificativa:** o título é a frase-síntese da marca — divide papéis: o problema é do cliente, a tecnologia é nossa. O processo em 3 passos prova que código vem por último. O currículo vira credencial de responsabilidade em vez de artefato de freelancer.

## 9. Página de projeto (ProjectDetail)

- **Objetivo:** contar transformação, não ficha técnica.
- **Textos atuais → novos:**
  - `labelProblem`: "Problema do cliente" → **"O que travava"**
  - `labelSolution`: "Solução criada" → **"O que construímos"**
  - `labelBenefit`: "Resultado ou benefício" → **"O que mudou"**
  - `similarTitle`: "Quer algo parecido?" → **"Sua empresa trava num ponto parecido?"**
  - `similarText`: → **"Conte como funciona hoje. A gente mostra o que dá para automatizar, organizar ou transformar em sistema."**
  - `requestQuote`: "Pedir orçamento" → **"Conversar sobre isso"**
- **Justificativa:** os três rótulos formam um arco narrativo (antes → durante → depois) que o leitor sente mesmo sem perceber.

## 10. Microtextos restantes

- `blogPost.ctaTitle`: "Quer aplicar isso no seu projeto?" → **"Isso encaixa na sua empresa?"** · `ctaText`: → **"Conte seu contexto e mostramos como essa ideia vira solução — do plano ao ar."**
- `notFound.text`: mantém a informação, com voz da casa: **"Essa página não existe — mas o seu problema com certeza tem solução. Volte ao início e conte pra gente."**
- Aria-labels e rótulos utilitários (menu, tema, idioma): **não mudam** — acessibilidade é lugar de clareza literal.

---

## O que NÃO mudou, de propósito

- Estrutura, layout, componentes, âncoras e rotas: intactos.
- "Gratuito · sem cadastro · resultado na hora", "Mais escolhido", nav utilitária: já serviam à marca.
- Preço "R$ 500 a partir de": honestidade de preço é coerente com "sem promessas irreais" (decisão de manter é sua).

## Próximos passos sugeridos

1. Aprovar/ajustar esta copy (PT).
2. Aplicar em `strings.ts` + descrições de `projects.ts` + `const.ts` (1 sessão de edição, sem tocar em layout).
3. Espelhar em EN com a mesma lógica (não traduzir literalmente).
4. Revisar os 9 projetos restantes com a fórmula "travava → construímos → mudou".
