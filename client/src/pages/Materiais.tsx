import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  Film,
  Megaphone,
  Search,
  Wallet,
  X,
} from "lucide-react";

/**
 * Central de materiais da comunidade Atrium (pedido de 2026-11-20, referência
 * central.felipetambara.com): grade de skills e, ao abrir uma, o passo a passo
 * em blocos numerados (a ideia, instalar, como usar). Página pública, visual
 * claro e neutro com o azul da MF Services só nos detalhes. Cada skill tem
 * endereço próprio (/materiais/<slug>) para mandar direto no grupo.
 */

const AZUL = "#0C2AFE";

type AreaId = "financas" | "marketing" | "video" | "dev";

const AREAS: Record<AreaId, { nome: string; icone: ReactNode }> = {
  financas: { nome: "Finanças", icone: <Wallet className="h-4 w-4" /> },
  marketing: { nome: "Marketing", icone: <Megaphone className="h-4 w-4" /> },
  video: { nome: "Edição de vídeo", icone: <Film className="h-4 w-4" /> },
  dev: { nome: "Desenvolvimento", icone: <Code2 className="h-4 w-4" /> },
};

type Passo = { quem: "Você" | "Skill"; texto: string };

type Skill = {
  slug: string;
  nome: string;
  area: AreaId;
  titulo: string;
  resumo: string;
  ideia: string;
  passos: Passo[];
  funcionaEm: string;
  repo: string;
  comando: { rotulo: string; codigo: string; nota?: string };
  pedidos: string[];
};

