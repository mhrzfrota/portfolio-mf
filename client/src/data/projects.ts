export type ProjectImage = {
  src: string;
  alt: string;
  caption: string;
};

export type ProjectCaseStudy = {
  clientProblem: string;
  solution: string;
  benefit: string;
  images: ProjectImage[];
  ctaLabel: string;
};

export type Project = {
  id: number;
  slug?: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
  video?: string;
  liveUrl: string;
  repoUrl: string;
  category: "Web" | "Landing Page" | "Plataformas";
  caseStudy?: ProjectCaseStudy;
};

export const projects: Project[] = [
  {
    id: 4,
    slug: "clipradio",
    title: "Clipradio",
    description:
      "Plataforma para gestão de rádios com agendamentos e gravações automatizadas, usando React/Vite no frontend e Flask no backend, com streaming HLS e transcrição de áudio por IA.",
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
      clientProblem:
        "A equipe precisava monitorar e gravar transmissões de rádio de forma confiável, sem depender de captações manuais e com acesso rápido ao conteúdo veiculado para conferência e clipagem.",
      solution:
        "Desenvolvi uma plataforma com frontend em React/Vite e backend em Flask, com agendamento e gravação automatizada das emissoras, streaming HLS para reprodução, atualizações em tempo real via Socket.IO e transcrição de áudio por IA, tudo containerizado com Docker.",
      benefit:
        "A operação passa a contar com gravações automáticas e organizadas, acesso ágil às transmissões e transcrições que agilizam a clipagem, reduzindo o esforço manual e o risco de perder conteúdo veiculado.",
      images: [
        {
          src: "/images/image2.webp",
          alt: "Tela da plataforma Clipradio",
          caption:
            "Painel de gestão de rádios com agendamentos e reprodução das gravações.",
        },
      ],
      ctaLabel: "Quero uma plataforma parecida",
    },
  },
  {
    id: 2,
    title: "Cícero Experience - Inteligência de Visitação do Horto",
    description:
      "Sistema para a gestão ambiental do Horto do Padre Cícero, com check-in via QR Code e dashboard integrado para contabilizar visitantes e apoiar melhorias na infraestrutura e no fluxo de entrada.",
    tags: [
      "Python",
      "Django",
      "Django REST Framework",
      "PostgreSQL",
      "Dashboard",
      "QR Code",
    ],
    image: "/images/imager5.webp",
    liveUrl: "https://ciceroexperience.vercel.app",
    repoUrl: "https://github.com/helionlf/ciceroExperience_api",
    category: "Plataformas",
  },
  {
    id: 3,
    title: "Landing Page E-book Virtual",
    description:
      'Landing page em HTML, CSS e JavaScript para o livro "A criança e as novas tecnologias", com foco em conversão e visual limpo.',
    tags: ["HTML", "CSS", "JavaScript"],
    image: "/images/image6.webp",
    liveUrl: "https://albertocid.com.br/",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page",
  },
  {
    id: 5,
    title: "Mar&Mov - Moda Praia",
    description:
      "E-commerce front-end para loja de roupas com vitrine de produtos, destaques de coleções e navegação SPA, desenvolvido com React e TypeScript.",
    tags: ["React", "TypeScript", "Vite", "Tailwind CSS", "React Router DOM"],
    image: "/images/image3.webp",
    liveUrl: "https://maremovsuamoda.vercel.app/",
    repoUrl: "https://github.com/mhrzfrota/site-dropshipping",
    category: "Web",
  },
  {
    id: 6,
    title: "MG Aldeota - Landing Page",
    description:
      "Landing page institucional para comunicação e captação de clientes, com seção de serviços, apresentação da marca e CTA para contato.",
    tags: ["HTML", "CSS", "Landing Page", "UI Responsiva"],
    image: "/images/image4.webp",
    liveUrl: "https://mgaldeota.vercel.app/",
    repoUrl: "https://github.com/mhrzfrota/mgaldeota",
    category: "Landing Page",
  },
  {
    id: 7,
    title: "BarretoFit - Landing Page",
    description:
      "Landing page institucional com catálogo e-commerce, desenvolvida para fortalecer a comunicação da marca e captar novos clientes.",
    tags: ["HTML", "CSS"],
    image: "/images/image7.webp",
    liveUrl: "https://barretofit.com.br",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page",
  },
  {
    id: 8,
    title: "Lyre Store - Site Ecommerce",
    description:
      "Site e-commerce em HTML e CSS para uma marca de moda feminina, com vitrine de coleções, navegação por categorias e CTA de compra em destaque.",
    tags: ["HTML", "CSS", "E-commerce"],
    image: "/images/image8.webp",
    liveUrl: "https://lyrestore.vercel.app",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Web",
  },
  {
    id: 9,
    title: "FERPRO Contabilidade - Landing Page",
    description:
      "Landing page institucional para escritório de contabilidade, com apresentação de serviços, diferenciais, depoimentos e CTA para atendimento via WhatsApp.",
    tags: ["HTML", "CSS"],
    image: "/images/image9.jpg",
    liveUrl: "https://www.ferprocontabilidade.com.br/",
    repoUrl: "https://github.com/mhrzfrota/ferpro",
    category: "Landing Page",
  },
  {
    id: 10,
    title: "TZ Produções - Landing Page",
    description:
      "Landing page institucional para produtora de eventos, com apresentação da marca, serviços, portfólio visual e CTA para contato.",
    tags: ["HTML", "CSS", "JavaScript"],
    image: "/images/image10.png",
    video: "/videos/tz-producoes.mp4",
    liveUrl: "https://www.tzproducoes.com.br/",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page",
  },
  {
    id: 11,
    title: "Ramires Barbosa - Desafio 30 Dias",
    description:
      "Landing page para personal trainer com proposta de desafio fitness, seções de transformação, método, benefícios e CTA para entrada na comunidade pelo WhatsApp.",
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
    description:
      "Plataforma web para o Via Shopping Car, shopping de carros em Fortaleza, com apresentação de estoque, informações institucionais e canais de contato para visitas presenciais.",
    tags: ["React", "Vite", "TypeScript", "CSS"],
    image: "/images/vsc.png",
    video: "/videos/via-shopping-car.mp4",
    liveUrl: "https://viashoppingcar.com.br",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Web",
  },
  {
    id: 1,
    slug: "dashboard-meta-analytics",
    title: "Dashboard Meta Analytics",
    description:
      "Sistema de monitoramento de métricas do Facebook e Instagram, integrado à Meta Graph API e PostgreSQL, com visualização de KPIs em tempo quase real.",
    tags: ["Python", "Flask", "React", "PostgreSQL", "Meta Graph API"],
    image: "/images/image1.webp",
    video: "/videos/monitor-dashboard.mp4",
    liveUrl: "https://monitor.mslestrategia.com.br",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Plataformas",
    caseStudy: {
      clientProblem:
        "O cliente precisava acompanhar campanhas e perfis da Meta sem depender de consultas manuais, planilhas soltas ou leituras demoradas em diferentes telas.",
      solution:
        "Criei um dashboard web integrado à Meta Graph API, com backend em Flask, persistência em PostgreSQL e interface em React para centralizar KPIs, filtros e visualizações.",
      benefit:
        "A operação passa a consultar indicadores em um único painel, ganha mais clareza para tomada de decisão e reduz o tempo gasto com acompanhamento manual.",
      images: [
        {
          src: "/images/image1.webp",
          alt: "Tela do Dashboard Meta Analytics",
          caption: "Painel principal com métricas e visualização dos KPIs.",
        },
      ],
      ctaLabel: "Quero um dashboard parecido",
    },
  },
];

const uniqueTechnologies = new Set(projects.flatMap(project => project.tags));
const platformProjects = projects.filter(
  project => project.category === "Plataformas"
);
const landingPages = projects.filter(
  project => project.category === "Landing Page"
);

export const categories = ["Todos", "Web", "Plataformas", "Landing Page"];

export const projectStats = [
  {
    value: String(projects.length).padStart(2, "0"),
    label: "projetos no portfólio",
    detail: "Sistemas, landing pages e vitrines digitais.",
  },
  {
    value: String(platformProjects.length).padStart(2, "0"),
    label: "plataformas e sistemas",
    detail: "Dashboards e sistemas internos sob medida.",
  },
  {
    value: String(landingPages.length).padStart(2, "0"),
    label: "landing pages",
    detail: "Páginas institucionais com foco em conversão.",
  },
  {
    value: String(uniqueTechnologies.size).padStart(2, "0"),
    label: "tecnologias usadas",
    detail: "Stacks variadas conforme objetivo do projeto.",
  },
];

export const featuredProject = projects.find(project => project.caseStudy);

export function getProjectBySlug(slug: string) {
  return projects.find(project => project.slug === slug);
}
