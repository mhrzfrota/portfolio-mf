import { useEffect, useMemo, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANGULOS, ETAPAS, type AnguloId, type Estudio, type Peca, type Tematica } from "@/features/conteudo/estudio";
import { FacePeca } from "./pecas";

const campo =
  "block w-full rounded-lg border border-transparent bg-[#2C2C2E] px-3 text-[13.5px] text-white placeholder:text-white/35 focus:border-[#0A84FF] focus:outline-none disabled:opacity-60";

type Celula = { tematica: string; angulo: AnguloId };

/**
 * Formular: o cruzamento que gera pauta. Cada linha é uma temática (o encontro
 * entre o que o cliente vive e o que eu faço), cada coluna um ângulo. A casa
 * vazia é uma peça que ainda não existe: um toque cria a ideia com o esqueleto.
 */
export default function Formular({ estudio, abrir, criar, tematicaAcoes, bloqueado }: {
  estudio: Estudio;
  abrir: (id: string) => void;
  criar: (c: Celula) => void;
  tematicaAcoes: { adicionar: (nome: string) => boolean; editar: (id: string, patch: Partial<Omit<Tematica, "id">>) => boolean; remover: (id: string) => boolean };
  bloqueado: boolean;
}) {
  const todas = useMemo(() => ETAPAS.flatMap((e) => estudio.pecas[e.id]), [estudio]);
  const porCelula = useMemo(() => {
    const m = new Map<string, Peca[]>();
    for (const p of todas) if (p.tematica && p.angulo) m.set(`${p.tematica}|${p.angulo}`, [...(m.get(`${p.tematica}|${p.angulo}`) ?? []), p]);
    return m;
  }, [todas]);
  const [sel, setSel] = useState<Celula | null>(null);
  const [nova, setNova] = useState("");
  const vazias = estudio.tematicas.length * ANGULOS.length - porCelula.size;
  const selPecas = sel ? porCelula.get(`${sel.tematica}|${sel.angulo}`) ?? [] : [];
  const selTematica = sel && estudio.tematicas.find((t) => t.id === sel.tematica);
  const selAngulo = sel && ANGULOS.find((a) => a.id === sel.angulo);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/[0.07] bg-[#121318] p-3 sm:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h2 className="text-[15px] font-semibold">Temática × ângulo</h2>
          <p className="text-[12.5px] text-white/45">{vazias} cruzamentos ainda sem peça. Toque numa casa vazia para criar a ideia.</p>
        </div>
        <div className="mt-3 overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-1 text-[12.5px]">
            <thead>
              <tr>
                <th className="w-[200px]" />
                {ANGULOS.map((a) => (
                  <th key={a.id} scope="col" className="px-1 pb-1 text-left font-medium text-white/70" title={a.serve}>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: a.cor }} aria-hidden />{a.nome}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estudio.tematicas.map((t) => (
                <tr key={t.id}>
                  <th scope="row" className="pr-2 text-left font-medium text-white/85">
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: t.cor }} aria-hidden />{t.nome}</span>
                  </th>
                  {ANGULOS.map((a) => {
                    const n = porCelula.get(`${t.id}|${a.id}`)?.length ?? 0;
                    const ativa = sel?.tematica === t.id && sel.angulo === a.id;
                    return (
                      <td key={a.id} className="p-0">
                        <button
                          type="button"
                          onClick={() => setSel(ativa ? null : { tematica: t.id, angulo: a.id })}
                          aria-pressed={ativa}
                          aria-label={`${t.nome}, ${a.nome}: ${n} peça${n === 1 ? "" : "s"}`}
                          className={cn(
                            "flex h-11 w-full items-center justify-center rounded-lg border text-[14px] font-semibold tabular-nums transition-colors",
                            ativa ? "border-[#0A84FF] bg-[#0A84FF]/20 text-white"
                              : n ? "border-transparent bg-white/[0.08] text-white hover:bg-white/[0.14]"
                              : "border-dashed border-white/[0.1] text-white/25 hover:border-white/30 hover:text-white/70",
                          )}
                        >
                          {n || <Plus size={14} aria-hidden />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sel && selTematica && selAngulo && (
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#17181E] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold">{selTematica.nome} · {selAngulo.nome}</p>
                <p className="mt-0.5 text-[12.5px] text-white/50">{selAngulo.serve}. Esqueleto: {selAngulo.esqueleto.join(" → ")}.</p>
              </div>
              {!bloqueado && (
                <button type="button" onClick={() => criar(sel)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#0A84FF] px-3 text-[13px] font-semibold">
                  <Sparkles size={14} /> Nova ideia aqui
                </button>
              )}
            </div>
            {selPecas.length > 0 && (
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {selPecas.map((p) => (
                  <li key={p.id} className="group list-none">
                    <button type="button" onClick={() => abrir(p.id)} className="block w-full rounded-xl focus-visible:outline-2 focus-visible:outline-[#0A84FF]">
                      <FacePeca p={p} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 pb-2">
          <h2 className="text-[15px] font-semibold">Temáticas</h2>
          <p className="text-[12.5px] text-white/45">Cada uma é o encontro entre o que o cliente vive e o que eu faço. Se o encontro estiver errado, todo o resto erra junto.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {estudio.tematicas.map((t) => (
            <CartaoTematica key={t.id} t={t} bloqueado={bloqueado} editar={(patch) => tematicaAcoes.editar(t.id, patch)} remover={() => tematicaAcoes.remover(t.id)} />
          ))}
          {!bloqueado && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (nova.trim() && tematicaAcoes.adicionar(nova)) setNova("");
              }}
              className="flex min-h-[120px] flex-col justify-center gap-2 rounded-2xl border border-dashed border-white/[0.12] p-4"
            >
              <label htmlFor="nova-tematica" className="text-[13px] text-white/60">Nova temática</label>
              <div className="flex gap-2">
                <input id="nova-tematica" value={nova} maxLength={60} onChange={(e) => setNova(e.target.value)} placeholder="Ex.: Loja com pagamento online" className={cn(campo, "h-9")} />
                <button type="submit" disabled={!nova.trim()} className="h-9 shrink-0 rounded-lg bg-[#0A84FF] px-3 text-[13px] font-semibold disabled:opacity-40">Criar</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function CartaoTematica({ t, bloqueado, editar, remover }: { t: Tematica; bloqueado: boolean; editar: (p: Partial<Omit<Tematica, "id">>) => boolean; remover: () => boolean }) {
  const [nome, setNome] = useState(t.nome);
  const [cliente, setCliente] = useState(t.cliente);
  const [eu, setEu] = useState(t.eu);
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => {
    setNome(t.nome);
    setCliente(t.cliente);
    setEu(t.eu);
  }, [t.nome, t.cliente, t.eu]);
  const salvar = <K extends "nome" | "cliente" | "eu">(k: K, v: string, voltar: () => void) => v !== t[k] && !editar({ [k]: v }) && voltar();

  return (
    <article className="flex flex-col rounded-2xl border border-white/[0.07] bg-[#121318] p-4">
      <div className="flex items-center gap-2">
        <label className="relative h-4 w-4 shrink-0 overflow-hidden rounded" title="Cor da temática">
          <span className="absolute inset-0" style={{ background: t.cor }} />
          <input type="color" disabled={bloqueado} value={t.cor} onChange={(e) => editar({ cor: e.target.value.toUpperCase() })} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Cor de ${t.nome}`} />
        </label>
        <input
          value={nome}
          maxLength={60}
          disabled={bloqueado}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => salvar("nome", nome, () => setNome(t.nome))}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Nome da temática"
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 text-[15px] font-semibold focus:bg-[#2C2C2E] focus:outline-none"
        />
        {!bloqueado &&
          (confirmar ? (
            <span className="flex items-center gap-1 text-[12px]">
              <button type="button" onClick={remover} className="h-7 rounded-md bg-[#FF453A] px-2 font-semibold">Excluir</button>
              <button type="button" onClick={() => setConfirmar(false)} className="h-7 rounded-md px-2 text-white/60 hover:bg-white/10">Não</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmar(true)} aria-label={`Excluir ${t.nome}`} className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 hover:bg-white/10 hover:text-white">
              <Trash2 size={14} />
            </button>
          ))}
      </div>
      <label className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white/45" htmlFor={`cli-${t.id}`}>O que o cliente vive</label>
      <textarea id={`cli-${t.id}`} rows={3} maxLength={1000} disabled={bloqueado} value={cliente} onChange={(e) => setCliente(e.target.value)} onBlur={() => salvar("cliente", cliente, () => setCliente(t.cliente))} className={cn(campo, "mt-1 resize-y py-2 leading-relaxed")} />
      <label className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white/45" htmlFor={`eu-${t.id}`}>O que eu faço e provo</label>
      <textarea id={`eu-${t.id}`} rows={3} maxLength={1000} disabled={bloqueado} value={eu} onChange={(e) => setEu(e.target.value)} onBlur={() => salvar("eu", eu, () => setEu(t.eu))} className={cn(campo, "mt-1 resize-y py-2 leading-relaxed")} />
    </article>
  );
}
