import type { Lang } from "@/contexts/LanguageContext";

export type PostContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  /** Frase de destaque, para a regra que o texto quer que fique de pé sozinha. */
  | { type: "quote"; text: string }
  | { type: "code"; label?: string; code: string }
  /** Desenho em texto: o mesmo diagrama serve claro, escuro e leitor de tela. */
  | { type: "diagram"; ascii: string; caption?: string }
  | { type: "image"; src: string; alt: string; caption: string }
  /** Ilustração animada do artigo; `name` escolhe qual desenho renderizar. */
  | {
      type: "visual";
      name: "orchestration" | "workspace" | "vault";
      caption: string;
    }
  | { type: "cards"; items: { title: string; text: string }[] };

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

const postsPt: Post[] = [
  {
    id: 4,
    slug: "orquestracao-agentes-ia",
    title: "Meu ambiente de desenvolvimento com múltiplos agentes de IA",
    excerpt:
      "Como organizei projetos, terminais, Claude Code, Codex e uma base de conhecimento no Obsidian dentro de um único ambiente de trabalho.",
    date: "2026-08-28",
    readTime: "12 min de leitura",
    tags: ["IA", "Workflow", "Obsidian"],
    cover: "bg-gradient-to-br from-[#020A2E] via-[#0C2AFE] to-[#5B7CFF]",
    lead: "Em vez de trabalhar em uma única janela do VS Code, alternando o tempo todo entre abas e ferramentas, passei a montar um ambiente em que cada agente tem uma função específica dentro do projeto. A ideia é simples: separar execução, revisão, contexto e documentação sem perder a visão geral. Este é o passo a passo de como esse ambiente funciona — e por que a parte mais importante dele não é a IA, é a memória.",
    sections: [
      {
        heading: "O ponto de partida",
        blocks: [
          {
            type: "paragraph",
            text: "Antes desse fluxo, meu processo acontecia inteiro dentro do VS Code. Eu já usava agentes como o Claude Code e o Codex, alternando entre abas e terminais conforme a tarefa mudava.",
          },
          {
            type: "paragraph",
            text: "Funcionava. Mas quando comecei a tocar vários projetos ao mesmo tempo, ficou difícil enxergar quem estava fazendo o quê: um agente refatorando aqui, outro esperando resposta ali, e eu tentando lembrar em qual aba estava cada coisa.",
          },
          {
            type: "visual",
            name: "orchestration",
            caption:
              "O ambiente em um desenho: um projeto, e as três formas de entrar nele — todas sobre os mesmos arquivos.",
          },
        ],
      },
      {
        heading: "O projeto deixa de ser uma janela",
        blocks: [
          {
            type: "paragraph",
            text: "A mudança de cabeça foi parar de tratar o projeto como uma janela aberta e passar a tratá-lo como um núcleo. Em volta desse núcleo ficam os terminais e os agentes, todos apontando para o mesmo lugar.",
          },
          {
            type: "diagram",
            ascii: `                    PROJETO
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Terminal      Claude Code      Codex
        │              │              │
        └──────────────┼──────────────┘
                       │
                   Código-fonte`,
          },
          {
            type: "paragraph",
            text: "O detalhe que mais confunde quem vê isso pela primeira vez é este: os agentes não têm projetos separados. Eles trabalham sobre o mesmo diretório Git, com os mesmos arquivos na mesma árvore.",
          },
          {
            type: "code",
            label: "estrutura do projeto",
            code: `~/Documents/FRT-CEREBRO/
│
├── src/
├── public/
├── package.json
├── AGENTS.md
├── README.md
└── .git/`,
          },
          {
            type: "diagram",
            ascii: `                    FRT-CEREBRO
                         │
                         ▼
              ~/Documents/FRT-CEREBRO
                   /     |     \\
                  ▼      ▼      ▼
               Claude  Codex  Terminal`,
            caption:
              "Os três enxergam os mesmos arquivos — o que muda é o papel de cada um.",
          },
        ],
      },
      {
        heading: "01. Cada projeto ganha o seu próprio workspace",
        blocks: [
          {
            type: "paragraph",
            text: "O primeiro passo é dar a cada projeto um espaço visual próprio, com os terminais que pertencem a ele. Nada de misturar: um projeto, um workspace, os agentes daquele projeto dentro dele.",
          },
          {
            type: "code",
            label: "diretórios",
            code: `# Projeto A
~/Documents/FRT-CEREBRO

# Projeto B
~/Desktop/projects/villashub`,
          },
          {
            type: "paragraph",
            text: "Assim, trocar de projeto é trocar de tela inteira — e não caçar qual aba pertencia a qual cliente.",
          },
        ],
      },
      {
        heading: "02. Um terminal para o Claude Code",
        blocks: [
          {
            type: "code",
            label: "terminal 1",
            code: `cd ~/Documents/FRT-CEREBRO

claude`,
          },
          {
            type: "paragraph",
            text: "A partir daí o Claude passa a trabalhar naquele contexto: lê os arquivos do projeto, roda comandos e edita código dentro daquele diretório.",
          },
        ],
      },
      {
        heading: "03. Outro terminal para o Codex",
        blocks: [
          {
            type: "code",
            label: "terminal 2",
            code: `cd ~/Documents/FRT-CEREBRO

codex`,
          },
          {
            type: "paragraph",
            text: "Mesmo diretório, segundo agente. Agora o projeto tem dois pares de olhos, e é aqui que a divisão de responsabilidades começa a valer a pena.",
          },
          {
            type: "diagram",
            ascii: `FRT-CEREBRO
    │
    ├── Claude Code
    │
    └── Codex`,
          },
        ],
      },
      {
        heading: "O segredo: dividir responsabilidades",
        blocks: [
          {
            type: "paragraph",
            text: "Dois agentes fazendo a mesma coisa é desperdício. O ganho aparece quando cada um tem um papel claro dentro do ciclo.",
          },
          {
            type: "cards",
            items: [
              {
                title: "Claude Code",
                text: "Implementação maior, exploração do projeto, refatorações, criação de funcionalidades e debugging longo.",
              },
              {
                title: "Codex",
                text: "Segunda análise, revisão do que foi feito, caça a problemas, pequenas implementações e validação das decisões do primeiro agente.",
              },
            ],
          },
          {
            type: "diagram",
            ascii: `             FEATURE
                │
                ▼
        ┌──────────────┐
        │ Claude Code  │
        │  implementa  │
        └──────┬───────┘
               │
               ▼
             Código
               │
               ▼
        ┌──────────────┐
        │    Codex     │
        │    revisa    │
        └──────┬───────┘
               │
               ▼
         Ajustes finais`,
          },
          {
            type: "paragraph",
            text: "Quem revisa não é quem escreveu. Vale para gente e vale para agente: o segundo modelo chega sem o apego às decisões do primeiro e questiona o que o outro deu como resolvido.",
          },
        ],
      },
      {
        heading: "A regra que evita o caos",
        blocks: [
          {
            type: "quote",
            text: "Nunca deixo dois agentes mexendo no mesmo trecho de código ao mesmo tempo.",
          },
          {
            type: "paragraph",
            text: "Sem essa regra, o ambiente vira um problema em vez de uma vantagem:",
          },
          {
            type: "list",
            items: [
              "arquivos sobrescritos, com o trabalho de um apagando o do outro;",
              "decisões conflitantes dentro da mesma funcionalidade;",
              "alterações difíceis de revisar, porque ninguém sabe de onde vieram;",
              "contexto divergente: cada agente acreditando em uma versão do projeto.",
            ],
          },
          {
            type: "paragraph",
            text: "Na prática, só existem dois arranjos seguros — em série, ou em arquivos diferentes.",
          },
          {
            type: "diagram",
            ascii: `EM SÉRIE                    EM PARALELO

Claude → implementação      Claude → feature A
           ↓                Codex  → feature B
        termina                       ↓
           ↓                  arquivos diferentes
Codex  → revisão                      ↓
           ↓                     sem colisão
        ajustes
           ↓
      git commit`,
          },
        ],
      },
      {
        heading: "O Git continua no centro",
        blocks: [
          {
            type: "paragraph",
            text: "Nada disso vira um ambiente mágico e sem controle. Tudo o que os agentes fazem cai na árvore de trabalho, e a árvore de trabalho continua sendo minha.",
          },
          {
            type: "diagram",
            ascii: `Claude ──┐
         │
Codex  ──┼──→ working tree ──→ git diff ──→ commit
         │
Eu ──────┘`,
          },
          {
            type: "code",
            label: "o de sempre",
            code: `git status
git diff
git add .
git commit -m "feat: ..."`,
          },
          {
            type: "paragraph",
            text: "A revisão manual continua acontecendo, no terminal ou no próprio VS Code. A IA executa; eu continuo respondendo pelo código que entra no repositório.",
          },
        ],
      },
      {
        heading: "A aplicação rodando também faz parte do ambiente",
        blocks: [
          {
            type: "visual",
            name: "workspace",
            caption:
              "Cada janela tem uma responsabilidade, mas todas fazem parte do mesmo fluxo.",
          },
          {
            type: "list",
            items: [
              "① Aplicação rodando em localhost",
              "② Claude Code, implementando",
              "③ Codex, revisando",
              "④ O projeto e seus arquivos",
              "⑤ Obsidian, o contexto",
            ],
          },
          {
            type: "paragraph",
            text: "Com a aplicação aberta ao lado dos agentes, o ciclo fecha sem eu sair do ambiente: o agente altera, o servidor recarrega, eu olho a tela e digo o que ainda está errado.",
          },
          {
            type: "diagram",
            ascii: `        Claude / Codex
              │
              ▼
            código
              │
              ▼
         npm run dev
              │
              ▼
          localhost
              │
              ▼
      validação visual
              │
              ▼
         novo ajuste`,
          },
        ],
      },
      {
        heading: "O problema de usar IA sem memória",
        blocks: [
          {
            type: "paragraph",
            text: "Modelos são muito bons em executar tarefas, mas esbarram sempre no mesmo ponto: contexto. Um agente pode conhecer o projeto a fundo durante uma sessão e, na conversa seguinte, precisar reconstruir quase tudo do zero.",
          },
          {
            type: "paragraph",
            text: "A solução não é um prompt maior. É tirar o conhecimento de dentro das conversas e colocá-lo em um lugar que sobreviva a elas.",
          },
          {
            type: "diagram",
            ascii: `                 OBSIDIAN
                    │
               conhecimento
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Claude Code            Codex
          │                   │
          └─────────┬─────────┘
                    ▼
                 Projeto`,
          },
        ],
      },
      {
        heading: "O Obsidian como segundo cérebro",
        blocks: [
          {
            type: "visual",
            name: "vault",
            caption:
              "Projetos, clientes, decisões, referências e aprendizados vivem fora das conversas dos agentes.",
          },
          {
            type: "paragraph",
            text: "Para um agente, isso não é “um Obsidian”. São arquivos Markdown em um diretório — exatamente o tipo de coisa que ele já sabe ler. O Obsidian é a interface confortável para mim; o conteúdo é texto puro, versionável e legível por qualquer ferramenta.",
          },
        ],
      },
      {
        heading: "AGENTS.md: a primeira coisa que o agente lê",
        blocks: [
          {
            type: "paragraph",
            text: "Um arquivo na raiz concentra o que todo agente precisa saber antes de escrever a primeira linha: stack, regras, arquitetura e convenções.",
          },
          {
            type: "code",
            label: "AGENTS.md",
            code: `# AGENTS.md

## Stack
- Next.js
- TypeScript
- Tailwind
- Supabase

## Regras
- Nunca modificar migrations sem autorização.
- Sempre verificar responsividade.
- Rodar os testes antes de finalizar.
- Não fazer deploy automaticamente.

## Arquitetura
src/
  components/
  services/
  hooks/
  pages/

## Convenções
- Componentes em PascalCase
- Funções em camelCase
- Commits em Conventional Commits`,
          },
          {
            type: "paragraph",
            text: "Repare que metade do arquivo são proibições. É o que evita o tipo de iniciativa que ninguém pediu — apagar uma migration, subir para produção, reescrever o que já estava decidido.",
          },
        ],
      },
      {
        heading: "Uma nota por projeto",
        blocks: [
          {
            type: "paragraph",
            text: "Além das regras gerais, cada projeto tem a sua própria nota, com o estado atual e o que ficou pendente.",
          },
          {
            type: "code",
            label: "projetos/villas-flow.md",
            code: `# Villas Flow

## Stack
Next.js + Supabase + Vercel

## Objetivo
Sistema interno de gestão.

## Banco
Supabase

## Decisões
- autenticação via Supabase Auth
- deploy via Vercel

## Pendências
- revisar dashboard
- corrigir mobile
- melhorar loading`,
          },
          {
            type: "paragraph",
            text: "Com isso, abrir uma sessão nova deixa de ser uma explicação inteira e vira uma frase: leia a nota do projeto antes de começar.",
          },
          {
            type: "diagram",
            ascii: `SEM CONTEXTO EXTERNO         COM O CÉREBRO

nova conversa                nova conversa
      ↓                            ↓
"me explique esse             leia AGENTS.md
 projeto"                          ↓
      ↓                      leia projetos/*.md
o agente explora                   ↓
tudo de novo                 leia decisões
      ↓                            ↓
minutos gastos               entende o ambiente
para chegar                        ↓
onde já estávamos            começa a trabalhar`,
          },
        ],
      },
      {
        heading: "O fluxo completo",
        blocks: [
          {
            type: "diagram",
            ascii: `                        EU
                         │
                         ▼
                     AMBIENTE
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
   Projeto A         Projeto B         Projeto C
       │
       ├───────────────┐
       ▼               ▼
 Claude Code         Codex
 implementação       revisão
       │               │
       └───────┬───────┘
               ▼
             Código
               │
               ▼
              Git
               │
               ▼
        aplicação local
               ▲
               │
       ┌───────┴────────┐
       ▼                ▼
   AGENTS.md        OBSIDIAN
                        │
                   conhecimento
                        │
              projetos / clientes /
              decisões / referências`,
            caption: "O ambiente inteiro em um desenho só.",
          },
        ],
      },
      {
        heading: "Não é sobre ter mais agentes",
        blocks: [
          {
            type: "paragraph",
            text: "O objetivo nunca foi abrir mais janelas. É montar uma arquitetura de trabalho em que cada ferramenta tem uma responsabilidade clara — e em que a última palavra continua sendo humana.",
          },
          {
            type: "cards",
            items: [
              {
                title: "Contexto",
                text: "O Obsidian e a documentação mantêm o conhecimento vivo entre uma sessão e outra.",
              },
              {
                title: "Execução",
                text: "Claude Code ou Codex implementam a tarefa dentro do diretório do projeto.",
              },
              {
                title: "Revisão",
                text: "Um segundo agente questiona a implementação do primeiro antes de qualquer commit.",
              },
              {
                title: "Controle",
                text: "Git e revisão manual seguem sendo a fonte final de verdade sobre o que entra no código.",
              },
            ],
          },
        ],
      },
      {
        heading: "Em resumo",
        blocks: [
          {
            type: "paragraph",
            text: "Tecnologia não é só escrever código. Um bom ambiente de desenvolvimento reduz contexto perdido, melhora a revisão e permite usar IA como parte real do processo de engenharia — e não como um atalho para pedir código pronto.",
          },
          {
            type: "paragraph",
            text: "Esse é um dos fluxos que uso nos projetos que desenvolvo na MF Services. O ambiente muda conforme as ferramentas mudam; a divisão entre contexto, execução, revisão e controle é o que permanece.",
          },
        ],
      },
    ],
  },
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

const postsEn: Post[] = [
  {
    id: 4,
    slug: "orquestracao-agentes-ia",
    title: "My development environment with multiple AI agents",
    excerpt:
      "How I organised projects, terminals, Claude Code, Codex and an Obsidian knowledge base inside a single workspace.",
    date: "2026-08-28",
    readTime: "12 min read",
    tags: ["AI", "Workflow", "Obsidian"],
    cover: "bg-gradient-to-br from-[#020A2E] via-[#0C2AFE] to-[#5B7CFF]",
    lead: "Instead of working in a single VS Code window, constantly switching between tabs and tools, I started building an environment where each agent has a specific job inside the project. The idea is simple: separate execution, review, context and documentation without losing the big picture. This is how that environment works — and why its most important part is not the AI, it's the memory.",
    sections: [
      {
        heading: "The starting point",
        blocks: [
          {
            type: "paragraph",
            text: "Before this workflow, my whole process lived inside VS Code. I already used agents like Claude Code and Codex, switching between tabs and terminals as the task changed.",
          },
          {
            type: "paragraph",
            text: "It worked. But once I started running several projects at the same time, it got hard to see who was doing what: one agent refactoring here, another waiting for an answer there, and me trying to remember which tab held which thing.",
          },
          {
            type: "visual",
            name: "orchestration",
            caption:
              "The environment as a drawing: one project and the three ways into it — all on the same files.",
          },
        ],
      },
      {
        heading: "A project stops being a window",
        blocks: [
          {
            type: "paragraph",
            text: "The mental shift was to stop treating a project as an open window and start treating it as a core. Around that core sit the terminals and the agents, all pointing at the same place.",
          },
          {
            type: "diagram",
            ascii: `                    PROJECT
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Terminal      Claude Code      Codex
        │              │              │
        └──────────────┼──────────────┘
                       │
                   Source code`,
          },
          {
            type: "paragraph",
            text: "The detail that confuses people seeing this for the first time is this one: the agents do not have separate projects. They work on the same Git directory, on the same files, in the same tree.",
          },
          {
            type: "code",
            label: "project structure",
            code: `~/Documents/FRT-CEREBRO/
│
├── src/
├── public/
├── package.json
├── AGENTS.md
├── README.md
└── .git/`,
          },
          {
            type: "diagram",
            ascii: `                    FRT-CEREBRO
                         │
                         ▼
              ~/Documents/FRT-CEREBRO
                   /     |     \\
                  ▼      ▼      ▼
               Claude  Codex  Terminal`,
            caption:
              "All three see the same files — what changes is their role.",
          },
        ],
      },
      {
        heading: "01. Every project gets its own workspace",
        blocks: [
          {
            type: "paragraph",
            text: "The first step is giving each project its own visual space, with the terminals that belong to it. No mixing: one project, one workspace, its agents inside it.",
          },
          {
            type: "code",
            label: "directories",
            code: `# Project A
~/Documents/FRT-CEREBRO

# Project B
~/Desktop/projects/villashub`,
          },
          {
            type: "paragraph",
            text: "Switching projects becomes switching the whole screen — not hunting for which tab belonged to which client.",
          },
        ],
      },
      {
        heading: "02. One terminal for Claude Code",
        blocks: [
          {
            type: "code",
            label: "terminal 1",
            code: `cd ~/Documents/FRT-CEREBRO

claude`,
          },
          {
            type: "paragraph",
            text: "From there Claude works in that context: it reads the project files, runs commands and edits code inside that directory.",
          },
        ],
      },
      {
        heading: "03. Another terminal for Codex",
        blocks: [
          {
            type: "code",
            label: "terminal 2",
            code: `cd ~/Documents/FRT-CEREBRO

codex`,
          },
          {
            type: "paragraph",
            text: "Same directory, second agent. The project now has two pairs of eyes, and this is where splitting responsibilities starts to pay off.",
          },
          {
            type: "diagram",
            ascii: `FRT-CEREBRO
    │
    ├── Claude Code
    │
    └── Codex`,
          },
        ],
      },
      {
        heading: "The trick: split the responsibilities",
        blocks: [
          {
            type: "paragraph",
            text: "Two agents doing the same thing is waste. The gain shows up when each one has a clear role in the cycle.",
          },
          {
            type: "cards",
            items: [
              {
                title: "Claude Code",
                text: "Larger implementation, exploring the project, refactors, building features and long debugging sessions.",
              },
              {
                title: "Codex",
                text: "A second opinion, reviewing what was built, hunting for problems, small implementations and validating the first agent's decisions.",
              },
            ],
          },
          {
            type: "diagram",
            ascii: `             FEATURE
                │
                ▼
        ┌──────────────┐
        │ Claude Code  │
        │  implements  │
        └──────┬───────┘
               │
               ▼
              Code
               │
               ▼
        ┌──────────────┐
        │    Codex     │
        │   reviews    │
        └──────┬───────┘
               │
               ▼
          Final fixes`,
          },
          {
            type: "paragraph",
            text: "Whoever reviews is not whoever wrote it. That holds for people and for agents: the second model arrives without attachment to the first one's decisions and questions what the other called done.",
          },
        ],
      },
      {
        heading: "The rule that prevents chaos",
        blocks: [
          {
            type: "quote",
            text: "I never let two agents touch the same piece of code at the same time.",
          },
          {
            type: "paragraph",
            text: "Without that rule, the environment becomes a problem instead of an advantage:",
          },
          {
            type: "list",
            items: [
              "overwritten files, with one agent erasing the other's work;",
              "conflicting decisions inside the same feature;",
              "changes that are hard to review, because nobody knows where they came from;",
              "diverging context: each agent believing in a different version of the project.",
            ],
          },
          {
            type: "paragraph",
            text: "In practice only two arrangements are safe — in series, or on different files.",
          },
          {
            type: "diagram",
            ascii: `IN SERIES                   IN PARALLEL

Claude → implementation     Claude → feature A
           ↓                Codex  → feature B
         done                         ↓
           ↓                   different files
Codex  → review                       ↓
           ↓                     no collision
         fixes
           ↓
       git commit`,
          },
        ],
      },
      {
        heading: "Git stays at the centre",
        blocks: [
          {
            type: "paragraph",
            text: "None of this turns into a magic, uncontrolled environment. Everything the agents do lands in the working tree, and the working tree is still mine.",
          },
          {
            type: "diagram",
            ascii: `Claude ──┐
         │
Codex  ──┼──→ working tree ──→ git diff ──→ commit
         │
Me ──────┘`,
          },
          {
            type: "code",
            label: "the usual",
            code: `git status
git diff
git add .
git commit -m "feat: ..."`,
          },
          {
            type: "paragraph",
            text: "Manual review still happens, in the terminal or in VS Code itself. The AI executes; I still answer for the code that enters the repository.",
          },
        ],
      },
      {
        heading: "The running app is part of the environment too",
        blocks: [
          {
            type: "visual",
            name: "workspace",
            caption:
              "Each window has one responsibility, but they all belong to the same flow.",
          },
          {
            type: "list",
            items: [
              "① The app running on localhost",
              "② Claude Code, implementing",
              "③ Codex, reviewing",
              "④ The project and its files",
              "⑤ Obsidian, the context",
            ],
          },
          {
            type: "paragraph",
            text: "With the app open next to the agents, the loop closes without leaving the environment: the agent changes the code, the server reloads, I look at the screen and say what is still wrong.",
          },
          {
            type: "diagram",
            ascii: `        Claude / Codex
              │
              ▼
             code
              │
              ▼
         npm run dev
              │
              ▼
          localhost
              │
              ▼
       visual check
              │
              ▼
         next tweak`,
          },
        ],
      },
      {
        heading: "The problem with AI without memory",
        blocks: [
          {
            type: "paragraph",
            text: "Models are very good at executing tasks, but they always hit the same wall: context. An agent can know a project deeply during one session and, in the next conversation, have to rebuild almost all of it from scratch.",
          },
          {
            type: "paragraph",
            text: "The answer is not a longer prompt. It is moving the knowledge out of the conversations and into a place that outlives them.",
          },
          {
            type: "diagram",
            ascii: `                 OBSIDIAN
                    │
                knowledge
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Claude Code            Codex
          │                   │
          └─────────┬─────────┘
                    ▼
                 Project`,
          },
        ],
      },
      {
        heading: "Obsidian as a second brain",
        blocks: [
          {
            type: "visual",
            name: "vault",
            caption:
              "Projects, clients, decisions, references and lessons live outside the agents' conversations.",
          },
          {
            type: "paragraph",
            text: "To an agent this is not “an Obsidian”. It is Markdown files in a directory — exactly the kind of thing it already knows how to read. Obsidian is the comfortable interface for me; the content is plain text, versionable and readable by any tool.",
          },
        ],
      },
      {
        heading: "AGENTS.md: the first thing an agent reads",
        blocks: [
          {
            type: "paragraph",
            text: "One file at the root holds what every agent needs to know before writing a single line: stack, rules, architecture and conventions.",
          },
          {
            type: "code",
            label: "AGENTS.md",
            code: `# AGENTS.md

## Stack
- Next.js
- TypeScript
- Tailwind
- Supabase

## Rules
- Never change migrations without approval.
- Always check responsiveness.
- Run the tests before finishing.
- Do not deploy automatically.

## Architecture
src/
  components/
  services/
  hooks/
  pages/

## Conventions
- Components in PascalCase
- Functions in camelCase
- Commits in Conventional Commits`,
          },
          {
            type: "paragraph",
            text: "Notice that half the file is prohibitions. That is what prevents the kind of initiative nobody asked for — dropping a migration, pushing to production, rewriting what was already decided.",
          },
        ],
      },
      {
        heading: "One note per project",
        blocks: [
          {
            type: "paragraph",
            text: "Beyond the general rules, each project has its own note, with the current state and what is still open.",
          },
          {
            type: "code",
            label: "projects/villas-flow.md",
            code: `# Villas Flow

## Stack
Next.js + Supabase + Vercel

## Goal
Internal management system.

## Database
Supabase

## Decisions
- authentication via Supabase Auth
- deploy via Vercel

## Open items
- review the dashboard
- fix mobile
- improve loading`,
          },
          {
            type: "paragraph",
            text: "With that, opening a new session stops being a whole explanation and becomes one sentence: read the project note before you start.",
          },
          {
            type: "diagram",
            ascii: `NO EXTERNAL CONTEXT          WITH THE BRAIN

new conversation             new conversation
      ↓                            ↓
"explain this                read AGENTS.md
 project"                          ↓
      ↓                      read projects/*.md
the agent explores                 ↓
everything again             read the decisions
      ↓                            ↓
minutes spent                understands the setup
getting back                       ↓
to where we were             starts working`,
          },
        ],
      },
      {
        heading: "The whole flow",
        blocks: [
          {
            type: "diagram",
            ascii: `                        ME
                         │
                         ▼
                    ENVIRONMENT
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
   Project A         Project B         Project C
       │
       ├───────────────┐
       ▼               ▼
 Claude Code         Codex
 implementation      review
       │               │
       └───────┬───────┘
               ▼
              Code
               │
               ▼
              Git
               │
               ▼
         local app
               ▲
               │
       ┌───────┴────────┐
       ▼                ▼
   AGENTS.md        OBSIDIAN
                        │
                    knowledge
                        │
              projects / clients /
              decisions / references`,
            caption: "The whole environment in a single drawing.",
          },
        ],
      },
      {
        heading: "It is not about having more agents",
        blocks: [
          {
            type: "paragraph",
            text: "The goal was never to open more windows. It is to build a working architecture where every tool has a clear responsibility — and where the last word is still human.",
          },
          {
            type: "cards",
            items: [
              {
                title: "Context",
                text: "Obsidian and the documentation keep knowledge alive between one session and the next.",
              },
              {
                title: "Execution",
                text: "Claude Code or Codex implement the task inside the project directory.",
              },
              {
                title: "Review",
                text: "A second agent questions the first one's implementation before any commit.",
              },
              {
                title: "Control",
                text: "Git and manual review remain the final source of truth about what enters the code.",
              },
            ],
          },
        ],
      },
      {
        heading: "In short",
        blocks: [
          {
            type: "paragraph",
            text: "Technology is not only about writing code. A good development environment reduces lost context, improves review and lets AI be a real part of the engineering process — not a shortcut for asking someone else to write the code.",
          },
          {
            type: "paragraph",
            text: "This is one of the workflows I use on the projects I build at MF Services. The environment changes as the tools change; the split between context, execution, review and control is what stays.",
          },
        ],
      },
    ],
  },
  {
    id: 1,
    slug: "deploy-moderno-fullstack",
    title: "Modern fullstack deployment: from development to production",
    excerpt:
      "A practical look at hosting, CI/CD, databases, environments and monitoring for modern applications.",
    date: "2026-05-07",
    readTime: "8 min read",
    tags: ["Deploy", "Fullstack", "CI/CD"],
    cover: "bg-gradient-to-br from-[#0C2AFE] via-[#1B3BFF] to-[#020A2E]",
    lead: "Shipping an application is no longer a final, isolated step. Today, deployment is a continuous process that starts at the first commit and follows the product through its whole life. This guide gathers the practical decisions that get a fullstack application to production in a stable, fast and maintainable way.",
    sections: [
      {
        heading: "From code to environment",
        blocks: [
          {
            type: "paragraph",
            text: "Before thinking about servers, it's worth clearly separating the environments the application will run in. Each one has its own role and prevents a change from breaking something that already worked.",
          },
          {
            type: "list",
            items: [
              "Development: where code is born, with test data and fast reloads.",
              "Staging: a faithful copy of production to validate before publishing.",
              "Production: the real environment, serving users and demanding maximum stability.",
            ],
          },
          {
            type: "paragraph",
            text: "Keeping these environments similar reduces surprises. Environment variables, runtime versions and dependencies should be the same across all of them, changing only credentials and data.",
          },
        ],
      },
      {
        heading: "CI/CD: automating the path to production",
        blocks: [
          {
            type: "paragraph",
            text: "Continuous integration and delivery turn deployment into a predictable routine. On every push, a pipeline runs the tests, builds the app and publishes it without manual intervention.",
          },
          {
            type: "list",
            items: [
              "Build: compiles the frontend and packages the backend reproducibly.",
              "Tests: ensure changes don't break what already works.",
              "Automatic deploy: publishes to staging on every merge and to production on every release.",
            ],
          },
          {
            type: "paragraph",
            text: "The gain isn't just speed. A well-built pipeline documents how the application is built and published, making the process independent of whoever is at the keyboard.",
          },
        ],
      },
      {
        heading: "Databases and migrations",
        blocks: [
          {
            type: "paragraph",
            text: "The database is the most delicate part of any deployment, because it holds the product's real state. Schema changes need to be versioned and applied in a controlled way, with migrations that can be rolled back if something goes wrong.",
          },
          {
            type: "paragraph",
            text: "Automatic backups and restore tests are as important as the deployment itself. Publishing fast is useless if a mistake can compromise data that has no copy.",
          },
        ],
      },
      {
        heading: "Observability and monitoring",
        blocks: [
          {
            type: "paragraph",
            text: "Once the application is live, the work continues. Structured logs, usage metrics and alerts let you see problems before users notice them.",
          },
          {
            type: "list",
            items: [
              "Logs: record what happened and help investigate incidents.",
              "Metrics: show performance, resource usage and response times.",
              "Alerts: notify the team when something goes off track.",
            ],
          },
        ],
      },
      {
        heading: "In short",
        blocks: [
          {
            type: "paragraph",
            text: "Modern deployment is less about a specific tool and more about discipline: consistent environments, reliable automation, care with data and continuous visibility. With these pieces in place, publishing stops being a moment of tension and becomes just another natural step of development.",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    slug: "ia-mudando-criacao-de-software",
    title: "How AI is changing the way software is built",
    excerpt:
      "Understand how artificial intelligence is helping developers build systems faster, automate tasks and improve everyday applications.",
    date: "2026-05-07",
    readTime: "6 min read",
    tags: ["AI", "Productivity", "Software"],
    cover: "bg-gradient-to-br from-[#0B1020] via-[#101A3A] to-[#0C2AFE]",
    lead: "Artificial intelligence stopped being a distant promise and became part of the daily life of anyone who builds software. More than writing code, it is changing how we think, test and ship digital products. It's worth understanding what really changes and what remains a human responsibility.",
    sections: [
      {
        heading: "A new development flow",
        blocks: [
          {
            type: "paragraph",
            text: "The classic write-test-review cycle still exists, but it gained a copilot. AI suggests code snippets, explains unfamiliar functions and helps navigate large codebases in seconds. Developers spend more time deciding what to build and less time stuck on repetitive details.",
          },
        ],
      },
      {
        heading: "Where AI really speeds things up",
        blocks: [
          {
            type: "paragraph",
            text: "The most consistent gains show up in tasks that consume time without demanding big architectural decisions.",
          },
          {
            type: "list",
            items: [
              "Generating repetitive code, tests and documentation from examples.",
              "Turning a natural-language intent into a first working version.",
              "Finding bugs and suggesting fixes from error messages.",
              "Refactoring and modernizing legacy code more safely.",
            ],
          },
        ],
      },
      {
        heading: "The developer's role",
        blocks: [
          {
            type: "paragraph",
            text: "AI is fast, but it doesn't understand business context or the consequences of a decision. It's up to the developer to define requirements, weigh trade-offs, ensure security and review everything that's generated. The tool amplifies those who already know what they're doing; it doesn't replace judgment.",
          },
        ],
      },
      {
        heading: "Cautions and limits",
        blocks: [
          {
            type: "paragraph",
            text: "Blindly trusting what AI produces is a risk. Generated code can contain subtle bugs, repeat bad practices or expose sensitive data. The healthy path is to treat AI as a qualified suggestion, always validated by tests and human review.",
          },
        ],
      },
      {
        heading: "Where this is heading",
        blocks: [
          {
            type: "paragraph",
            text: "The trend isn't AI writing software on its own, but each developer producing more, with higher quality. Those who learn to collaborate with these tools today build better products, faster, and free up time for what really matters: solving people's real problems.",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    slug: "dashboards-meta-graph-api",
    title: "Dashboards with the Meta Graph API: from data to KPI",
    excerpt:
      "How to structure the collection and processing of Facebook and Instagram metrics for near real-time visualization.",
    date: "2025-10-12",
    readTime: "7 min read",
    tags: ["Data", "APIs", "Dashboard"],
    cover: "bg-gradient-to-br from-[#5B7CFF] via-[#2C50FF] to-[#0A1B66]",
    lead: "Social media metrics only become decisions when they are organized, processed and presented clearly. The Meta Graph API gives access to Facebook and Instagram data, but turning those numbers into a useful panel takes more than a simple request. This is the path from raw data to a KPI that helps you decide.",
    sections: [
      {
        heading: "Data collection",
        blocks: [
          {
            type: "paragraph",
            text: "Everything starts with the Meta Graph API integration. You need to handle authentication, token renewal and the request limits imposed by the platform. Collecting on a schedule, instead of on demand, avoids blowing through quotas and keeps history always available.",
          },
          {
            type: "list",
            items: [
              "Authentication with long-lived tokens and automatic renewal.",
              "Scheduled collection to respect API limits.",
              "Storing raw data before any transformation.",
            ],
          },
        ],
      },
      {
        heading: "Processing and modeling",
        blocks: [
          {
            type: "paragraph",
            text: "Data arriving from the API is rarely ready to use. It needs to be cleaned, standardized and organized into a model that makes sense for the business. Keeping history in a database like PostgreSQL allows comparing periods and calculating trends, instead of just showing the number of the moment.",
          },
        ],
      },
      {
        heading: "From data to KPI",
        blocks: [
          {
            type: "paragraph",
            text: "A KPI is a number with a purpose. Reach, engagement and follower growth only matter when tied to a goal. The calculation layer is where raw data becomes indicators: rates, averages, variations and comparisons that answer real questions.",
          },
          {
            type: "list",
            items: [
              "Define which questions the panel needs to answer.",
              "Turn absolute numbers into rates and comparisons.",
              "Highlight relevant variations instead of showing everything.",
            ],
          },
        ],
      },
      {
        heading: "Near real-time visualization",
        blocks: [
          {
            type: "paragraph",
            text: "With data processed and KPIs defined, the panel brings everything together in a clear interface. Near real-time updates — fed by scheduled collection — give the feeling of live tracking without overloading the API. The goal is for anyone to open the dashboard and understand the situation in seconds.",
          },
        ],
      },
      {
        heading: "In short",
        blocks: [
          {
            type: "paragraph",
            text: "Building a dashboard on top of the Meta Graph API is, above all, a data engineering job: collect carefully, process with criteria and present with focus. When these steps are done well, the panel stops being a pile of charts and becomes a decision-making tool.",
          },
        ],
      },
    ],
  },
];

const postsByLang: Record<Lang, Post[]> = { pt: postsPt, en: postsEn };

export function getPosts(lang: Lang) {
  return postsByLang[lang];
}

export function getPostBySlug(slug: string, lang: Lang) {
  return postsByLang[lang].find(post => post.slug === slug);
}
