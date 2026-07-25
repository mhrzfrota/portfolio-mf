import { useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  Car,
  Check,
  Sparkles,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OBJETIVOS, type DiagnosticoInput, type Objetivo } from "../types";
import { DEMO_LOJA_VEICULOS } from "../demo";

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[#0C2AFE] focus:ring-2 focus:ring-[#0C2AFE]/20 dark:focus:border-[#7C8CFF] dark:focus:ring-[#7C8CFF]/20";

const labelCls =
  "mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground";

const beneficios = [
  {
    Icon: BarChart3,
    titulo: "Análise em 5 pilares",
    texto: "Posicionamento, presença, conversão, autoridade e automação.",
  },
  {
    Icon: CalendarCheck,
    titulo: "Plano de ação de 7 dias",
    texto: "Prioridades práticas para a primeira semana de melhoria.",
  },
  {
    Icon: Timer,
    titulo: "Pronto em menos de 1 minuto",
    texto: "Preencha o briefing e receba o relatório na hora.",
  },
];

export default function Landing({
  onStart,
}: {
  onStart: (input: DiagnosticoInput) => void;
}) {
  const [empresa, setEmpresa] = useState("");
  const [segmento, setSegmento] = useState("");
  const [site, setSite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const valido =
    empresa.trim().length > 1 &&
    segmento.trim().length > 1 &&
    objetivo !== null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valido || !objetivo) {
      setTentouEnviar(true);
      return;
    }
    onStart({
      empresa: empresa.trim(),
      segmento: segmento.trim(),
      site: site.trim(),
      instagram: instagram.trim(),
      objetivo,
    });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-14">
      {/* Manchete + benefícios */}
      <div className="space-y-8">
        <div className="space-y-5">
          <span
            data-reveal
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[12px] font-semibold text-[#0C2AFE] dark:text-[#7C8CFF]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            MF Diagnóstico IA
          </span>

          <h1
            data-reveal
            className="text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-foreground"
          >
            Descubra o que está impedindo seu negócio de{" "}
            <em className="font-normal not-italic">
              <span className="hero-headline-area inline">vender mais</span>
            </em>{" "}
            no digital.
          </h1>

          <p
            data-reveal
            className="reveal-delay-1 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]"
          >
            Receba uma análise estratégica do posicionamento, presença digital,
            conversão e oportunidades de automação do seu negócio — com plano de
            ação pronto para aplicar.
          </p>
        </div>

        <ul data-reveal className="reveal-delay-2 space-y-4">
          {beneficios.map(({ Icon, titulo, texto }) => (
            <li key={titulo} className="flex items-start gap-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0C2AFE]/10 text-[#0C2AFE] dark:bg-[#7C8CFF]/15 dark:text-[#7C8CFF]">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-foreground">
                  {titulo}
                </p>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {texto}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div data-reveal className="reveal-delay-2">
          <button
            type="button"
            onClick={() => onStart(DEMO_LOJA_VEICULOS)}
            className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-[#0C2AFE] hover:text-[#0C2AFE] dark:hover:border-[#7C8CFF] dark:hover:text-[#7C8CFF]"
          >
            <Car className="h-4 w-4" />
            Ver demonstração com uma loja de veículos
          </button>
        </div>
      </div>

      {/* Briefing */}
      <form
        data-reveal
        className="reveal-delay-1 rounded-2xl border border-border bg-card p-6 shadow-[0_18px_50px_rgba(13,30,80,0.08)] sm:p-8"
        onSubmit={handleSubmit}
        noValidate
      >
        <h2 className="text-[18px] font-semibold text-foreground">
          Briefing do diagnóstico
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Quanto mais contexto, mais precisa fica a análise.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className={labelCls} htmlFor="diag-empresa">
              Nome da empresa *
            </label>
            <input
              id="diag-empresa"
              className={inputCls}
              value={empresa}
              onChange={e => setEmpresa(e.target.value)}
              placeholder="Ex.: Prime Motors Seminovos"
              autoComplete="organization"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="diag-segmento">
              Segmento *
            </label>
            <input
              id="diag-segmento"
              className={inputCls}
              value={segmento}
              onChange={e => setSegmento(e.target.value)}
              placeholder="Ex.: Loja de veículos seminovos"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="diag-site">
              Site
            </label>
            <input
              id="diag-site"
              className={inputCls}
              value={site}
              onChange={e => setSite(e.target.value)}
              placeholder="seusite.com.br (deixe em branco se não tiver)"
              inputMode="url"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="diag-instagram">
              Instagram ou descrição do perfil
            </label>
            <input
              id="diag-instagram"
              className={inputCls}
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="@suamarca ou descreva como é o perfil hoje"
            />
          </div>

          <fieldset>
            <legend className={labelCls}>Principal objetivo *</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {OBJETIVOS.map(item => {
                const ativo = objetivo === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    onClick={() => setObjetivo(item.id)}
                    className={cn(
                      "rounded-xl border px-3.5 py-3 text-left transition-all duration-200",
                      ativo
                        ? "border-[#0C2AFE] bg-[#0C2AFE]/[0.06] dark:border-[#7C8CFF] dark:bg-[#7C8CFF]/10"
                        : "border-border bg-background hover:border-[#0C2AFE]/50 dark:hover:border-[#7C8CFF]/50"
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-foreground">
                        {item.label}
                      </span>
                      {ativo && (
                        <Check className="diag-pop h-3.5 w-3.5 text-[#0C2AFE] dark:text-[#7C8CFF]" />
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {tentouEnviar && !valido && (
            <p
              className="text-[13px] font-medium text-destructive"
              role="alert"
            >
              Preencha o nome da empresa, o segmento e escolha um objetivo.
            </p>
          )}

          <button
            type="submit"
            className="pill-cta w-full justify-center"
          >
            <Sparkles className="h-4 w-4" />
            Gerar diagnóstico com IA
          </button>

          <p className="text-center text-[11.5px] text-muted-foreground">
            Gratuito · sem cadastro · resultado na hora
          </p>
        </div>
      </form>
    </div>
  );
}
