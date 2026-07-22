import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Lightbulb,
  MessageCircle,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { WHATSAPP_BUDGET_URL } from "@/const";
import RollButton from "@/components/RollButton";
import { OBJETIVOS, type DiagnosticoReport, type PilarScore } from "../types";
import Skeleton from "./Skeleton";
import ScoreRing from "./ScoreRing";

const WHATSAPP_BASE = "https://wa.me/5585996370080?text=";

function classificacao(nota: number): string {
  if (nota < 45) return "Base em construção";
  if (nota < 65) return "Bom potencial";
  return "Operação avançada";
}

const cardCls = "rounded-2xl border border-border bg-card p-6 sm:p-7";

function SectionTitle({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0C2AFE] dark:text-[#7C8CFF]">
        {children}
      </h2>
      {sub && <p className="mt-1 text-[13px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Barras horizontais dos 5 pilares — uma série, mesma rampa de azul. */
function PilarBars({ pilares }: { pilares: PilarScore[] }) {
  const [filled, setFilled] = useState(false);
  const menor = Math.min(...pilares.map(p => p.score));

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setFilled(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-5">
      {pilares.map(pilar => (
        <div key={pilar.id}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-2 text-[14px] font-medium text-foreground">
              {pilar.label}
              {pilar.score === menor && (
                <span className="rounded-full bg-[#0C2AFE]/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#0C2AFE] dark:bg-[#7C8CFF]/15 dark:text-[#7C8CFF]">
                  Prioridade
                </span>
              )}
            </span>
            <span className="text-[14px] font-semibold tabular-nums text-foreground">
              {pilar.score}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#0C2AFE]/12 dark:bg-[#7C8CFF]/15">
            <div
              className="diag-bar h-full rounded-r-full bg-[#0C2AFE] dark:bg-[#7C8CFF]"
              style={{ width: filled ? `${pilar.score}%` : "0%" }}
            />
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {pilar.resumo}
          </p>
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard indisponível (http/permissão): sem feedback, sem quebra.
    }
  };

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[12px] font-medium text-white/80 transition-colors hover:border-white/50 hover:text-white"
      aria-label={label}
    >
      {copiado ? (
        <Check className="diag-pop h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={cardCls}>
          <div className="flex flex-col items-center gap-4 py-6">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className={cn(cardCls, "space-y-6")}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn(cardCls, "space-y-3")}>
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Report({
  report,
  onRestart,
}: {
  report: DiagnosticoReport;
  onRestart: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [pronto, setPronto] = useState(reduced);

  // Skeleton curto: o relatório "monta" na frente do usuário.
  useEffect(() => {
    if (reduced) {
      setPronto(true);
      return;
    }
    const id = window.setTimeout(() => setPronto(true), 900);
    return () => window.clearTimeout(id);
  }, [reduced]);

  if (!pronto) return <ReportSkeleton />;

  const { input } = report;
  const objetivoLabel =
    OBJETIVOS.find(o => o.id === input.objetivo)?.label ?? input.objetivo;

  const propostaUrl = `${WHATSAPP_BASE}${encodeURIComponent(
    `Olá! Gerei o diagnóstico digital da ${input.empresa} (nota ${report.notaGeral}/100) no MF Diagnóstico IA e quero uma proposta para implementar as melhorias.`
  )}`;

  let delayIndex = 0;
  const entrada = () => ({
    animationDelay: `${Math.min(delayIndex++ * 80, 560)}ms`,
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho do relatório */}
      <div className="diag-card-in space-y-4" style={entrada()}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[12px] font-semibold text-[#0C2AFE] dark:text-[#7C8CFF]">
            <Bot className="h-3.5 w-3.5" />
            Relatório gerado — IA + regras de mercado
          </span>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-[#0C2AFE] hover:text-[#0C2AFE] dark:hover:border-[#7C8CFF] dark:hover:text-[#7C8CFF]"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refazer diagnóstico
          </button>
        </div>
        <div>
          <h1 className="text-[clamp(1.6rem,4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            {input.empresa}
          </h1>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-3 py-1 text-[12px] font-medium text-muted-foreground">
              {input.segmento}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-[12px] font-medium text-muted-foreground">
              Objetivo: {objetivoLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Nota geral + pilares */}
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div
          className={cn(
            cardCls,
            "diag-card-in flex items-center justify-center"
          )}
          style={entrada()}
        >
          <ScoreRing
            value={report.notaGeral}
            caption={classificacao(report.notaGeral)}
          />
        </div>
        <div className={cn(cardCls, "diag-card-in")} style={entrada()}>
          <SectionTitle>Pontuação por pilar</SectionTitle>
          <PilarBars pilares={report.pilares} />
        </div>
      </div>

      {/* Problemas + oportunidades */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className={cn(cardCls, "diag-card-in")} style={entrada()}>
          <SectionTitle>Principais problemas</SectionTitle>
          <ul className="space-y-4">
            {report.problemas.map(problema => (
              <li key={problema.titulo} className="flex items-start gap-3">
                <AlertTriangle
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    problema.severidade === "critico"
                      ? "text-destructive"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                />
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-foreground">
                    {problema.titulo}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
                        problema.severidade === "critico"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {problema.severidade === "critico"
                        ? "Crítico"
                        : "Atenção"}
                    </span>
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {problema.detalhe}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn(cardCls, "diag-card-in")} style={entrada()}>
          <SectionTitle>Oportunidades encontradas</SectionTitle>
          <ul className="space-y-4">
            {report.oportunidades.map(oportunidade => (
              <li key={oportunidade.titulo} className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#0C2AFE] dark:text-[#7C8CFF]" />
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {oportunidade.titulo}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {oportunidade.detalhe}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recomendações prioritárias */}
      <div className={cn(cardCls, "diag-card-in")} style={entrada()}>
        <SectionTitle sub="Em ordem de impacto: comece pela primeira.">
          Recomendações prioritárias
        </SectionTitle>
        <ol className="grid gap-4 md:grid-cols-2">
          {report.recomendacoes.map((recomendacao, index) => (
            <li
              key={recomendacao.titulo}
              className="flex items-start gap-3.5 rounded-xl border border-border bg-background p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-ink)] text-[12px] font-semibold text-white dark:bg-white dark:text-[var(--brand-ink)]">
                {index + 1}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-foreground">
                  {recomendacao.titulo}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {recomendacao.detalhe}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Proposta de valor + headline (voz editorial) */}
      <div
        className="diag-card-in rounded-2xl bg-[var(--brand-ink)] p-6 text-white sm:p-8"
        style={entrada()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-white/60">
            Nova proposta de valor
          </h2>
          <CopyButton
            text={report.propostaDeValor}
            label="Copiar proposta de valor"
          />
        </div>
        <p className="mt-3 font-['Instrument_Serif',Georgia,serif] text-[clamp(1.25rem,2.6vw,1.7rem)] italic leading-snug text-white">
          {report.propostaDeValor}
        </p>

        <div className="mt-7 border-t border-white/10 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-white/60">
              Headline sugerida para o site
            </h2>
            <CopyButton text={report.headline} label="Copiar headline" />
          </div>
          <p className="mt-3 text-[15px] font-semibold leading-relaxed text-white">
            “{report.headline}”
          </p>
        </div>
      </div>

      {/* Conteúdo + automações */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className={cn(cardCls, "diag-card-in")} style={entrada()}>
          <SectionTitle>Ideias de conteúdo</SectionTitle>
          <ul className="space-y-3">
            {report.ideiasDeConteudo.map(ideia => (
              <li key={ideia} className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#0C2AFE] dark:text-[#7C8CFF]" />
                <span className="text-[13.5px] leading-relaxed text-muted-foreground">
                  {ideia}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn(cardCls, "diag-card-in")} style={entrada()}>
          <SectionTitle>Automações recomendadas</SectionTitle>
          <ul className="space-y-4">
            {report.automacoes.map(automacao => (
              <li key={automacao.titulo} className="flex items-start gap-3">
                <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#0C2AFE] dark:text-[#7C8CFF]" />
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {automacao.titulo}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {automacao.detalhe}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Plano de 7 dias */}
      <div className={cn(cardCls, "diag-card-in")} style={entrada()}>
        <SectionTitle sub="Uma frente por dia — no ritmo de quem toca o negócio.">
          Plano de ação de 7 dias
        </SectionTitle>
        <ol className="space-y-0">
          {report.plano7Dias.map((dia, index) => (
            <li key={dia.dia} className="relative flex gap-4 pb-6 last:pb-0">
              {index < report.plano7Dias.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[17px] top-9 bottom-0 w-px bg-border"
                />
              )}
              <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#0C2AFE]/30 bg-card text-[12px] font-semibold text-[#0C2AFE] dark:border-[#7C8CFF]/40 dark:text-[#7C8CFF]">
                D{dia.dia}
              </span>
              <div className="pt-1">
                <p className="text-[14px] font-semibold text-foreground">
                  {dia.foco}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {dia.acoes.map(acao => (
                    <li
                      key={acao}
                      className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground"
                    >
                      <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#0C2AFE]/60 dark:text-[#7C8CFF]/60" />
                      {acao}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Conversão */}
      <div
        className="diag-card-in rounded-2xl bg-[var(--brand-ink)] p-7 text-white sm:p-10"
        style={entrada()}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-tight">
            Quer implementar essas melhorias no seu negócio?
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-white/70">
            Eu transformo este diagnóstico em execução: site, automações e
            presença digital feitos sob medida para a {input.empresa}.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <RollButton
              variant="white"
              size="md"
              label="Solicitar proposta"
              href={propostaUrl}
              external
            />
            <a
              href={WHATSAPP_BUDGET_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:border-white hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" />
              Falar pelo WhatsApp
            </a>
          </div>
        </div>
      </div>

      <p className="pb-2 text-center text-[12px] text-muted-foreground">
        Demonstração com dados simulados e regras locais — arquitetura pronta
        para conectar uma API de inteligência artificial.
      </p>
    </div>
  );
}