const SKILLS: Skill[] = [
  {
    slug: "xlsx",
    nome: "xlsx",
    area: "financas",
    titulo: "Planilhas de verdade feitas pela IA",
    resumo:
      "Fluxo de caixa, controle de gastos e relatórios em Excel, com fórmulas que funcionam.",
    ideia:
      "Pedir planilha para a IA costuma dar uma tabela solta no chat. Com essa skill, da própria Anthropic, o Claude entrega um arquivo .xlsx de verdade: abas, fórmulas, formatação e gráfico. Também lê e arruma planilhas que você já tem.",
    passos: [
      { quem: "Você", texto: "Descreve a planilha ou manda o arquivo que já tem." },
      { quem: "Skill", texto: "Monta as abas, as fórmulas e a formatação." },
      { quem: "Skill", texto: "Confere se as fórmulas calculam sem erro." },
      { quem: "Você", texto: "Abre no Excel ou no Google Planilhas e usa." },
    ],
    funcionaEm: "Claude Code e Codex. Excel, Google Planilhas e Numbers abrem o arquivo.",
    repo: "https://github.com/anthropics/skills",
    comando: {
      rotulo: "Terminal: instala para todos os projetos",
      codigo: "npx skills add anthropics/skills -g -s xlsx",
    },
    pedidos: [
      "Cria uma planilha de fluxo de caixa mensal com entradas, saídas e saldo acumulado.",
      "Lê a planilha gastos.xlsx e me mostra onde estou gastando mais.",
    ],
  },
  {
    slug: "pricing",
    nome: "pricing",
    area: "financas",
    titulo: "Quanto cobrar pelo seu serviço",
    resumo:
      "Define preço, monta pacotes e mostra como apresentar o valor sem parecer caro.",
    ideia:
      "A maioria cobra pelo que o concorrente cobra ou pelo que acha justo. A skill faz a IA pensar como consultor de preço: valor percebido, pacotes em níveis, âncora e o que entra em cada faixa.",
    passos: [
      { quem: "Você", texto: "Conta o que vende, para quem e quanto cobra hoje." },
      { quem: "Skill", texto: "Faz as perguntas que faltam sobre custo e cliente." },
      { quem: "Skill", texto: "Propõe pacotes, preços e como apresentar." },
      { quem: "Você", texto: "Escolhe e testa com os próximos clientes." },
    ],
    funcionaEm: "Claude Code e Codex. Serve para serviço, produto digital e assinatura.",
    repo: "https://github.com/coreyhaines31/marketingskills",
    comando: {
      rotulo: "Terminal: instala para todos os projetos",
      codigo: "npx skills add coreyhaines31/marketingskills -g -s pricing",
    },
    pedidos: [
      "Me ajuda a montar 3 pacotes de preço para o meu serviço de social media.",
      "Estou cobrando R$ 500 por site. Isso faz sentido? Como subir sem perder cliente?",
    ],
  },
  {
    slug: "copywriting",
    nome: "copywriting",
    area: "marketing",
    titulo: "Texto que vende, sem cara de IA",
    resumo:
      "Site, landing page e anúncio com texto persuasivo e natural.",
    ideia:
      "Texto de IA se denuncia: frases de efeito vazias, listas de três e o famoso \"não é X, é Y\". A skill dá ao Claude o método de um copywriter: entender o cliente, achar a dor certa e escrever direto, cortando os vícios de IA.",
    passos: [
      { quem: "Você", texto: "Diz o que vende, para quem e onde o texto vai." },
      { quem: "Skill", texto: "Pergunta o que falta sobre o público e a oferta." },
      { quem: "Skill", texto: "Escreve título, subtítulo, seções e chamada." },
      { quem: "Você", texto: "Ajusta o tom e publica." },
    ],
    funcionaEm: "Claude Code e Codex. Site, landing page, anúncio, bio e e-mail.",
    repo: "https://github.com/coreyhaines31/marketingskills",
    comando: {
      rotulo: "Terminal: instala para todos os projetos",
      codigo: "npx skills add coreyhaines31/marketingskills -g -s copywriting",
    },
    pedidos: [
      "Escreve o texto da página inicial do meu site de estética.",
      "Esse texto está com cara de IA. Reescreve mais humano: [cola o texto]",
    ],
  },
  {
    slug: "traffic-masters",
    nome: "traffic-masters",
    area: "marketing",
    titulo: "Um time de tráfego pago dentro do Claude",
    resumo:
      "Especialistas em Meta Ads e Google Ads para montar e analisar campanhas.",
    ideia:
      "Em vez de uma resposta genérica sobre anúncio, a skill chama um time de especialistas em tráfego, cada um com seu método. Eles montam a estrutura da campanha, sugerem criativos e leem os números para dizer o que pausar e o que escalar.",
    passos: [
      { quem: "Você", texto: "Conta o objetivo, o orçamento e o público." },
      { quem: "Skill", texto: "Escolhe o especialista certo para o problema." },
      { quem: "Skill", texto: "Entrega a estrutura, os criativos e as métricas a olhar." },
      { quem: "Você", texto: "Sobe a campanha e volta com os números." },
    ],
    funcionaEm: "Claude Code e Codex. Meta Ads, Google Ads e YouTube Ads.",
    repo: "https://github.com/ohmyjahh/xquads-squads",
    comando: {
      rotulo: "Terminal: instala para todos os projetos",
      codigo: "npx skills add ohmyjahh/xquads-squads -g -s traffic-masters",
    },
    pedidos: [
      "Monta uma campanha no Meta com R$ 30 por dia para gerar mensagens no WhatsApp.",
      "Meu custo por lead subiu de R$ 8 para R$ 20. O que pode ser?",
    ],
  },
  {
    slug: "brag",
    nome: "brag",
    area: "video",
    titulo: "Seu projeto vira vídeo de lançamento",
    resumo:
      "Vídeo curto com música e animação, feito a partir do código do seu site.",
    ideia:
      "Mostrar o que você construiu dá trabalho: gravar tela, editar e pôr música. A skill lê o projeto direto da pasta, sem precisar de print nem de link no ar, e monta um vídeo curto pronto para postar, com a legenda junto.",
    passos: [
      { quem: "Você", texto: "Abre o Claude Code na pasta do projeto e digita /brag." },
      { quem: "Skill", texto: "Lê o código e escolhe o que mostrar." },
      { quem: "Skill", texto: "Monta o vídeo com movimento e música." },
      { quem: "Você", texto: "Confere e posta." },
    ],
    funcionaEm: "Claude Code. Funciona melhor com site ou app feito em código.",
    repo: "https://github.com/latent-spaces/brag",
    comando: {
      rotulo: "Terminal: instala para todos os projetos",
      codigo: "npx skills add latent-spaces/brag -g -s brag",
    },
    pedidos: [
      "/brag",
      "Faz um vídeo de 20 segundos mostrando a página inicial desse site.",
    ],
  },
  {
    slug: "adobe",
    nome: "Adobe for Creativity",
    area: "video",
    titulo: "Corte e redimensiona vídeos pela conversa",
    resumo:
      "Corte rápido, versão para cada rede social e edição de fotos com as ferramentas da Adobe.",
    ideia:
      "O plugin oficial da Adobe liga o Claude às ferramentas dela. Você pede em português e ele corta o vídeo, gera versões para Reels, Stories e feed, e trata fotos em lote, sem abrir editor nenhum.",
    passos: [
      { quem: "Você", texto: "Manda o vídeo ou a foto e diz o que quer." },
      { quem: "Skill", texto: "Usa as ferramentas da Adobe para editar." },
      { quem: "Skill", texto: "Gera as versões em cada formato." },
      { quem: "Você", texto: "Baixa e posta." },
    ],
    funcionaEm: "Claude Code. Na primeira vez ele pede para entrar com uma conta Adobe.",
    repo: "https://github.com/adobe/skills",
    comando: {
      rotulo: "Dentro do Claude Code",
      codigo: "/plugin install adobe-for-creativity@claude-plugins-official",
      nota: "Digite dentro do Claude, não no terminal. Depois abra uma sessão nova.",
    },
    pedidos: [
      "Corta esse vídeo para 30 segundos e faz uma versão vertical para Reels.",
      "Redimensiona essas 10 fotos para o feed e para o Stories.",
    ],
  },
  {
    slug: "impeccable",
    nome: "impeccable",
    area: "dev",
    titulo: "Site feito por IA com cara de design profissional",
    resumo:
      "Cria e revisa telas: espaçamento, tipografia, cor e detalhes de acabamento.",
    ideia:
      "Site feito por IA erra sempre do mesmo jeito: degradê roxo, tudo centralizado, espaçamento no chute. A skill dá ao Claude o olhar de designer para criar telas com direção visual e revisar as que já existem, item por item.",
    passos: [
      { quem: "Você", texto: "Aponta a página ou o projeto." },
      { quem: "Skill", texto: "Lista o que está com cara de IA e por quê." },
      { quem: "Skill", texto: "Corrige em etapas e confere no fim." },
      { quem: "Você", texto: "Aprova o resultado." },
    ],
    funcionaEm: "Claude Code e Codex. React, Next.js, Vue, Tailwind ou HTML e CSS.",
    repo: "https://github.com/pbakaus/impeccable",
    comando: {
      rotulo: "Terminal: instala para todos os projetos",
      codigo: "npx skills add pbakaus/impeccable -g -s impeccable",
    },
    pedidos: [
      "Revisa o design da página inicial e corrige o que estiver com cara de IA.",
      "Cria uma landing page para uma barbearia, minimalista e elegante.",
    ],
  },
  {
    slug: "superpowers",
    nome: "superpowers",
    area: "dev",
    titulo: "A IA planeja antes de programar",
    resumo:
      "Planejamento, testes e conferência antes de dizer que terminou.",
    ideia:
      "O erro mais caro da IA é sair programando sem entender o pedido e dizer \"pronto\" sem testar. O Superpowers dá ao Claude o processo de um dev sênior: perguntar, planejar, construir em partes e provar que funciona antes de entregar.",
    passos: [
      { quem: "Você", texto: "Descreve o que quer construir." },
      { quem: "Skill", texto: "Faz perguntas e escreve o plano." },
      { quem: "Skill", texto: "Constrói em partes, testando cada uma." },
      { quem: "Você", texto: "Recebe o trabalho já conferido." },
    ],
    funcionaEm: "Claude Code. Vale para qualquer linguagem e tipo de projeto.",
    repo: "https://github.com/obra/superpowers",
    comando: {
      rotulo: "Dentro do Claude Code",
      codigo: "/plugin install superpowers@claude-plugins-official",
      nota: "Digite dentro do Claude, não no terminal. Depois abra uma sessão nova.",
    },
    pedidos: [
      "Quero um sistema de agendamento para a minha clínica. Vamos planejar antes.",
      "Antes de dizer que terminou, testa e me mostra que funciona.",
    ],
  },
];

