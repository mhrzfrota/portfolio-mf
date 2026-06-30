export type PostContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type PostSection = {
  heading: string;
  blocks: PostContentBlock[];
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  cover: string;
  lead: string;
  sections: PostSection[];
};

export const posts: Post[] = [
  {
    id: 1,
    slug: "deploy-moderno-fullstack",
    title:
      "Deploy moderno de aplicações Fullstack: do desenvolvimento à produção",
    excerpt:
      "Uma visão prática sobre hospedagem, CI/CD, banco de dados, ambientes e monitoramento para aplicações modernas.",
    date: "2026-05-07",
    readTime: "8 min de leitura",
    tags: ["Deploy", "Fullstack", "CI/CD"],
    cover: "bg-gradient-to-br from-[#0C2AFE] via-[#1B3BFF] to-[#020A2E]",
    lead: "Colocar uma aplicação no ar deixou de ser um passo final e isolado. Hoje, o deploy é um processo contínuo que começa no primeiro commit e acompanha o produto durante toda a sua vida. Este guia reúne as decisões práticas que fazem uma aplicação fullstack chegar à produção de forma estável, rápida e fácil de manter.",
    sections: [
      {
        heading: "Do código ao ambiente",
        blocks: [
          {
            type: "paragraph",
            text: "Antes de pensar em servidores, vale separar com clareza os ambientes em que a aplicação vai rodar. Cada um tem um papel próprio e evita que uma mudança quebre algo que já estava funcionando.",
          },
          {
            type: "list",
            items: [
              "Desenvolvimento: onde o código nasce, com dados de teste e recarga rápida.",
              "Homologação (staging): uma cópia fiel da produção para validar antes de publicar.",
              "Produção: o ambiente real, que serve usuários e precisa de máxima estabilidade.",
            ],
          },
          {
            type: "paragraph",
            text: "Manter esses ambientes parecidos entre si reduz surpresas. Variáveis de ambiente, versões de runtime e dependências devem ser as mesmas em todos eles, mudando apenas as credenciais e os dados.",
          },
        ],
      },
      {
        heading: "CI/CD: automatizar o caminho até produção",
        blocks: [
          {
            type: "paragraph",
            text: "Integração e entrega contínuas transformam o deploy em uma rotina previsível. A cada push, um pipeline roda os testes, gera o build e publica a aplicação sem intervenção manual.",
          },
          {
            type: "list",
            items: [
              "Build: compila o frontend e empacota o backend de forma reproduzível.",
              "Testes: garantem que mudanças não quebrem o que já funciona.",
              "Deploy automático: publica em homologação a cada merge e em produção a cada release.",
            ],
          },
          {
            type: "paragraph",
            text: "O ganho não é só velocidade. Um pipeline bem feito documenta como a aplicação é construída e publicada, tornando o processo independente de quem está no teclado.",
          },
        ],
      },
      {
        heading: "Banco de dados e migrações",
        blocks: [
          {
            type: "paragraph",
            text: "O banco é a parte mais delicada de qualquer deploy, porque guarda o estado real do produto. Mudanças de esquema precisam ser versionadas e aplicadas de forma controlada, com migrações que podem ser revertidas se algo der errado.",
          },
          {
            type: "paragraph",
            text: "Backups automáticos e testes de restauração são tão importantes quanto o próprio deploy. De nada adianta publicar rápido se um erro pode comprometer dados que não têm cópia.",
          },
        ],
      },
      {
        heading: "Observabilidade e monitoramento",
        blocks: [
          {
            type: "paragraph",
            text: "Depois que a aplicação está no ar, o trabalho continua. Logs estruturados, métricas de uso e alertas permitem enxergar problemas antes que o usuário perceba.",
          },
          {
            type: "list",
            items: [
              "Logs: registram o que aconteceu e ajudam a investigar incidentes.",
              "Métricas: mostram desempenho, consumo de recursos e tempo de resposta.",
              "Alertas: avisam a equipe quando algo sai do esperado.",
            ],
          },
        ],
      },
      {
        heading: "Em resumo",
        blocks: [
          {
            type: "paragraph",
            text: "Deploy moderno é menos sobre uma ferramenta específica e mais sobre disciplina: ambientes consistentes, automação confiável, cuidado com os dados e visibilidade contínua. Com essas peças no lugar, publicar deixa de ser um momento de tensão e vira apenas mais um passo natural do desenvolvimento.",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    slug: "ia-mudando-criacao-de-software",
    title: "Como a IA está mudando a forma de criar softwares",
    excerpt:
      "Entenda como a inteligência artificial está ajudando desenvolvedores a criar sistemas mais rápido, automatizar tarefas e melhorar aplicações do dia a dia.",
    date: "2026-05-07",
    readTime: "6 min de leitura",
    tags: ["IA", "Produtividade", "Software"],
    cover: "bg-gradient-to-br from-[#0B1020] via-[#101A3A] to-[#0C2AFE]",
    lead: "A inteligência artificial deixou de ser uma promessa distante e passou a fazer parte do dia a dia de quem cria software. Mais do que escrever código, ela está mudando como pensamos, testamos e entregamos produtos digitais. Vale entender o que muda de verdade e o que continua sendo responsabilidade humana.",
    sections: [
      {
        heading: "Um novo fluxo de desenvolvimento",
        blocks: [
          {
            type: "paragraph",
            text: "O ciclo clássico de escrever, testar e revisar continua existindo, mas ganhou um copiloto. A IA sugere trechos de código, explica funções desconhecidas e ajuda a navegar por bases grandes em segundos. O desenvolvedor passa mais tempo decidindo o que construir e menos tempo preso em detalhes repetitivos.",
          },
        ],
      },
      {
        heading: "Onde a IA realmente acelera",
        blocks: [
          {
            type: "paragraph",
            text: "Os ganhos mais consistentes aparecem em tarefas que consomem tempo sem exigir grandes decisões de arquitetura.",
          },
          {
            type: "list",
            items: [
              "Gerar código repetitivo, testes e documentação a partir de exemplos.",
              "Traduzir uma intenção em linguagem natural para uma primeira versão funcional.",
              "Encontrar bugs e sugerir correções a partir de mensagens de erro.",
              "Refatorar e modernizar código legado com mais segurança.",
            ],
          },
        ],
      },
      {
        heading: "O papel do desenvolvedor",
        blocks: [
          {
            type: "paragraph",
            text: "A IA é rápida, mas não entende o contexto do negócio nem as consequências de uma decisão. Cabe ao desenvolvedor definir requisitos, avaliar trade-offs, garantir segurança e revisar tudo o que é gerado. A ferramenta amplia a capacidade de quem já sabe o que está fazendo; ela não substitui o julgamento.",
          },
        ],
      },
      {
        heading: "Cuidados e limites",
        blocks: [
          {
            type: "paragraph",
            text: "Confiar cegamente no que a IA produz é um risco. Código gerado pode conter erros sutis, repetir más práticas ou expor dados sensíveis. O caminho saudável é tratar a IA como uma sugestão qualificada, sempre validada por testes e revisão humana.",
          },
        ],
      },
      {
        heading: "Para onde isso aponta",
        blocks: [
          {
            type: "paragraph",
            text: "A tendência não é que a IA escreva software sozinha, e sim que cada desenvolvedor produza mais e com mais qualidade. Quem aprende a colaborar com essas ferramentas hoje constrói produtos melhores, mais rápido, e libera tempo para o que realmente importa: resolver problemas reais das pessoas.",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    slug: "dashboards-meta-graph-api",
    title: "Dashboards com Meta Graph API: do dado ao KPI",
    excerpt:
      "Como estruturar coleta e tratamento de métricas do Facebook e Instagram para visualização em tempo quase real.",
    date: "2025-10-12",
    readTime: "7 min de leitura",
    tags: ["Dados", "APIs", "Dashboard"],
    cover: "bg-gradient-to-br from-[#5B7CFF] via-[#2C50FF] to-[#0A1B66]",
    lead: "Métricas de redes sociais só viram decisão quando são organizadas, tratadas e apresentadas com clareza. A Meta Graph API dá acesso aos dados de Facebook e Instagram, mas transformar esses números em um painel útil exige mais do que uma simples requisição. Este é o caminho do dado bruto até um KPI que ajuda a decidir.",
    sections: [
      {
        heading: "Coleta de dados",
        blocks: [
          {
            type: "paragraph",
            text: "Tudo começa na integração com a Meta Graph API. É preciso lidar com autenticação, renovação de tokens e os limites de requisição impostos pela plataforma. Coletar de forma agendada, em vez de sob demanda, evita estourar cotas e mantém o histórico sempre disponível.",
          },
          {
            type: "list",
            items: [
              "Autenticação com tokens de longa duração e renovação automática.",
              "Coleta agendada para respeitar os limites da API.",
              "Armazenamento do dado bruto antes de qualquer transformação.",
            ],
          },
        ],
      },
      {
        heading: "Tratamento e modelagem",
        blocks: [
          {
            type: "paragraph",
            text: "O dado que chega da API raramente está pronto para uso. Ele precisa ser limpo, padronizado e organizado em um modelo que faça sentido para o negócio. Guardar o histórico em um banco como o PostgreSQL permite comparar períodos e calcular tendências, e não apenas mostrar o número do momento.",
          },
        ],
      },
      {
        heading: "Do dado ao KPI",
        blocks: [
          {
            type: "paragraph",
            text: "Um KPI é um número com propósito. Alcance, engajamento e crescimento de seguidores só importam quando ligados a um objetivo. A camada de cálculo é onde os dados brutos viram indicadores: taxas, médias, variações e comparações que respondem a perguntas reais.",
          },
          {
            type: "list",
            items: [
              "Definir quais perguntas o painel precisa responder.",
              "Transformar números absolutos em taxas e comparações.",
              "Destacar variações relevantes em vez de mostrar tudo.",
            ],
          },
        ],
      },
      {
        heading: "Visualização em tempo quase real",
        blocks: [
          {
            type: "paragraph",
            text: "Com os dados tratados e os KPIs definidos, o painel reúne tudo em uma interface clara. A atualização em tempo quase real — alimentada pela coleta agendada — dá a sensação de acompanhamento ao vivo sem sobrecarregar a API. O objetivo é que qualquer pessoa abra o dashboard e entenda a situação em segundos.",
          },
        ],
      },
      {
        heading: "Em resumo",
        blocks: [
          {
            type: "paragraph",
            text: "Construir um dashboard sobre a Meta Graph API é, antes de tudo, um trabalho de engenharia de dados: coletar com cuidado, tratar com critério e apresentar com foco. Quando essas etapas estão bem feitas, o painel deixa de ser um amontoado de gráficos e vira uma ferramenta de decisão.",
          },
        ],
      },
    ],
  },
];

export function getPostBySlug(slug: string) {
  return posts.find(post => post.slug === slug);
}
