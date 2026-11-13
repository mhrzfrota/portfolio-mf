import type { ReactNode } from "react";
import { AtSign, MessageCircle, MessagesSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conta, Gatilho, SituacaoEvento } from "@shared/automacoes/tipos";

export const GATILHOS: Record<Gatilho, { nome: string; frase: string; icone: LucideIcon; cor: string }> = {
  comentario: { nome: "Comentário", frase: "comenta numa publicação", icone: MessageCircle, cor: "#F59E0B" },
  direct: { nome: "Direct", frase: "manda um Direct", icone: MessagesSquare, cor: "#38BDF8" },
  story: { nome: "Story", frase: "responde um story", icone: AtSign, cor: "#E879F9" },
};

export const SITUACOES: Record<SituacaoEvento, { nome: string; classe: string }> = {
  enviado: { nome: "Enviado", classe: "bg-emerald-400/12 text-emerald-300 ring-emerald-400/25" },
  ignorado: { nome: "Sem automação", classe: "bg-white/[0.06] text-white/55 ring-white/10" },
  falhou: { nome: "Falhou", classe: "bg-rose-400/12 text-rose-300 ring-rose-400/25" },
  incerto: { nome: "Incerto", classe: "bg-amber-400/12 text-amber-300 ring-amber-400/25" },
};

export const painel = "rounded-2xl border border-white/[0.08] bg-[#121318]";
export const campo =
  "w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#4d63ff] focus:bg-white/[0.06]";
export const botao =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45";
export const primario = "border-[#0C2AFE] bg-[#0C2AFE] hover:bg-[#2440ff] shadow-[0_6px_24px_-8px_rgba(12,42,254,0.9)]";

/** Cor estável por conta, para o anel do avatar. */
const ANEIS = [
  "from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  "from-[#38BDF8] via-[#0C2AFE] to-[#7C3AED]",
  "from-[#34D399] via-[#10B981] to-[#0EA5E9]",
  "from-[#FBBF24] via-[#F97316] to-[#EF4444]",
  "from-[#F472B6] via-[#C026D3] to-[#6366F1]",
];
function anelDe(id: string) {
  let soma = 0;
  for (const letra of id) soma = (soma + letra.charCodeAt(0)) % 997;
  return ANEIS[soma % ANEIS.length];
}

export function Avatar({ conta, tamanho = 36, apagado }: { conta: Pick<Conta, "id" | "usuario" | "foto">; tamanho?: number; apagado?: boolean }) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-tr p-[2px]", anelDe(conta.id), apagado && "opacity-40 grayscale")}
      style={{ width: tamanho, height: tamanho }}
      title={`@${conta.usuario}`}
    >
      <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-[#121318] font-semibold uppercase text-white" style={{ fontSize: tamanho * 0.36 }}>
        {conta.foto ? <img src={conta.foto} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : conta.usuario.slice(0, 1)}
      </span>
    </span>
  );
}

export function Interruptor({ ligado, aoMudar, rotulo, desativado }: { ligado: boolean; aoMudar: (v: boolean) => void; rotulo: string; desativado?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      title={rotulo}
      disabled={desativado}
      onClick={(e) => { e.stopPropagation(); aoMudar(!ligado); }}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40",
        ligado ? "bg-emerald-500" : "bg-white/[0.16]",
      )}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] duration-200", ligado ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function SeloGatilho({ gatilho, compacto }: { gatilho: Gatilho; compacto?: boolean }) {
  const g = GATILHOS[gatilho];
  const Icone = g.icone;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium" style={{ background: `${g.cor}1F`, color: g.cor }}>
      <Icone size={13} strokeWidth={2.2} />
      {!compacto && g.nome}
    </span>
  );
}

export function Vazio({ icone: Icone, titulo, children }: { icone: LucideIcon; titulo: string; children?: ReactNode }) {
  return (
    <div className={cn(painel, "grid place-items-center px-6 py-14 text-center")}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.06] text-white/70"><Icone size={22} /></span>
      <p className="mt-4 text-[16px] font-semibold">{titulo}</p>
      {children && <div className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-white/55">{children}</div>}
    </div>
  );
}

export function quando(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const min = Math.round((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  if (min < 60 * 24) return `há ${Math.round(min / 60)} h`;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}