/* ---------- Peças pequenas ---------- */

function useCopiar() {
  const [copiado, setCopiado] = useState<string | null>(null);
  async function copiar(id: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      window.setTimeout(() => setCopiado(c => (c === id ? null : c)), 1800);
    } catch {
      // Sem permissão de área de transferência: o texto segue visível para copiar à mão.
    }
  }
  return { copiado, copiar };
}

function BotaoCopiar({
  id,
  texto,
  copiado,
  copiar,
}: {
  id: string;
  texto: string;
  copiado: string | null;
  copiar: (id: string, texto: string) => void;
}) {
  const ok = copiado === id;
  return (
    <button
      type="button"
      onClick={() => copiar(id, texto)}
      data-umami-event="materiais-copiar"
      data-umami-event-item={id}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#0C2AFE] px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-[#0a22d0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2AFE]"
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {ok ? "Copiado" : "Copiar"}
    </button>
  );
}

function BlocoCodigo({
  id,
  rotulo,
  codigo,
  copiado,
  copiar,
}: {
  id: string;
  rotulo: string;
  codigo: string;
  copiado: string | null;
  copiar: (id: string, texto: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#131313]/10 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#131313]/[0.07] px-4 py-2.5">
        <span className="mono-label text-[10.5px] text-[#0C2AFE]">{rotulo}</span>
        <BotaoCopiar id={id} texto={codigo} copiado={copiado} copiar={copiar} />
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-relaxed text-[#131313] whitespace-pre-wrap break-words">
        {codigo}
      </pre>
    </div>
  );
}

function Secao({
  numero,
  titulo,
  sub,
  children,
}: {
  numero: number;
  titulo: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#131313]/[0.08] bg-[#fafaf8] p-5 sm:p-7">
      <div className="flex items-start gap-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#0C2AFE] font-mono text-[15px] text-white">
          {numero}
        </span>
        <div>
          <h3 className="text-[19px] font-semibold leading-tight tracking-[-0.02em]">
            {titulo}
          </h3>
          <p className="mt-0.5 text-[13.5px] text-[#131313]/55">{sub}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/** Capa do card: sem foto, o nome da skill em grande no tom da área. */
function Capa({ skill }: { skill: Skill }) {
  const area = AREAS[skill.area];
  return (
    <div className="relative flex aspect-[16/10] flex-col justify-between overflow-hidden rounded-xl bg-[#eef0fb] p-4">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-[0.12] blur-2xl"
        style={{ background: AZUL }}
        aria-hidden="true"
      />
      <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11.5px] font-medium text-[#0C2AFE]">
        {area.icone}
        {area.nome}
      </span>
      <span className="relative font-mono text-[22px] leading-tight tracking-[-0.02em] text-[#131313] sm:text-[24px]">
        /{skill.slug}
      </span>
    </div>
  );
}

/* ---------- Detalhe (abre por cima da grade) ---------- */

function Detalhe({ skill, fechar }: { skill: Skill; fechar: () => void }) {
  const { copiado, copiar } = useCopiar();
  const pedidoInstalar = `Instala essa skill pra mim: ${skill.repo}`;

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", tecla);
    };
  }, [fechar]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#131313]/40 backdrop-blur-sm"
      onClick={fechar}
      role="dialog"
      aria-modal="true"
      aria-label={skill.titulo}
    >
      <div
        className="relative mx-auto my-0 min-h-dvh w-full max-w-[680px] bg-[#f6f6f4] px-4 pb-16 pt-6 sm:my-10 sm:min-h-0 sm:rounded-3xl sm:px-8 sm:pt-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={fechar}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#131313]/10 bg-white px-3.5 text-[13px] font-medium text-[#131313]/75 hover:text-[#131313] focus-visible:outline-2 focus-visible:outline-[#0C2AFE]"
          >
            <X className="h-4 w-4" /> Fechar
          </button>
        </div>

        <header className="mt-4 text-center">
          <p className="mono-label text-[11px] text-[#0C2AFE]">
            {AREAS[skill.area].nome} · /{skill.slug}
          </p>
          <h2 className="mx-auto mt-3 max-w-[20ch] text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.03em] [text-wrap:balance] sm:text-[2.3rem]">
            {skill.titulo}
          </h2>
          <div className="mx-auto mt-5 h-[3px] w-14 rounded-full bg-[#0C2AFE]" />
        </header>

        <div className="mt-8 space-y-4">
          <Secao numero={1} titulo="A ideia" sub="O que ela resolve">
            <p className="rounded-xl border-l-[3px] border-[#0C2AFE] bg-white px-4 py-3.5 text-[14.5px] leading-relaxed text-[#131313]/80">
              <strong className="text-[#131313]">Por que funciona: </strong>
              {skill.ideia}
            </p>
            <ol className="overflow-hidden rounded-xl border border-[#131313]/[0.08] bg-white">
              {skill.passos.map((p, i) => (
                <li
                  key={i}
                  className="flex gap-4 border-t border-[#131313]/[0.06] px-4 py-3 first:border-t-0"
                >
                  <span
                    className={`mono-label w-14 shrink-0 pt-0.5 text-[10.5px] ${
                      p.quem === "Skill" ? "text-[#0C2AFE]" : "text-[#131313]/60"
                    }`}
                  >
                    {p.quem}
                  </span>
                  <span className="text-[14px] leading-relaxed text-[#131313]/80">
                    {p.texto}
                  </span>
                </li>
              ))}
            </ol>
            <p className="rounded-xl bg-white px-4 py-3 text-[13.5px] leading-relaxed text-[#131313]/70">
              <strong className="text-[#131313]">Funciona em: </strong>
              {skill.funcionaEm}
            </p>
          </Secao>

          <Secao numero={2} titulo="Instalar" sub="Escolha um dos dois jeitos">
            <BlocoCodigo
              id={`${skill.slug}-pedido`}
              rotulo="Jeito fácil: cole no Claude"
              codigo={pedidoInstalar}
              copiado={copiado}
              copiar={copiar}
            />
            <BlocoCodigo
              id={`${skill.slug}-comando`}
              rotulo={skill.comando.rotulo}
              codigo={skill.comando.codigo}
              copiado={copiado}
              copiar={copiar}
            />
            <ul className="space-y-2.5 text-[14px] leading-relaxed text-[#131313]/75">
              {skill.comando.nota && (
                <li className="flex gap-3">
                  <span className="mono-label grid h-5 w-5 shrink-0 place-items-center rounded bg-white text-[10px] text-[#131313]/60">A</span>
                  {skill.comando.nota}
                </li>
              )}
              {!skill.comando.nota && (
                <li className="flex gap-3">
                  <span className="mono-label grid h-5 w-5 shrink-0 place-items-center rounded bg-white text-[10px] text-[#131313]/60">A</span>
                  O comando pede o Node instalado (nodejs.org). Se der erro, use o jeito fácil.
                </li>
              )}
              <li className="flex gap-3">
                <span className="mono-label grid h-5 w-5 shrink-0 place-items-center rounded bg-white text-[10px] text-[#131313]/60">B</span>
                Depois de instalar, abra uma sessão nova do Claude para ele enxergar a skill.
              </li>
            </ul>
          </Secao>

          <Secao numero={3} titulo="Usar" sub="Pedidos prontos para colar">
            {skill.pedidos.map((pedido, i) => (
              <BlocoCodigo
                key={i}
                id={`${skill.slug}-uso-${i}`}
                rotulo={`Exemplo ${i + 1}`}
                codigo={pedido}
                copiado={copiado}
                copiar={copiar}
              />
            ))}
            <a
              href={skill.repo}
              target="_blank"
              rel="noreferrer"
              data-umami-event="materiais-github"
              data-umami-event-skill={skill.slug}
              className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0C2AFE] hover:underline"
            >
              Ver o código no GitHub
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </Secao>
        </div>
      </div>
    </div>
  );
}

