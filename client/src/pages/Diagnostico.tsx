import { useEffect, useState } from "react";
import { useRevealOnScroll } from "@/lib/useRevealOnScroll";
import type {
  DiagnosticoInput,
  DiagnosticoReport,
} from "@/features/diagnostico/types";
import Landing from "@/features/diagnostico/components/Landing";
import Processing from "@/features/diagnostico/components/Processing";
import Report from "@/features/diagnostico/components/Report";

type Etapa = "briefing" | "analise" | "relatorio";

/**
 * MF Diagnóstico IA — fluxo em três etapas na mesma rota:
 * briefing (landing + formulário) → análise (processamento) → relatório.
 */
export default function Diagnostico() {
  const [etapa, setEtapa] = useState<Etapa>("briefing");
  const [input, setInput] = useState<DiagnosticoInput | null>(null);
  const [report, setReport] = useState<DiagnosticoReport | null>(null);

  useRevealOnScroll([etapa]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [etapa]);

  useEffect(() => {
    document.title = "MF Diagnóstico IA — MF Services";
    return () => {
      document.title = "MF Services";
    };
  }, []);

  const iniciar = (dados: DiagnosticoInput) => {
    setInput(dados);
    setReport(null);
    setEtapa("analise");
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-28 sm:px-8 md:pt-32 lg:px-12">
      {etapa === "briefing" && <Landing onStart={iniciar} />}

      {etapa === "analise" && input && (
        <div className="flex min-h-[55vh] items-center py-8">
          <Processing
            input={input}
            onComplete={resultado => {
              setReport(resultado);
              setEtapa("relatorio");
            }}
          />
        </div>
      )}

      {etapa === "relatorio" && report && (
        <Report report={report} onRestart={() => setEtapa("briefing")} />
      )}
    </div>
  );
}
