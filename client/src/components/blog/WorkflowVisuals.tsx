import { cn } from "@/lib/utils";

/**
 * Os três desenhos do artigo de orquestração de agentes.
 *
 * São ilustrações, não capturas de tela: o ambiente muda de ferramenta a cada
 * mês e uma foto envelhece junto: o desenho fica valendo. Além disso ele
 * acompanha o tema claro/escuro, escala em qualquer largura e pesa alguns kB.
 * O movimento vive todo no CSS (`.wf-*` em index.css) e some inteiro em
 * `prefers-reduced-motion`.
 */

/** Numerador das janelas — o texto do artigo cita ① a ⑤. */
function Badge({ n }: { n: string }) {
  return (
    <span
      aria-hidden="true"
      className="wf-mono absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/12 text-[10px] text-primary"
    >
      {n}
    </span>
  );
}

/** Cabeçalho de janela: três bolinhas e um título em mono. */
function PaneHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/25" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/25" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/25" />
      <span className="wf-mono ml-1.5 truncate text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </span>
    </div>
  );
}

/** Linha de terminal do ciclo de 9s; o índice vira o atraso da entrada. */
function Line({
  children,
  step,
  tone = "muted",
  typed = false,
}: {
  children: string;
  step: number;
  tone?: "muted" | "accent" | "done";
  typed?: boolean;
}) {
  const delay = `${step * 0.45}s`;
  return (
    <div
      className={cn(
        "wf-line wf-mono truncate text-[10.5px] leading-[1.9] sm:text-[11.5px]",
        tone === "accent" && "text-primary",
        tone === "done" && "text-[color:var(--delta)]",
        tone === "muted" && "text-muted-foreground"
      )}
      style={{ animationDelay: delay }}
    >
      {typed ? (
        <span className="wf-type" style={{ animationDelay: delay }}>
          {children}
        </span>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * 1. O projeto como núcleo: um diretório, três formas de entrar nele.
 * SVG com viewBox para escalar do celular ao desktop sem quebrar o traço.
 */
export function OrchestrationVisual() {
  const nodes = [
    { x: 40, label: "terminal", caret: true },
    { x: 275, label: "claude code", caret: false },
    { x: 510, label: "codex", caret: false },
  ];

  return (
    <div className="wf-frame p-3 sm:p-5">
      <svg
        viewBox="0 0 720 420"
        role="img"
        aria-label="Um projeto no centro, com terminal, Claude Code e Codex ligados a ele e ao mesmo código-fonte."
        className="w-full"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {/* Conexões: uma linha parada por baixo, o traço correndo por cima. */}
        <g fill="none" strokeWidth="1.5">
          {[
            "M360 86 C 360 140, 125 132, 125 186",
            "M360 86 L 360 186",
            "M360 86 C 360 140, 595 132, 595 186",
            "M125 250 C 125 302, 360 292, 360 336",
            "M360 250 L 360 336",
            "M595 250 C 595 302, 360 292, 360 336",
          ].map((d, index) => (
            <g key={d}>
              <path d={d} stroke="var(--border)" />
              <path
                d={d}
                className="wf-flow"
                stroke="var(--primary)"
                strokeOpacity="0.55"
                style={{ animationDelay: `${index * 0.18}s` }}
              />
            </g>
          ))}
        </g>

        {/* Projeto */}
        <g>
          <rect
            x="250"
            y="22"
            width="220"
            height="64"
            rx="16"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeOpacity="0.5"
          />
          <text
            x="360"
            y="48"
            textAnchor="middle"
            fontSize="13"
            letterSpacing="1.6"
            fill="var(--primary)"
          >
            PROJETO
          </text>
          <text
            x="360"
            y="68"
            textAnchor="middle"
            fontSize="11"
            fill="var(--muted-foreground)"
          >
            ~/Documents/FRT-CEREBRO
          </text>
        </g>

        {/* Agentes */}
        {nodes.map((node, index) => (
          <g key={node.label}>
            <rect
              x={node.x}
              y="186"
              width="170"
              height="64"
              rx="16"
              fill="var(--background)"
              stroke="var(--border)"
            />
            <circle
              cx={node.x + 22}
              cy="218"
              r="3.5"
              fill="var(--primary)"
              className="wf-pulse"
              style={{ animationDelay: `${index * 1.4}s` }}
            />
            <text
              x={node.x + 38}
              y="222"
              fontSize="12.5"
              fill="var(--foreground)"
            >
              {node.label}
            </text>
            {node.caret && (
              <rect
                x={node.x + 122}
                y="212"
                width="7"
                height="13"
                fill="var(--foreground)"
                className="wf-caret"
              />
            )}
          </g>
        ))}

        {/* Código-fonte */}
        <g>
          <rect
            x="250"
            y="336"
            width="220"
            height="58"
            rx="16"
            fill="var(--background)"
            stroke="var(--border)"
          />
          <text
            x="360"
            y="371"
            textAnchor="middle"
            fontSize="12.5"
            fill="var(--foreground)"
          >
            os mesmos arquivos
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * 2. O ambiente inteiro: aplicação, os dois agentes, o projeto e o vault.
 * Cada janela recebe o número que o texto cita logo abaixo.
 */
export function WorkspaceVisual() {
  return (
    <div className="wf-frame">
      <PaneHead title="workspace" />

      <div className="grid gap-3 p-3 sm:grid-cols-2">
        {/* ① Aplicação */}
        <div className="wf-pane">
          <Badge n="①" />
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/25" />
            <span className="wf-mono truncate rounded-full bg-muted px-2 py-0.5 text-[9.5px] text-muted-foreground">
              localhost:5173
            </span>
          </div>
          {/* A barra só cruza a tela no instante do reload. */}
          <div className="h-0.5 overflow-hidden bg-transparent">
            <div className="wf-sweep h-full w-full bg-primary" />
          </div>
          <div className="space-y-2 p-3">
            <div className="h-2.5 w-1/2 rounded bg-primary/25" />
            <div className="h-1.5 w-full rounded bg-muted-foreground/15" />
            <div className="h-1.5 w-4/5 rounded bg-muted-foreground/15" />
            <div className="flex gap-2 pt-1.5">
              <div className="h-4 w-16 rounded-full bg-primary/25" />
              <div className="h-4 w-12 rounded-full bg-muted-foreground/12" />
            </div>
            {/* O miolo da página: entra depois do reload, um cartão por vez. */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {[0, 1, 2, 3].map(index => (
                <div
                  key={index}
                  className="wf-line space-y-1.5 rounded-lg border border-border p-2"
                  style={{ animationDelay: `${1.2 + index * 0.35}s` }}
                >
                  <div className="h-1.5 w-2/3 rounded bg-muted-foreground/20" />
                  <div className="h-1.5 w-full rounded bg-muted-foreground/12" />
                  <div className="h-1.5 w-1/2 rounded bg-muted-foreground/12" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ② e ③ Os dois agentes */}
        <div className="grid gap-3">
          <div className="wf-pane">
            <Badge n="②" />
            <PaneHead title="claude code" />
            <div className="px-3 py-2">
              <Line step={0} tone="accent" typed>
                {"> implementar o board"}
              </Line>
              <Line step={1}>● lendo AGENTS.md</Line>
              <Line step={2}>● editando Board.tsx</Line>
              <Line step={3} tone="done">
                ✓ feature no working tree
              </Line>
            </div>
          </div>

          <div className="wf-pane">
            <Badge n="③" />
            <PaneHead title="codex" />
            <div className="px-3 py-2">
              <Line step={5} tone="accent" typed>
                {"> revisar o diff"}
              </Line>
              <Line step={6}>● lendo git diff</Line>
              <Line step={7} tone="done">
                ✓ 2 ajustes sugeridos
              </Line>
            </div>
          </div>
        </div>

        {/* ④ Projeto */}
        <div className="wf-pane">
          <Badge n="④" />
          <PaneHead title="projeto" />
          <div className="wf-mono space-y-1 px-3 py-2.5 text-[10.5px] leading-relaxed text-muted-foreground">
            {["src/", "public/", "package.json", "AGENTS.md", ".git/"].map(
              file => (
                <div key={file} className="truncate">
                  {file}
                </div>
              )
            )}
          </div>
        </div>

        {/* ⑤ Obsidian */}
        <div className="wf-pane">
          <Badge n="⑤" />
          <PaneHead title="obsidian" />
          <div className="flex flex-wrap gap-1.5 px-3 py-3">
            {[
              "projetos",
              "clientes",
              "decisões",
              "referências",
              "reuniões",
              "conhecimento",
            ].map((folder, index) => (
              <span
                key={folder}
                className="wf-mono wf-line rounded-full border border-border px-2 py-1 text-[9.5px] text-muted-foreground"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                {folder}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. O vault alimentando os agentes: a leitura varrendo as pastas e chegando
 * nos dois terminais.
 */
export function VaultVisual() {
  const folders = [
    "arquivo",
    "clientes",
    "conhecimento",
    "conteudo",
    "deals",
    "diario",
    "empresas",
    "financas",
    "inbox",
    "pessoal",
    "pessoas",
    "projetos",
    "referencias",
    "reunioes",
  ];

  return (
    <div className="wf-frame">
      <PaneHead title="FRT-CEREBRO — vault" />

      <div className="grid items-center gap-4 p-4 sm:grid-cols-[1.35fr_1fr] sm:gap-6">
        {/* Lista de pastas com a faixa de leitura passando por cima. */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="wf-scan absolute inset-x-0 top-0 h-6 rounded-md bg-primary/12"
            style={{ ["--wf-scan-end" as string]: "calc(100% - 1.5rem)" }}
          />
          <div className="wf-mono relative grid grid-cols-2 gap-x-4 text-[10.5px] leading-6 text-muted-foreground sm:text-[11.5px]">
            {folders.map(folder => (
              <span key={folder} className="truncate">
                {folder}/
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Conexão: mesma linguagem de traço correndo do primeiro desenho. */}
          <svg
            viewBox="0 0 40 120"
            aria-hidden="true"
            className="h-24 w-8 shrink-0"
            fill="none"
          >
            <path
              d="M2 60 C 20 60, 20 22, 38 22 M2 60 C 20 60, 20 98, 38 98"
              stroke="var(--border)"
              strokeWidth="1.5"
            />
            <path
              d="M2 60 C 20 60, 20 22, 38 22 M2 60 C 20 60, 20 98, 38 98"
              className="wf-flow"
              stroke="var(--primary)"
              strokeOpacity="0.6"
              strokeWidth="1.5"
            />
          </svg>

          <div className="grid flex-1 gap-2.5">
            {["claude code", "codex"].map((agent, index) => (
              <div
                key={agent}
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <span
                  className="wf-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  style={{ animationDelay: `${index * 1.6}s` }}
                />
                <span className="wf-mono truncate text-[11px] text-foreground">
                  {agent}
                </span>
              </div>
            ))}
            <div className="wf-mono rounded-xl border border-dashed border-border px-3 py-2 text-[10px] text-muted-foreground">
              contexto que sobrevive à conversa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
