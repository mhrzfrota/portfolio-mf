import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, LoaderCircle, Search, Zap, Telescope } from "lucide-react";
import { LIMITES_BUSCA, type BuscaRadar, type ModoBusca } from "@shared/radar/buscas";
import { listarBuscas, pedirBusca, type ClienteRadar } from "@/features/radar/nuvem";

const painel = "rounded-xl border border-white/[0.08] bg-[#121318]";
const campo = "h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#0C2AFE]";

const MODOS: Record<ModoBusca, { nome: string; icone: typeof Zap; texto: string }> = {
  rapida: { nome: "Rápida", icone: Zap, texto: "Google Maps e site de cada empresa, em até 1 minuto. Sem análise do Instagram, então a nota sai mais baixa." },
  completa: { nome: "Completa", icone: Telescope, texto: "Instagram, anúncios, Google e concorrentes, feita pelo agente no Mac da MF. Os leads chegam aqui quando terminar." },
};
const STATUS: Record<BuscaRadar["status"], string> = { pendente: "Na fila", rodando: "Buscando", concluida: "Concluída", falhou: "Falhou" };

function quando(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function resumo(busca: BuscaRadar) {
  const r = busca.resultado as { gravados?: number; duplicados?: number; achados?: number } | undefined;
  if (busca.status === "falhou") return busca.erro ?? "Falhou sem mensagem.";
  if (busca.status !== "concluida" || !r) return busca.modo === "completa" ? "Aguardando o agente." : "Em andamento.";
  return `${r.gravados ?? 0} leads novos${r.duplicados ? `, ${r.duplicados} já estavam no Radar` : ""}${r.achados !== undefined ? ` (de ${r.achados} achados)` : ""}.`;
}

/** Aba Buscar do Radar: o parceiro (e o Matheus) pedem leads de um nicho numa região. */
export default function BuscaPainel({ cliente, owner, aoConcluir }: { cliente: ClienteRadar; owner: string; aoConcluir: () => void }) {
  const [modo, setModo] = useState<ModoBusca>("rapida");
  const [nicho, setNicho] = useState("");
  const [regiao, setRegiao] = useState("");
  const [quantidade, setQuantidade] = useState(5);
  const [buscas, setBuscas] = useState<BuscaRadar[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    try { setBuscas(await listarBuscas(cliente, owner)); } catch { /* a lista volta na próxima leitura */ }
  }, [cliente, owner]);

  const emAndamento = buscas.some((b) => b.status === "pendente" || b.status === "rodando");
  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => {
    if (!emAndamento) return;
    const t = window.setInterval(() => { void carregar(); aoConcluir(); }, 15000);
    return () => window.clearInterval(t);
  }, [emAndamento, carregar, aoConcluir]);

  const limite = LIMITES_BUSCA[modo];
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date());
  const usadasHoje = buscas.filter((b) => b.modo === modo && new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date(b.criado_em)) === hoje).length;
  const esgotado = usadasHoje >= limite.porDia;

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnviando(true); setAviso(null);
    try {
      const r = await pedirBusca(cliente, modo, { nicho, regiao, quantidade });
      const res = r.resultado as { gravados?: number; duplicados?: number } | undefined;
      setAviso({ tipo: "ok", texto: modo === "completa"
        ? "Pedido na fila. O agente roda a busca completa e os leads aparecem nas abas Leads e Fila."
        : `Busca concluída: ${res?.gravados ?? 0} leads novos${res?.duplicados ? `, ${res.duplicados} já estavam no Radar` : ""}. Confira na aba Fila.` });
      if (modo === "rapida") aoConcluir();
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro instanceof Error ? erro.message : "A busca falhou." });
    } finally {
      setEnviando(false);
      void carregar();
    }
  };

  return <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
    <section className={`${painel} min-w-0 p-4 sm:p-5`} aria-label="Nova busca">
      <p className="text-[11px] uppercase tracking-wide text-white/40">Nova busca</p>
      <h2 className="mt-1 text-lg font-semibold">Achar leads</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de busca">
        {(Object.keys(MODOS) as ModoBusca[]).map((m) => {
          const { nome, icone: Icone, texto } = MODOS[m];
          return <button key={m} type="button" role="radio" aria-checked={modo === m} onClick={() => { setModo(m); setQuantidade((q) => Math.min(q, LIMITES_BUSCA[m].quantidade)); }}
            className={`min-w-0 rounded-lg border p-3 text-left transition-colors ${modo === m ? "border-[#0C2AFE]/70 bg-[#0C2AFE]/10" : "border-white/[0.08] hover:bg-white/[0.04]"}`}>
            <span className="flex items-center gap-2 text-[13px] font-semibold"><Icone size={15} /> {nome}</span>
            <span className="mt-1 block text-[12px] leading-relaxed text-white/55">{texto}</span>
          </button>;
        })}
      </div>
      <form onSubmit={enviar} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_110px]">
        <label className="block min-w-0 text-[12px] text-white/55">Nicho<input value={nicho} onChange={(e) => setNicho(e.target.value)} required minLength={2} maxLength={100} placeholder="Clínicas de estética" className={`${campo} mt-1.5`} /></label>
        <label className="block min-w-0 text-[12px] text-white/55">Cidade ou região<input value={regiao} onChange={(e) => setRegiao(e.target.value)} required minLength={2} maxLength={120} placeholder="Fortaleza, CE" className={`${campo} mt-1.5`} /></label>
        <label className="block min-w-0 text-[12px] text-white/55">Quantidade<input type="number" inputMode="numeric" min={1} max={limite.quantidade} value={quantidade} onChange={(e) => setQuantidade(Math.max(1, Math.min(limite.quantidade, Number(e.target.value) || 1)))} className={`${campo} mt-1.5`} /></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
          <button type="submit" disabled={enviando || esgotado} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#0C2AFE] bg-[#0C2AFE] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2440ff] disabled:cursor-not-allowed disabled:opacity-45">
            {enviando ? <><LoaderCircle size={15} className="animate-spin" /> {modo === "rapida" ? "Buscando e analisando os sites…" : "Enviando pedido…"}</> : <><Search size={15} /> {modo === "rapida" ? "Buscar agora" : "Pedir busca completa"}</>}
          </button>
          <span className="text-[12px] text-white/45">{usadasHoje}/{limite.porDia} buscas {modo === "rapida" ? "rápidas" : "completas"} hoje · até {limite.quantidade} leads por busca</span>
        </div>
      </form>
      {aviso && <p role={aviso.tipo === "erro" ? "alert" : "status"} className={`mt-4 flex gap-2 rounded-lg p-3 text-[13px] leading-relaxed ${aviso.tipo === "erro" ? "bg-red-400/10 text-red-200" : "bg-emerald-400/10 text-emerald-100"}`}>{aviso.tipo === "erro" && <AlertTriangle size={15} className="mt-0.5 shrink-0" />}{aviso.texto}</p>}
      <p className="mt-4 text-[12px] leading-relaxed text-white/45">Cada lead entra com a nota pela régua e uma mensagem em rascunho na Fila. Você revisa, envia pelo seu Instagram ou WhatsApp e marca como enviado.</p>
    </section>
    <section className={`${painel} min-w-0 p-4`} aria-label="Buscas pedidas">
      <h2 className="text-sm font-semibold">Buscas</h2>
      <div className="mt-3 max-h-[60dvh] space-y-2 overflow-y-auto">
        {buscas.length ? buscas.map((b) => <div key={b.id} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="mr-auto min-w-0 truncate text-[13px]">{b.nicho} · {b.regiao}</strong>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${b.status === "falhou" ? "bg-red-400/15 text-red-200" : b.status === "concluida" ? "bg-emerald-400/15 text-emerald-100" : "bg-amber-300/15 text-amber-100"}`}>{STATUS[b.status]}</span>
          </div>
          <p className="mt-1 text-[11px] text-white/40">{MODOS[b.modo].nome} · {b.quantidade} leads · {quando(b.criado_em)}</p>
          <p className="mt-1.5 break-words text-[12px] text-white/65">{resumo(b)}</p>
        </div>) : <p className="p-5 text-center text-sm text-white/45">Nenhuma busca ainda.</p>}
      </div>
    </section>
  </div>;
}
