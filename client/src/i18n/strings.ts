import type { Lang } from "@/contexts/LanguageContext";

/**
 * Todos os textos de interface do site, em PT e EN.
 * Textos de dados (projetos, posts) ficam localizados nos próprios
 * arquivos de dados (`data/projects.ts`, `data/posts.ts`).
 *
 * Voz da marca: PORQUÊ → COMO → O QUÊ (Golden Circle). O herói do texto é
 * o tempo do empresário, nunca a tecnologia. Ver
 * docs/brand/2026-07-29-nova-comunicacao-mf.md antes de editar.
 */
const strings = {
  pt: {
    nav: {
      inicio: "Início",
      sobre: "Sobre",
      projetos: "Projetos",
      combos: "Soluções",
      blog: "Blog",
      contato: "Contato",
    },
    topbar: {
      timeSuffix: "em Fortaleza",
      menu: "Menu",
      close: "Fechar",
      openMenu: "Abrir menu",
      closeMenu: "Fechar menu",
      lightMode: "Ativar modo claro",
      darkMode: "Ativar modo escuro",
      light: "Modo claro",
      dark: "Modo escuro",
      switchLang: "Switch to English",
      requestQuote: "Vamos conversar",
      backHome: "MF Services — voltar ao início",
    },
    footer: {
      role: "Desenvolvedor de Software",
      tagline:
        "Código, automações e inteligência artificial para resolver problemas reais de empresas.",
      navLabel: "Navegação",
      socialLabel: "Redes",
      contactLabel: "Contato",
      resumeLink: "Currículo (PDF)",
      formLabel: "Me chame no WhatsApp",
      formPlaceholder: "Escreva sua mensagem…",
      formSubmit: "Enviar",
      boardLink: "Board interno",
    },
    hero: {
      headline: "Desenvolvedor",
      areas: [
        "Full Stack.",
        "de IA aplicada.",
        "de automações.",
        "de sistemas web.",
        "de software sob medida.",
      ],
      ariaHeadline: "Matheus Frota — desenvolvedor full stack, automações e IA",
      description:
        "Sou Matheus Frota. Uso código, automações e inteligência artificial para resolver problemas reais de empresas — do site ao sistema sob medida.",
      startProject: "Falar comigo",
      viewProjects: "Ver meus projetos",
    },
    stack: {
      title: "Tecnologias que uso em projetos reais",
    },
    about: {
      title: "Antes do código, o problema do negócio",
      subtitle:
        "Sou Matheus Frota, desenvolvedor em Fortaleza. Trabalho com empresas que já sabem onde dói mas não sabem como resolver — e traduzo isso em software que funciona no dia a dia.",
      projectsLabel: "Projetos entregues e no ar",
      stackLabel: "Tecnologias no dia a dia",
      degreeValue: "ADS",
      degreeLabel: "Análise e Desenvolvimento de Sistemas — UNIFOR",
      baseValue: "Fortaleza",
      baseLabel: "Ceará, Brasil — atendo remoto para todo o país",
      quote:
        "Tecnologia para resolver, IA para potencializar, visão de negócio para gerar resultado.",
    },
    projects: {
      title: "Projetos que viraram resultado",
      subtitle:
        "Sistemas, plataformas e sites sob medida. Cada um começou por um problema de negócio.",
      landingEyebrow: "Landing Pages",
      landingTitle: "Páginas feitas para converter",
      landingSubtitle:
        "Uma página, um objetivo: transformar quem chega em contato. Design, texto e velocidade trabalhando juntos.",
      categories: {
        Todos: "Todos",
        Web: "Web",
        Plataformas: "Plataformas",
        "Landing Page": "Landing Page",
      } as Record<string, string>,
      viewProject: "Ver o case",
      visitProject: "Ver no ar",
      prev: "Projeto anterior",
      next: "Próximo projeto",
    },
    combos: {
      title: "Por onde começar",
      subtitle:
        "Cada empresa está num momento diferente. Escolha o seu — ou me conte o problema, e eu desenho o caminho sob medida.",
      mostChosen: "Mais escolhido",
      from: "a partir de",
      cta: "Começar por aqui",
      items: [
        {
          name: "Presença Digital",
          tagline:
            "Para quem perde cliente por não ser encontrado — ou por parecer menor do que é.",
          features: [
            "Site institucional ou landing page rápida e responsiva",
            "Texto e design que conduzem ao contato",
            "WhatsApp e formulário a um toque",
            "Domínio, publicação e SEO desde o início",
          ],
        },
        {
          name: "Operação & Dados",
          tagline:
            "Para quem já vende, mas decide no escuro e perde horas em rotina manual.",
          features: [
            "Dashboard com os números do negócio em tempo quase real",
            "Integrações entre os sistemas que você já usa",
            "Automações que eliminam o trabalho repetitivo",
            "Dados organizados para decidir com clareza",
          ],
        },
        {
          name: "Produto Completo",
          tagline:
            "Para o processo que hoje só funciona na cabeça de alguém — e precisa virar sistema.",
          features: [
            "Sistema web sob medida, do banco de dados à tela",
            "Acessos e permissões para a equipe",
            "Painel administrativo do seu jeito de operar",
            "No ar com monitoramento, suporte e evolução",
          ],
        },
      ],
    },
    blog: {
      title: "Notas & ideias",
      subtitle:
        "O que aprendo usando tecnologia para destravar negócios reais — sem tecniquês.",
      readArticle: "Ler artigo",
    },
    contact: {
      title: "Conte o problema. A tecnologia é comigo.",
      subtitle:
        "Sem compromisso e sem tecniquês: uma conversa sobre onde sua empresa perde tempo — e o que dá para resolver primeiro.",
      directBadge: "Você fala direto comigo",
      whatsappTitlePrefix: "Vamos conversar pelo",
      whatsappParagraph:
        "A primeira conversa é sobre o seu negócio, não sobre proposta. Me chame e conte o que hoje mais toma o seu tempo.",
      sendMessage: "Começar a conversa",
      highlights: [
        {
          title: "Entender",
          description:
            "Primeiro, o seu negócio: como vende, onde trava, o que consome tempo.",
        },
        {
          title: "Desenhar",
          description:
            "Escopo claro e prazo real. Só entra no plano o que gera resultado.",
        },
        {
          title: "Construir e acompanhar",
          description: "Do código ao ar, com suporte e evolução contínua.",
        },
      ],
      contactInfo: "Informações de contato",
      resumeTitle: "Meu currículo",
      resumeParagraph:
        "Um resumo da minha experiência, formação e habilidades técnicas.",
      downloadPdf: "Baixar PDF",
    },
    projectDetail: {
      notFoundBadge: "Case não encontrado",
      notFoundTitle: "Projeto indisponível",
      notFoundText: "Ainda não existe uma página completa para esse projeto.",
      backToPortfolio: "Voltar ao portfólio",
      backToProjects: "Voltar aos projetos",
      viewLive: "Ver projeto online",
      inMotionTitle: "Projeto em movimento",
      inMotionSubtitle:
        "Uma visão completa da experiência e das principais seções do site.",
      videoAria: "Demonstração em vídeo do projeto",
      techUsed: "Tecnologias usadas",
      links: "Links",
      liveLink: "Projeto online",
      repository: "Repositório",
      similarTitle: "Sua empresa trava num ponto parecido?",
      similarText:
        "Me conte como funciona hoje. Eu mostro o que dá para automatizar, organizar ou transformar em sistema.",
      requestQuote: "Conversar sobre isso",
      labelName: "Nome do projeto",
      labelProblem: "O que travava",
      labelSolution: "O que construí",
      labelBenefit: "O que mudou",
      imagesTitle: "Imagens do projeto",
      imagesSubtitle:
        "Espaço preparado para ampliar o case com mais telas quando houver novas capturas.",
    },
    blogPost: {
      notFoundBadge: "Artigo não encontrado",
      notFoundTitle: "Esse texto ainda não existe",
      notFoundText: "O artigo que você procura pode ter mudado de endereço.",
      backToBlog: "Voltar ao blog",
      ctaTitle: "Isso encaixa na sua empresa?",
      ctaText:
        "Conte seu contexto e eu mostro como essa ideia vira solução — do plano ao ar.",
      ctaButton: "Conversar no WhatsApp",
      keepReading: "Continue lendo",
      readArticle: "Ler artigo",
    },
    notFound: {
      title: "Página não encontrada",
      text: "Essa página não existe — mas o seu problema com certeza tem solução. Volte ao início e me conte.",
      goHome: "Voltar para o início",
    },
  },
  en: {
    nav: {
      inicio: "Home",
      sobre: "About",
      projetos: "Projects",
      combos: "Solutions",
      blog: "Blog",
      contato: "Contact",
    },
    topbar: {
      timeSuffix: "in Fortaleza",
      menu: "Menu",
      close: "Close",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      lightMode: "Switch to light mode",
      darkMode: "Switch to dark mode",
      light: "Light mode",
      dark: "Dark mode",
      switchLang: "Mudar para português",
      requestQuote: "Let's talk",
      backHome: "MF Services — back to top",
    },
    footer: {
      role: "Software Developer",
      tagline:
        "Code, automations and artificial intelligence to solve real business problems.",
      navLabel: "Navigation",
      socialLabel: "Social",
      contactLabel: "Contact",
      resumeLink: "Resume (PDF)",
      formLabel: "Message me on WhatsApp",
      formPlaceholder: "Write your message…",
      formSubmit: "Send",
      boardLink: "Internal board",
    },
    hero: {
      headline: "Developer",
      areas: [
        "Full Stack.",
        "of applied AI.",
        "of automations.",
        "of web systems.",
        "of custom software.",
      ],
      ariaHeadline: "Matheus Frota — full stack developer, automations and AI",
      description:
        "I'm Matheus Frota. I use code, automations and artificial intelligence to solve real business problems — from websites to custom systems.",
      startProject: "Talk to me",
      viewProjects: "See my projects",
    },
    stack: {
      title: "Technologies I use in real projects",
    },
    about: {
      title: "Before the code, the business problem",
      subtitle:
        "I'm Matheus Frota, a developer based in Fortaleza, Brazil. I work with companies that already know where it hurts but not how to fix it — and turn that into software that holds up day to day.",
      projectsLabel: "Projects delivered and live",
      stackLabel: "Technologies I work with daily",
      degreeValue: "ADS",
      degreeLabel: "Systems Analysis and Development — UNIFOR",
      baseValue: "Fortaleza",
      baseLabel: "Ceará, Brazil — working remotely nationwide",
      quote:
        "Technology to solve, AI to amplify, business vision to drive results.",
    },
    projects: {
      title: "Projects that became results",
      subtitle:
        "Custom systems, platforms and websites. Each one started from a business problem.",
      landingEyebrow: "Landing Pages",
      landingTitle: "Pages built to convert",
      landingSubtitle:
        "One page, one goal: turning visitors into conversations. Design, copy and speed working together.",
      categories: {
        Todos: "All",
        Web: "Web",
        Plataformas: "Platforms",
        "Landing Page": "Landing Page",
      } as Record<string, string>,
      viewProject: "View the case",
      visitProject: "See it live",
      prev: "Previous project",
      next: "Next project",
    },
    combos: {
      title: "Where to start",
      subtitle:
        "Every company is at a different moment. Pick yours — or tell me the problem and I'll design a custom path.",
      mostChosen: "Most popular",
      from: "from",
      cta: "Start here",
      items: [
        {
          name: "Digital Presence",
          tagline:
            "For those losing clients by not being found — or by looking smaller than they are.",
          features: [
            "Fast, responsive institutional website or landing page",
            "Copy and design that lead to contact",
            "WhatsApp and contact form one tap away",
            "Domain, deployment and SEO from day one",
          ],
        },
        {
          name: "Operations & Data",
          tagline:
            "For those already selling, but deciding in the dark and losing hours to manual routine.",
          features: [
            "Dashboard with your business numbers in near real time",
            "Integrations between the systems you already use",
            "Automations that eliminate repetitive work",
            "Organized data for clear decisions",
          ],
        },
        {
          name: "Full Product",
          tagline:
            "For the process that today only works inside someone's head — and needs to become a system.",
          features: [
            "Custom web system, from database to screen",
            "Access and permissions for the team",
            "Admin panel built around how you operate",
            "Live with monitoring, support and evolution",
          ],
        },
      ],
    },
    blog: {
      title: "Notes & ideas",
      subtitle:
        "What I learn using technology to unblock real businesses — no tech jargon.",
      readArticle: "Read article",
    },
    contact: {
      title: "Tell me the problem. Technology is on me.",
      subtitle:
        "No commitment, no jargon: a conversation about where your company loses time — and what to solve first.",
      directBadge: "You talk directly to me",
      whatsappTitlePrefix: "Let's talk on",
      whatsappParagraph:
        "The first conversation is about your business, not a proposal. Reach out and tell me what takes up your day.",
      sendMessage: "Start the conversation",
      highlights: [
        {
          title: "Understand",
          description:
            "First, your business: how it sells, where it gets stuck, what consumes time.",
        },
        {
          title: "Design",
          description:
            "Clear scope and a realistic timeline. Only what drives results makes the plan.",
        },
        {
          title: "Build and follow through",
          description:
            "From code to production, with support and continuous evolution.",
        },
      ],
      contactInfo: "Contact information",
      resumeTitle: "My résumé",
      resumeParagraph:
        "A summary of my experience, education and technical skills.",
      downloadPdf: "Download PDF",
    },
    projectDetail: {
      notFoundBadge: "Case not found",
      notFoundTitle: "Project unavailable",
      notFoundText: "There is no full page for this project yet.",
      backToPortfolio: "Back to portfolio",
      backToProjects: "Back to projects",
      viewLive: "View live project",
      inMotionTitle: "Project in motion",
      inMotionSubtitle:
        "A complete view of the experience and the site's main sections.",
      videoAria: "Video demonstration of the project",
      techUsed: "Technologies used",
      links: "Links",
      liveLink: "Live project",
      repository: "Repository",
      similarTitle: "Is your company stuck at a similar point?",
      similarText:
        "Tell me how it works today. I'll show what can be automated, organized or turned into a system.",
      requestQuote: "Talk about it",
      labelName: "Project name",
      labelProblem: "What was stuck",
      labelSolution: "What I built",
      labelBenefit: "What changed",
      imagesTitle: "Project images",
      imagesSubtitle:
        "Room to expand the case with more screens as new captures come in.",
    },
    blogPost: {
      notFoundBadge: "Article not found",
      notFoundTitle: "This article doesn't exist yet",
      notFoundText: "The article you're looking for may have moved.",
      backToBlog: "Back to blog",
      ctaTitle: "Does this fit your company?",
      ctaText:
        "Share your context and I'll show how this idea becomes a solution — from plan to production.",
      ctaButton: "Chat on WhatsApp",
      keepReading: "Keep reading",
      readArticle: "Read article",
    },
    notFound: {
      title: "Page not found",
      text: "This page doesn't exist — but your problem certainly has a solution. Head back home and tell me about it.",
      goHome: "Back to home",
    },
  },
} as const;

export type UIStrings = (typeof strings)["pt"];

export function getStrings(lang: Lang): UIStrings {
  return strings[lang] as UIStrings;
}
