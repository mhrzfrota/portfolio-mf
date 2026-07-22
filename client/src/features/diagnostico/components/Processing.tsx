import { useEffect, useRef, useState } from "react";
import {
  Check,
  ClipboardList,
  Compass,
  Globe,
  Loader2,
  MousePointerClick,
  RefreshCcw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { localRulesProvider } from "../engine";
import type {
  DiagnosticoInput,
  DiagnosticoProvider,
  DiagnosticoReport,
} from "../types";

const ETAPAS = [
  { Icon: Compass, label: "Analisando posicionamento" },
  { Icon: Globe, label: "Avaliando presença digital" },
  { Icon: MousePointerClick, label: "Identificando problemas de conversão" },
  { Icon: Zap, label: "Buscando oportunidades de automação" },
  { Icon: ClipboardList, label: "Criando plano de ação" },
];

/**
 * Tela de processamento: as etapas concluem em sequência enquanto o provider
 * roda em paralelo; o relatório só é entregue quando as duas coisas terminam.
 */
export default function Processing({
  input,
  onComplete,
  provider = localRulesProvider,
}: {
  input: DiagnosticoInput;
  onComplete: (report: DiagnosticoReport) => void;
  provider?: DiagnosticoProvider;
}) {
  const reduced = usePrefersReducedMotion();
  const [concluidas, setConcluidas] = useState(0);
  const [report, setReport] = useState<DiagnosticoReport | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const entregue = useRef(false);

  // Cronômetro das etapas visuais.
  useEffect(() => {
    setConcluidas(0);
    const stepMs = reduced ? 160 : 1050;
    const id = window.setInterval(() => {
      setConcluidas(atual => {
        if (atual >= ETAPAS.length) {
          window.clearInterval(id);
          return atual;
        }
        return atual + 1;
      });
    }, stepMs);
    return () => window.clearInterval(id);
  }, [reduced, tentativa]);

  // Análise real (regras locais hoje; API de IA amanhã).
  useEffect(() => {
    let cancelado = false;
    setErro(false);
    setReport(null);
    provider
      .analyze(input)
      .then(resultado => {
        if (!cancelado) setReport(resultado);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      });
    return () => {
      cancelado = true;
    };
  }, [input, provider, tentativa]);

  // Entrega quando as etapas visuais e a análise terminam.
  useEffect(() => {
    if (entregue.current || report === null || concluidas < ETAPAS.length) {
      return;
    }
    entregue.current = true;
    const id = window.setTimeout(() => onComplete(report), reduced ? 0 : 450);
    return () => window.clearTimeout(id);
  }, [report, concluidas, onComplete, reduced]);

  const progresso = Math.min(100, (concluidas / ETAPAS.length) * 100);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="diag-card-in rounded-2xl border border-border bg-card p-6 shadow-[0_18px_50px_rgba(13,30,80,0.08)] sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="diag-pulse h-2 w-2 rounded-full bg-[#0C2AFE] dark:bg-[#7C8CFF]" />
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            Analisando {input.empresa}
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#0C2AFE]/12 dark:bg-[#7C8CFF]/15">
          <div
            className="diag-bar h-full rounded-full bg-[#0C2AFE] dark:bg-[#7C8CFF]"
            style={{ width: `${progresso}%` }}
          />
        </div>

        <ul className="mt-6 space-y-1" aria-live="polite">
          {ETAPAS.map(({ Icon, label }, index) => {
            const feita = index < concluidas;
            const ativa = index === concluidas && !erro;
            return (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors duration-300",
                  ativa &&
                    "diag-scan-row bg-[#0C2AFE]/[0.04] dark:bg-[#7C8CFF]/[0.06]"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                    feita
                      ? "bg-[#0C2AFE] text-white dark:bg-[#7C8CFF] dark:text-[#05080f]"
                      : ativa
                        ? "bg-[#0C2AFE]/10 text-[#0C2AFE] dark:bg-[#7C8CFF]/15 dark:text-[#7C8CFF]"
                        : "bg-muted text-muted-foreground/50"
                  )}
                >
                  {feita ? (
                    <Check className="diag-pop h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>
                <span
                  className={cn(
                    "flex-1 text-[14px] transition-colors duration-300",
                    feita
                      ? "font-medium text-foreground"
                      : ativa
                        ? "font-medium text-foreground"
                        : "text-muted-foreground/60"
                  )}
                >
                  {label}
                </span>
                {ativa && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#0C2AFE] dark:text-[#7C8CFF]" />
                )}
              </li>
            );
          })}
        </ul>

        {erro && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-[13px] font-medium text-destructive">
              Não foi possível concluir a análise. Verifique a conexão e tente
              de novo.
            </p>
            <button
              type="button"
              onClick={() => {
                entregue.current = false;
                setTentativa(t => t + 1);
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
