/** Texto com versão em cada idioma do site. */
export type Localized = { pt: string; en: string };

export type ProjectImage = {
  src: string;
  alt: Localized;
  caption: Localized;
};

export type ProjectCaseStudy = {
  clientProblem: Localized;
  solution: Localized;
  benefit: Localized;
  images: ProjectImage[];
  ctaLabel: Localized;
};

export type Project = {
  id: number;
  slug?: string;
  title: string;
  description: Localized;
  tags: string[];
  image: string;
  video?: string;
  liveUrl: string;
  repoUrl: string;
  category: "Web" | "Landing Page" | "Plataformas";
  caseStudy?: ProjectCaseStudy;
  /** Aparece no deck com scroll da seção "Projetos em destaque". */
  featured?: boolean;
};

export const projects: Project[] = [
  {
    id: 4,
    slug: "clipradio",
    title: "Clipradio",
    description: {
      pt: "Plataforma para gestão de rádios com agendamentos e gravações automatizadas, usando React/Vite no frontend e Flask no backend, com streaming HLS e transcrição de áudio por IA.",
      en: "Radio management platform with automated scheduling and recording, using React/Vite on the frontend and Flask on the backend, with HLS streaming and AI audio transcription.",
    },
    tags: [
      "React",
      "Vite",
      "Flask",
      "PostgreSQL",
      "Socket.IO",
      "HLS.js",
      "Docker",
    ],
    image: "/images/image2.webp",
    liveUrl: "#",
    repoUrl: "https://github.com/Ambiente-MSL/clipradio",
    category: "Plataformas",
    caseStudy: {
      clientProblem: {
        pt: "A equipe precisava monitorar e gravar transmissões de rádio de forma confiável, sem depender de captações manuais e com acesso rápido ao conteúdo veiculado para conferência e clipagem.",
        en: "The team needed to monitor and record radio broadcasts reliably, without depending on manual captures, with quick access to aired content for review and clipping.",
      },
      solution: {
        pt: "Desenvolvi uma plataforma com frontend em React/Vite e backend em Flask, com agendamento e gravação automatizada das emissoras, streaming HLS para reprodução, atualizações em tempo real via Socket.IO e transcrição de áudio por IA, tudo containerizado com Docker.",
        en: "I built a platform with a React/Vite frontend and Flask backend, featuring automated station scheduling and recording, HLS streaming for playback, real-time updates via Socket.IO and AI audio transcription, all containerized with Docker.",
      },
      benefit: {
        pt: "A operação passa a contar com gravações automáticas e organizadas, acesso ágil às transmissões e transcrições que agilizam a clipagem, reduzindo o esforço manual e o risco de perder conteúdo veiculado.",
        en: "The operation now has automatic, organized recordings, fast access to broadcasts and transcriptions that speed up clipping, reducing manual effort and the risk of missing aired content.",
      },
      images: [
        {
          src: "/images/image2.webp",
          alt: {
            pt: "Tela da plataforma Clipradio",
            en: "Clipradio platform screen",
          },
          caption: {
            pt: "Painel de gestão de rádios com agendamentos e reprodução das gravações.",
            en: "Radio management panel with scheduling and recording playback.",
          },
        },
      ],
      ctaLabel: {
        pt: "Quero uma plataforma parecida",
        en: "I want a similar platform",
      },
    },
  },
  {
    id: 3,
    title: "Landing Page E-book Virtual",
    description: {
      pt: 'Landing page em HTML, CSS e JavaScript para o livro "A criança e as novas tecnologias", com foco em conversão e visual limpo.',
      en: 'Landing page in HTML, CSS and JavaScript for the book "Children and New Technologies", focused on conversion and a clean look.',
    },
    tags: ["HTML", "CSS", "JavaScript"],
    image: "/images/image6.webp",
    liveUrl: "https://albertocid.com.br/",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page",
  },
  {
    id: 5,
    title: "Mar&Mov - Moda Praia",
    description: {
      pt: "E-commerce front-end para loja de roupas com vitrine de produtos, destaques de coleções e navegação SPA, desenvolvido com React e TypeScript.",
      en: "E-commerce front-end for a clothing store with a product showcase, collection highlights and SPA navigation, built with React and TypeScript.",
    },
    tags: ["React", "TypeScript", "Vite", "Tailwind CSS", "React Router DOM"],
    image: "/images/image3.webp",
    liveUrl: "https://maremovsuamoda.vercel.app/",
    repoUrl: "https://github.com/mhrzfrota/site-dropshipping",
    category: "Web",
  },
  {
    id: 6,
    title: "MG Aldeota - Landing Page",
    description: {
      pt: "Landing page institucional para comunicação e captação de clientes, com seção de serviços, apresentação da marca e CTA para contato.",
      en: "Institutional landing page for communication and client acquisition, with a services section, brand presentation and a contact CTA.",
    },
    tags: ["HTML", "CSS", "Landing Page", "UI Responsiva"],
    image: "/images/image4.webp",
    liveUrl: "https://mgaldeota.vercel.app/",
    repoUrl: "https://github.com/mhrzfrota/mgaldeota",
    category: "Landing Page",
    featured: true,
  },
  {
    id: 7,
    title: "BarretoFit - Landing Page",
    description: {
      pt: "Landing page institucional com catálogo e-commerce, desenvolvida para fortalecer a comunicação da marca e captar novos clientes.",
      en: "Institutional landing page with an e-commerce catalog, built to strengthen brand communication and attract new clients.",
    },
    tags: ["HTML", "CSS"],
    image: "/images/image7.webp",
    liveUrl: "https://barretofit.com.br",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page",
  },
  {
    id: 8,
    title: "Lyre Store - Site Ecommerce",
    description: {
      pt: "Site e-commerce em HTML e CSS para uma marca de moda feminina, com vitrine de coleções, navegação por categorias e CTA de compra em destaque.",
      en: "E-commerce site in HTML and CSS for a women's fashion brand, with a collection showcase, category navigation and a prominent purchase CTA.",
    },
    tags: ["HTML", "CSS", "E-commerce"],
    image: "/images/image8.webp",
    liveUrl: "https://lyrestore.vercel.app",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Web",
  },
  {
    id: 9,
    title: "FERPRO Contabilidade - Landing Page",
    description: {
      pt: "Landing page institucional para escritório de contabilidade, com apresentação de serviços, diferenciais, depoimentos e CTA para atendimento via WhatsApp.",
      en: "Institutional landing page for an accounting firm, presenting services, differentiators, testimonials and a WhatsApp contact CTA.",
    },
    tags: ["HTML", "CSS"],
    image: "/images/image9.jpg",
    liveUrl: "https://www.ferprocontabilidade.com.br/",
    repoUrl: "https://github.com/mhrzfrota/ferpro",
    category: "Landing Page",
  },
  {
    id: 10,
    title: "TZ Produções - Landing Page",
    description: {
      pt: "Landing page institucional para produtora de eventos, com apresentação da marca, serviços, portfólio visual e CTA para contato.",
      en: "Institutional landing page for an event production company, with brand presentation, services, a visual portfolio and a contact CTA.",
    },
    tags: ["HTML", "CSS", "JavaScript"],
    image: "/images/image10.jpg",
    video: "/videos/tz-producoes.mp4",
    liveUrl: "https://www.tzproducoes.com.br/",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page",
    featured: true,
  },
  {
    id: 11,
    title: "Ramires Barbosa - Desafio 30 Dias",
    description: {
      pt: "Landing page para personal trainer com proposta de desafio fitness, seções de transformação, método, benefícios e CTA para entrada na comunidade pelo WhatsApp.",
      en: "Landing page for a personal trainer's fitness challenge, with transformation, method and benefits sections and a WhatsApp community CTA.",
    },
    tags: ["HTML", "CSS", "JavaScript", "Landing Page"],
    image: "/images/ramires-personal.jpg",
    video: "/videos/ramires.mp4",
    liveUrl: "https://lp-ramirespersonal.vercel.app/",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page",
  },
  {
    id: 12,
    title: "Via Shopping Car",
    description: {
      pt: "Plataforma web para o Via Shopping Car, shopping de carros em Fortaleza, com apresentação de estoque, informações institucionais e canais de contato para visitas presenciais.",
      en: "Web platform for Via Shopping Car, a car mall in Fortaleza, presenting inventory, institutional information and contact channels for in-person visits.",
    },
    tags: ["React", "Vite", "TypeScript", "CSS"],
    image: "/images/vsc.jpg",
    video: "/videos/via-shopping-car.mp4",
    liveUrl: "https://viashoppingcar.com.br",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Web",
    featured: true,
  },
  {
    id: 1,
    slug: "dashboard-meta-analytics",
    title: "Dashboard Meta Analytics",
    description: {
      pt: "Sistema de monitoramento de métricas do Facebook e Instagram, integrado à Meta Graph API e PostgreSQL, com visualização de KPIs em tempo quase real.",
      en: "Facebook and Instagram metrics monitoring system, integrated with the Meta Graph API and PostgreSQL, with near real-time KPI visualization.",
    },
    tags: ["Python", "Flask", "React", "PostgreSQL", "Meta Graph API"],
    image: "/images/image1.webp",
    video: "/videos/monitor-dashboard.mp4",
    liveUrl: "https://monitor.mslestrategia.com.br",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Plataformas",
    caseStudy: {
      clientProblem: {
        pt: "O cliente precisava acompanhar campanhas e perfis da Meta sem depender de consultas manuais, planilhas soltas ou leituras demoradas em diferentes telas.",
        en: "The client needed to track Meta campaigns and profiles without relying on manual checks, scattered spreadsheets or slow reads across different screens.",
      },
      solution: {
        pt: "Criei um dashboard web integrado à Meta Graph API, com backend em Flask, persistência em PostgreSQL e interface em React para centralizar KPIs, filtros e visualizações.",
        en: "I created a web dashboard integrated with the Meta Graph API, with a Flask backend, PostgreSQL persistence and a React interface centralizing KPIs, filters and visualizations.",
      },
      benefit: {
        pt: "A operação passa a consultar indicadores em um único painel, ganha mais clareza para tomada de decisão e reduz o tempo gasto com acompanhamento manual.",
        en: "The operation now checks indicators in a single panel, gains clarity for decision-making and cuts the time spent on manual tracking.",
      },
      images: [
        {
          src: "/images/image1.webp",
          alt: {
            pt: "Tela do Dashboard Meta Analytics",
            en: "Meta Analytics Dashboard screen",
          },
          caption: {
            pt: "Painel principal com métricas e visualização dos KPIs.",
            en: "Main panel with metrics and KPI visualization.",
          },
        },
      ],
      ctaLabel: {
        pt: "Quero um dashboard parecido",
        en: "I want a similar dashboard",
      },
    },
  },
  {
    id: 13,
    slug: "montadora-fenix",
    title: "Montadora Fênix",
    description: {
      pt: "Site institucional para uma empresa de arquitetura de eventos e montagem de stands promocionais, com apresentação da marca, indicadores, portfólio visual e contato direto para orçamento.",
      en: "Institutional website for an event architecture and promotional stand assembly company, with brand presentation, indicators, a visual portfolio and direct quote contact.",
    },
    tags: ["HTML", "CSS", "JavaScript", "UI Responsiva"],
    image: "/images/montadora-fenix/tela-1.jpg",
    video: "/videos/montadora-fenix.mp4",
    liveUrl: "https://montadorafenix.com.br",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Web",
    featured: true,
    caseStudy: {
      clientProblem: {
        pt: "A Montadora Fênix precisava renovar sua presença digital para comunicar melhor sua experiência em arquitetura de eventos, apresentar a qualidade dos stands já produzidos e facilitar o primeiro contato de novos clientes.",
        en: "Montadora Fênix needed to renew its digital presence to better communicate its event architecture experience, showcase the quality of previously built stands and make first contact easier for new clients.",
      },
      solution: {
        pt: "Desenvolvi um site institucional responsivo com identidade visual alinhada à marca, hero em vídeo, apresentação da empresa, indicadores de experiência, portfólio de projetos e chamadas estratégicas para solicitação de orçamento pelo WhatsApp.",
        en: "I built a responsive institutional website aligned with the brand identity, featuring a video hero, company presentation, experience indicators, a project portfolio and strategic WhatsApp quote CTAs.",
      },
      benefit: {
        pt: "A empresa passou a contar com uma vitrine digital mais atual e convincente, capaz de reunir seus principais diferenciais, valorizar visualmente os trabalhos realizados e encurtar o caminho entre a visita ao site e o pedido de orçamento.",
        en: "The company gained a more modern, convincing digital showcase that gathers its main differentiators, visually highlights past work and shortens the path from site visit to quote request.",
      },
      images: [
        {
          src: "/images/montadora-fenix/tela-1.jpg",
          alt: {
            pt: "Página inicial do site da Montadora Fênix",
            en: "Montadora Fênix website home page",
          },
          caption: {
            pt: "Hero institucional com proposta de valor e chamadas para orçamento e portfólio.",
            en: "Institutional hero with value proposition and quote/portfolio CTAs.",
          },
        },
        {
          src: "/images/montadora-fenix/tela-2.jpg",
          alt: {
            pt: "Seção institucional e indicadores da Montadora Fênix",
            en: "Montadora Fênix institutional section and indicators",
          },
          caption: {
            pt: "Apresentação da história, forma de trabalho, valores e indicadores da empresa.",
            en: "Presentation of the company's history, way of working, values and indicators.",
          },
        },
        {
          src: "/images/montadora-fenix/tela-3.jpg",
          alt: {
            pt: "Portfólio de stands no site da Montadora Fênix",
            en: "Stand portfolio on the Montadora Fênix website",
          },
          caption: {
            pt: "Galeria visual que destaca projetos de stands executados pela Montadora Fênix.",
            en: "Visual gallery highlighting stand projects built by Montadora Fênix.",
          },
        },
      ],
      ctaLabel: {
        pt: "Quero um site institucional",
        en: "I want an institutional website",
      },
    },
  },
  {
    id: 14,
    title: "Amsterdam Advocacia - Landing Page",
    description: {
      pt: "Landing page premium para escritório de advocacia com mais de 40 anos de atuação, com identidade de marca aplicada, seção de missão, visão e valores e apresentação dos sócios.",
      en: "Premium landing page for a 40-year law firm, with the brand identity applied, a mission/vision/values section and partner presentation.",
    },
    tags: ["HTML", "CSS", "JavaScript", "Landing Page"],
    image: "/images/amsterdam.png",
    liveUrl: "https://amsterdan.vercel.app/",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page",
  },
];

export const categories = ["Todos", "Web", "Plataformas", "Landing Page"];

export function getProjectBySlug(slug: string) {
  return projects.find(project => project.slug === slug);
}
