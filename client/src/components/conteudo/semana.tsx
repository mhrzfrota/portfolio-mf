import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { hojeISO } from "@/features/plano/store";
import { ANGULOS, FORMATOS, mistura, semana, type Estudio, type Tematica } from "@/features/conteudo/estudio";
import { FacePeca } from "./pecas";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Segunda-feira da semana de uma data, em data local. */
function segunda(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return hojeISO(d);
}
function somar(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return hojeISO(d);
}
const curta = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

/**
 * A semana de publicação, no estilo do calendário: uma coluna por dia com as
 * peças daquela data, as que ainda não têm data para encaixar e o equilíbrio
 * do mês (raso e profundo, ângulos e formatos).
 */
export default function Semana({ estudio, tematicas, abrir, criarNoDia, bloqueado }: {
  estudio: Estudio; tematicas: Map<string, Tematica>; abrir: (id: string) => void; criarNoDia: (data: string) => void; bloqueado: boolean;
}) {
  const hoje = hojeISO();
  const [inicio, setInicio] = useState(() => segunda(hoje));
  const dias = useMemo(() => semana(estudio, inicio), [estudio, inicio]);
  const semData = useMemo(
    () => [...estudio.pecas.roteiro, ...estudio.pecas.producao, ...estudio.pecas.pronto].filter((p) => !p.data),
    [estudio],
  );
  const mes = useMemo(() => {
    const de = somar(inicio, -14);
    const ate = somar(inicio, 20);
    return { de, ate, ...mistura(estudio, { de, ate }) };
  }, [estudio, inicio]);
  const totalProf = mes.raso + mes.profundo;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setInicio((i) => somar(i, -7))} aria-label="Semana anterior" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] hover:bg-white/[0.1]"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => setInicio((i) => somar(i, 7))} aria-label="Próxima semana" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] hover:bg-white/[0.1]"><ChevronRight size={18} /></button>
        <p className="text-[15px] font-semibold">{curta(inicio)} a {curta(somar(inicio, 6))}</p>
        {inicio !== segunda(hoje) && (
          <button type="button" onClick={() => setInicio(segunda(hoje))} className="h-8 rounded-lg px-2.5 text-[13px] text-white/60 hover:bg-white/[0.08] hover:text-white">Hoje</button>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-7">
        {dias.map((d, i) => {
          const ehHoje = d.data === hoje;
          return (
            <section key={d.data} aria-label={`${DIAS[i]} ${curta(d.data)}`} className={cn("flex min-h-[132px] flex-col rounded-2xl border bg-[var(--i-s1)] p-2", ehHoje ? "border-[#0A84FF]/50" : "border-white/[0.07]")}>
              <header className="flex items-center justify-between px-1.5 pb-1.5 pt-0.5">
                <span className={cn("text-[13px] font-semibold", ehHoje ? "text-[#0A73A0]" : "text-white/80")}>
                  {DIAS[i]} <span className="font-normal text-white/40">{curta(d.data)}</span>
                </span>
                {!bloqueado && (
                  <button type="button" onClick={() => criarNoDia(d.data)} aria-label={`Nova peça em ${DIAS[i]}`} className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white">
                    <Plus size={16} />
                  </button>
                )}
              </header>
              <ul className="flex flex-1 flex-col gap-1.5">
                {d.pecas.map((p) => (
                  <li key={p.id} className="group list-none">
                    <button type="button" onClick={() => abrir(p.id)} className="block w-full rounded-xl focus-visible:outline-2 focus-visible:outline-[#0A84FF]">
                      <FacePeca p={p} tematica={tematicas.get(p.tematica)} />
                    </button>
                  </li>
                ))}
                {d.pecas.length === 0 && <li className="list-none px-1.5 text-[12px] text-white/25">Sem post</li>}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        {/* Peças prontas ou em andamento sem data: o que encaixar na semana */}
        <section className="rounded-2xl border border-white/[0.07] bg-[var(--i-s1)] p-3">
          <h2 className="px-1 text-[14px] font-semibold">Para encaixar <span className="font-normal text-white/40">{semData.length}</span></h2>
          <p className="px-1 pb-2 text-[12px] text-white/40">Em roteiro, produção ou prontas, ainda sem data. Abra e escolha o dia.</p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {semData.map((p) => (
              <li key={p.id} className="group list-none">
                <button type="button" onClick={() => abrir(p.id)} className="block w-full rounded-xl focus-visible:outline-2 focus-visible:outline-[#0A84FF]">
                  <FacePeca p={p} tematica={tematicas.get(p.tematica)} />
                </button>
              </li>
            ))}
            {semData.length === 0 && <li className="list-none px-1 text-[13px] text-white/35">Tudo com data.</li>}
          </ul>
        </section>

        {/* Equilíbrio: um mês saudável tem raso e profundo, e testa os ângulos */}
        <section className="rounded-2xl border border-white/[0.07] bg-[var(--i-s1)] p-4">
          <h2 className="text-[14px] font-semibold">Equilíbrio de {curta(mes.de)} a {curta(mes.ate)}</h2>
          <p className="text-[12px] text-white/40">Peças com data nestas 5 semanas.</p>

          <div className="mt-4">
            <div className="flex justify-between text-[12.5px]">
              <span className="text-white/70">Raso <b className="text-white">{mes.raso}</b> <span className="text-white/40">traz gente nova</span></span>
              <span className="text-white/70"><span className="text-white/40">vende</span> <b className="text-white">{mes.profundo}</b> Profundo</span>
            </div>
            <div className="mt-1.5 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/[0.06]" role="img" aria-label={`${mes.raso} rasas e ${mes.profundo} profundas`}>
              {totalProf > 0 && (
                <>
                  <span className="rounded-l-full bg-white/50" style={{ width: `${(mes.raso / totalProf) * 100}%` }} />
                  <span className="rounded-r-full bg-[#64D2FF]" style={{ width: `${(mes.profundo / totalProf) * 100}%` }} />
                </>
              )}
            </div>
          </div>

          <h3 className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">Ângulos</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {ANGULOS.map((a) => {
              const n = mes.angulos[a.id] ?? 0;
              return (
                <li key={a.id} className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px]", n ? "border-white/[0.1] text-white/85" : "border-dashed border-white/[0.15] text-white/40")} title={n ? a.serve : `Ainda não testado: ${a.serve}`}>
                  <span className="h-2 w-2 rounded-full" style={{ background: a.cor, opacity: n ? 1 : 0.4 }} aria-hidden />
                  {a.nome} <b className="tabular-nums">{n}</b>
                </li>
              );
            })}
          </ul>

          <h3 className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">Formatos</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/70">
            {FORMATOS.map((f) => (
              <li key={f.id}>{f.nome} <b className="tabular-nums text-white">{mes.formatos[f.id] ?? 0}</b></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