/* ---------- Página ---------- */

export default function Materiais() {
  const [, navegar] = useLocation();
  const [, params] = useRoute("/materiais/:slug?");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<AreaId | "todas">("todas");

  const aberta = SKILLS.find(s => s.slug === params?.slug);

  useEffect(() => {
    const anterior = document.title;
    document.title = aberta
      ? `${aberta.nome} · Materiais Atrium`
      : "Central de materiais · Atrium";
    return () => {
      document.title = anterior;
    };
  }, [aberta]);

  const lista = useMemo(() => {
    const q = busca
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    return SKILLS.filter(s => {
      if (filtro !== "todas" && s.area !== filtro) return false;
      if (!q) return true;
      const alvo = `${s.nome} ${s.titulo} ${s.resumo} ${AREAS[s.area].nome}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      return alvo.includes(q);
    });
  }, [busca, filtro]);

  const chips: { id: AreaId | "todas"; nome: string }[] = [
    { id: "todas", nome: "Todas" },
    ...(Object.keys(AREAS) as AreaId[]).map(id => ({ id, nome: AREAS[id].nome })),
  ];

  return (
    <div className="min-h-dvh bg-[#f6f6f4] font-sans text-[#131313]">
      <main className="mx-auto w-full max-w-[1080px] px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <header className="text-center">
          <p className="mono-label text-[11px] text-[#0C2AFE]">
            Matheus Frota · @emefeservices
          </p>
          <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1] tracking-[-0.04em] sm:text-[3.6rem]">
            Central de <span className="text-[#0C2AFE]">materiais</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[15.5px] leading-relaxed text-[#131313]/65">
            As skills que eu uso no dia a dia, num lugar só. Escolha uma e siga
            o passo a passo para instalar e usar.
          </p>
          <div className="mx-auto mt-6 h-[3px] w-14 rounded-full bg-[#0C2AFE]" />

          <label className="mx-auto mt-8 flex h-12 max-w-[440px] items-center gap-2.5 rounded-full border border-[#131313]/10 bg-white px-4 focus-within:border-[#0C2AFE]/50">
            <Search className="h-4 w-4 text-[#131313]/40" aria-hidden="true" />
            <input
              type="search"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar skill ou assunto..."
              className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-[#131313]/40"
            />
          </label>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {chips.map(c => {
              const ativo = filtro === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFiltro(c.id)}
                  className={`h-9 rounded-full px-4 text-[13.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2AFE] ${
                    ativo
                      ? "bg-[#131313] text-white"
                      : "border border-[#131313]/10 bg-white text-[#131313]/70 hover:text-[#131313]"
                  }`}
                >
                  {c.nome}
                </button>
              );
            })}
          </div>
        </header>

        {lista.length === 0 ? (
          <p className="mt-16 text-center text-[15px] text-[#131313]/55">
            Nada encontrado para "{busca}".
          </p>
        ) : (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map(skill => (
              <li key={skill.slug}>
                <a
                  href={`/materiais/${skill.slug}`}
                  onClick={e => {
                    e.preventDefault();
                    navegar(`/materiais/${skill.slug}`);
                  }}
                  data-umami-event="materiais-abrir"
                  data-umami-event-skill={skill.slug}
                  className="group flex h-full flex-col rounded-2xl border border-[#131313]/[0.07] bg-white p-3 transition-shadow hover:shadow-[0_14px_40px_rgba(12,42,254,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2AFE]"
                >
                  <Capa skill={skill} />
                  <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
                    <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.02em]">
                      {skill.titulo}
                    </h2>
                    <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-[#131313]/65">
                      {skill.resumo}
                    </p>
                    <span className="mono-label mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#0C2AFE]">
                      Ver passo a passo
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-20 border-t border-[#131313]/[0.08] pt-6 text-center text-[13px] text-[#131313]/50">
          Feito por{" "}
          <a href="/" className="font-medium text-[#131313]/75 hover:text-[#0C2AFE]">
            MF Services
          </a>
        </footer>
      </main>

      {aberta && <Detalhe skill={aberta} fechar={() => navegar("/materiais")} />}
    </div>
  );
}
