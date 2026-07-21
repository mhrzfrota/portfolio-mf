import type { Lang } from "@/contexts/LanguageContext";

/**
 * Todos os textos de interface do site, em PT e EN.
 * Textos de dados (projetos, posts) ficam localizados nos próprios
 * arquivos de dados (`data/projects.ts`, `data/posts.ts`).
 */
const strings = {
  pt: {
    nav: {
      inicio: "Início",
      projetos: "Projetos",
      combos: "Combos",
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
      requestQuote: "Solicitar orçamento",
      backHome: "MF Services — voltar ao início",
    },
    footer: {
      role: "Desenvolvedor de Software",
    },
    hero: {
      headline: "Desenvolvedor",
      areas: [
        "Full Stack.",
        "Back-end.",
        "Web.",
        "de Automações.",
        "de Soluções Digitais.",
      ],
      ariaHeadline: "Desenvolvedor fullstack — MF Services",
      description:
        "Desenvolvo sites, sistemas e automações sob medida para transformar ideias em soluções que vendem, organizam processos e economizam tempo.",
      facts: [
        "Formado em Análise e Desenvolvimento de Sistemas pela UNIFOR.",
        "Do planejamento ao deploy: projetos com escopo claro, comunicação direta e foco nos resultados do negócio.",
        "Experiência com React, Node.js, TypeScript, PostgreSQL e integração de APIs.",
      ],
      startProject: "Iniciar um projeto",
      viewProjects: "Ver projetos",
    },
    stack: {
      title: "Tecnologias que uso nos projetos",
    },
    projects: {
      title: "Projetos em destaque",
      allTitle: "Todos os projetos",
      deckAria: "Vitrine de projetos em destaque",
      categories: {
        Todos: "Todos",
        Web: "Web",
        Plataformas: "Plataformas",
        "Landing Page": "Landing Page",
      } as Record<string, string>,
      viewProject: "Ver projeto",
      visitProject: "Acessar projeto",
      openRepo: "Abrir repositório de",
      rowTop: "Projetos em destaque, primeira fileira",
      rowBottom: "Projetos em destaque, segunda fileira",
    },
    combos: {
      title: "Combos de serviços",
      subtitle:
        "Pacotes pensados para diferentes momentos do seu negócio. Não achou o ideal? Monto um escopo sob medida.",
      mostChosen: "Mais escolhido",
      from: "a partir de",
      cta: "Quero este combo",
      items: [
        {
          name: "Presença Digital",
          tagline:
            "Para colocar seu negócio no ar com uma página que converte.",
          features: [
            "Landing page responsiva e rápida",
            "Design e textos focados em conversão",
            "Formulário e botão de WhatsApp",
            "Domínio, deploy e SEO básico",
          ],
        },
        {
          name: "Operação & Dados",
          tagline: "Para quem já vende e quer organizar dados e ganhar tempo.",
          features: [
            "Dashboard de métricas em tempo quase real",
            "Integração de APIs (Meta, planilhas, etc.)",
            "Automação de rotinas repetitivas",
            "Tratamento e organização de dados",
          ],
        },
        {
          name: "Produto Completo",
          tagline: "Para tirar uma ideia do papel como um sistema sob medida.",
          features: [
            "Aplicação fullstack (back + front)",
            "Banco de dados e autenticação",
            "Painel administrativo sob medida",
            "Deploy, monitoramento e suporte",
          ],
        },
      ],
    },
    blog: {
      title: "Notas & ideias",
      subtitle: "Notas sobre backend, dados e construção de produtos.",
      readArticle: "Ler artigo",
    },
    contact: {
      title: "Vamos construir juntos.",
      subtitle:
        "Tem um projeto em mente ou quer conversar? Estou aberto a novas oportunidades.",
      directBadge: "Atendimento direto",
      whatsappTitlePrefix: "Vamos conversar pelo",
      whatsappParagraph:
        "Clique no botão abaixo para abrir uma conversa com a mensagem de orçamento já preenchida.",
      sendMessage: "Enviar mensagem",
      highlights: [
        {
          title: "Orçamentos",
          description: "Escopo, prazo e próximos passos definidos com clareza.",
        },
        {
          title: "Landing pages",
          description: "Páginas rápidas, responsivas e focadas em conversão.",
        },
        {
          title: "Dashboards e automações",
          description: "Dados organizados para operação, análise e decisão.",
        },
      ],
      contactInfo: "Informações de contato",
      resumeTitle: "Baixar currículo",
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
      similarTitle: "Quer algo parecido?",
      similarText:
        "Me chame para transformar um problema parecido em uma solução web com painel, automação ou página de conversão.",
      requestQuote: "Pedir orçamento",
      labelName: "Nome do projeto",
      labelProblem: "Problema do cliente",
      labelSolution: "Solução criada",
      labelBenefit: "Resultado ou benefício",
      imagesTitle: "Imagens do projeto",
      imagesSubtitle:
        "Espaço preparado para ampliar o case com mais telas quando houver novas capturas.",
    },
    blogPost: {
      notFoundBadge: "Artigo não encontrado",
      notFoundTitle: "Esse texto ainda não existe",
      notFoundText: "O artigo que você procura pode ter mudado de endereço.",
      backToBlog: "Voltar ao blog",
      ctaTitle: "Quer aplicar isso no seu projeto?",
      ctaText:
        "Posso ajudar a transformar essas ideias em uma solução real, do planejamento à produção.",
      ctaButton: "Conversar no WhatsApp",
      keepReading: "Continue lendo",
      readArticle: "Ler artigo",
    },
    notFound: {
      title: "Página não encontrada",
      text: "Desculpe, a página que você procura não existe. Ela pode ter sido movida ou removida.",
      goHome: "Voltar para o início",
    },
  },
  en: {
    nav: {
      inicio: "Home",
      projetos: "Projects",
      combos: "Bundles",
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
      requestQuote: "Request a quote",
      backHome: "MF Services — back to top",
    },
    footer: {
      role: "Software Developer",
    },
    hero: {
      headline: "Developer",
      areas: [
        "Full Stack.",
        "Back-end.",
        "Web.",
        "of Automations.",
        "of Digital Solutions.",
      ],
      ariaHeadline: "Fullstack developer — MF Services",
      description:
        "I build custom websites, systems and automations that turn ideas into solutions that sell, organize processes and save time.",
      facts: [
        "Degree in Systems Analysis and Development from UNIFOR.",
        "From planning to deploy: projects with clear scope, direct communication and focus on business results.",
        "Experience with React, Node.js, TypeScript, PostgreSQL and API integrations.",
      ],
      startProject: "Start a project",
      viewProjects: "View projects",
    },
    stack: {
      title: "Technologies I work with",
    },
    projects: {
      title: "Featured projects",
      allTitle: "All projects",
      deckAria: "Featured projects showcase",
      categories: {
        Todos: "All",
        Web: "Web",
        Plataformas: "Platforms",
        "Landing Page": "Landing Page",
      } as Record<string, string>,
      viewProject: "View project",
      visitProject: "Visit project",
      openRepo: "Open repository of",
      rowTop: "Featured projects, first row",
      rowBottom: "Featured projects, second row",
    },
    combos: {
      title: "Service bundles",
      subtitle:
        "Packages designed for different moments of your business. Didn't find the right fit? I'll build a custom scope.",
      mostChosen: "Most popular",
      from: "from",
      cta: "I want this bundle",
      items: [
        {
          name: "Digital Presence",
          tagline: "To get your business online with a page that converts.",
          features: [
            "Fast, responsive landing page",
            "Design and copy focused on conversion",
            "Contact form and WhatsApp button",
            "Domain, deploy and basic SEO",
          ],
        },
        {
          name: "Operations & Data",
          tagline:
            "For those already selling who want organized data and more time.",
          features: [
            "Near real-time metrics dashboard",
            "API integrations (Meta, spreadsheets, etc.)",
            "Automation of repetitive routines",
            "Data processing and organization",
          ],
        },
        {
          name: "Full Product",
          tagline: "To take an idea off paper as a custom-built system.",
          features: [
            "Fullstack application (back + front)",
            "Database and authentication",
            "Custom admin panel",
            "Deploy, monitoring and support",
          ],
        },
      ],
    },
    blog: {
      title: "Notes & ideas",
      subtitle: "Notes on backend, data and product building.",
      readArticle: "Read article",
    },
    contact: {
      title: "Let's build together.",
      subtitle:
        "Have a project in mind or want to talk? I'm open to new opportunities.",
      directBadge: "Direct contact",
      whatsappTitlePrefix: "Let's talk on",
      whatsappParagraph:
        "Click the button below to open a conversation with a pre-filled quote message.",
      sendMessage: "Send a message",
      highlights: [
        {
          title: "Quotes",
          description: "Scope, timeline and next steps clearly defined.",
        },
        {
          title: "Landing pages",
          description: "Fast, responsive pages focused on conversion.",
        },
        {
          title: "Dashboards & automations",
          description: "Organized data for operations, analysis and decisions.",
        },
      ],
      contactInfo: "Contact information",
      resumeTitle: "Download résumé",
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
      similarTitle: "Want something similar?",
      similarText:
        "Reach out to turn a similar problem into a web solution with a dashboard, automation or conversion page.",
      requestQuote: "Request a quote",
      labelName: "Project name",
      labelProblem: "Client's problem",
      labelSolution: "Solution built",
      labelBenefit: "Result or benefit",
      imagesTitle: "Project images",
      imagesSubtitle:
        "Room to expand the case with more screens as new captures come in.",
    },
    blogPost: {
      notFoundBadge: "Article not found",
      notFoundTitle: "This article doesn't exist yet",
      notFoundText: "The article you're looking for may have moved.",
      backToBlog: "Back to blog",
      ctaTitle: "Want to apply this to your project?",
      ctaText:
        "I can help turn these ideas into a real solution, from planning to production.",
      ctaButton: "Chat on WhatsApp",
      keepReading: "Keep reading",
      readArticle: "Read article",
    },
    notFound: {
      title: "Page not found",
      text: "Sorry, the page you're looking for doesn't exist. It may have been moved or removed.",
      goHome: "Back to home",
    },
  },
} as const;

export type UIStrings = (typeof strings)["pt"];

export function getStrings(lang: Lang): UIStrings {
  return strings[lang] as UIStrings;
}
