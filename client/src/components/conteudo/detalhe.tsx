import { useEffect, useRef, useState } from "react";
import { BarChart3, CalendarDays, CheckSquare, Copy, ExternalLink, Link2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ANGULOS, ETAPAS, FORMATOS,
  type AnguloId, type EtapaId, type FormatoId, type Metricas, type NovaPeca, type Peca, type Profundidade, type Tematica,
} from "@/features/conteudo/estudio";

export type AcoesPeca = {
  editar: (patch: Partial<NovaPeca>) => boolean;
  mover: (etapa: EtapaId) => void;
  metricas: (patch: Partial<Metricas>) => boolean;
  adicionarItem: (texto: string) => boolean;
  alternarItem: (itemId: string) => void;
  removerItem: (itemId: string) => void;
  duplicar: () => void;
  remover: () => void;
  fechar: () => void;
};

const campo =
  "block w-full rounded-lg border border-transparent bg-[#2C2C2E] px-3 text-[14px] text-white placeholder:text-white/35 focus:border-[#0A84FF] focus:outline-none disabled:opacity-60";
const rotulo = "mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55";

const METRICAS: { id: keyof Metricas; nome: string }[] = [
  { id: "visualizacoes", nome: "Visualizações" },
  { id: "alcance", nome: "Contas alcançadas" },
  { id: "curtidas", nome: "Curtidas" },
  { id: "comentarios", nome: "Comentários" },
  { id: "salvamentos", nome: "Salvamentos" },
  { id: "compartilhamentos", nome: "Envios" },
  { id: "visitasPerfil", nome: "Visitas ao perfil" },
  { id: "seguidores", nome: "Seguidores" },
];

/** Texto longo editável que salva ao sair do campo. */
function Texto({
  id, rotuloTexto, valor, limite, linhas, placeholder, bloqueado, salvar, contador = false,
}: {
  id: string; rotuloTexto: string; valor: string; limite: number; linhas: number; placeholder: string;
  bloqueado: boolean; salvar: (v: string) => boolean; contador?: boolean;
}) {
  const [v, setV] = useState(valor);
  useEffect(() => setV(valor), [valor]);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-white/70">{rotuloTexto}</label>
        {contador && <span className={cn("text-[11.5px] tabular-nums", v.length > limite * 0.9 ? "text-[#FFB340]" : "text-white/35")}>{v.length}/{limite}</span>}
      </div>
      <textarea
        id={id}
        rows={linhas}
        maxLength={limite}
        disabled={bloqueado}
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== valor && !salvar(v) && setV(valor)}
        className={cn(campo, "resize-y py-2.5 leading-relaxed")}
      />
    </div>
  );
}

function Numero({ m, valor, bloqueado, salvar }: { m: { id: keyof Metricas; nome: string }; valor: number | null; bloqueado: boolean; salvar: (v: number | null) => boolean }) {
  const [v, setV] = useState(valor == null ? "" : String(valor));
  useEffect(() => setV(valor == null ? "" : String(valor)), [valor]);
  const confirmar = () => {
    const limpo = v.replace(/\D/g, "");
    const n = limpo === "" ? null : Number(limpo);
    if (n === valor) return setV(valor == null ? "" : String(valor));
    if (!salvar(n)) setV(valor == null ? "" : String(valor));
  };
  return (
    <label className="block rounded-lg bg-[#2C2C2E] px-3 py-2">
      <span className="block text-[11.5px] text-white/50">{m.nome}</span>
      <input
        inputMode="numeric"
        disabled={bloqueado}
        value={v}
        placeholder="–"
        onChange={(e) => setV(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="mt-0.5 w-full bg-transparent text-[17px] font-semibold tabular-nums text-white placeholder:text-white/25 focus:outline-none"
      />
    </label>
  );
}

/**
 * Detalhe da peça: o método inteiro numa tela. Ângulo, profundidade e formato
 * em um toque; gancho, roteiro e legenda salvam ao sair do campo.
 */
export default function DetalhePeca({ p, tematicas, bloqueado, acoes }: { p: Peca; tematicas: Tematica[]; bloqueado: boolean; acoes: AcoesPeca }) {
  const [titulo, setTitulo] = useState(p.titulo);
  const [link, setLink] = useState(p.link);
  const [novoItem, setNovoItem] = useState("");
  const [confirmarRemover, setConfirmarRemover] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const ang = ANGULOS.find((a) => a.id === p.angulo);

  useEffect(() => {
    setTitulo(p.titulo);
    setLink(p.link);
  }, [p.id, p.titulo, p.link]);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    caixa.current?.focus();
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && acoes.fechar();
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
      anterior?.focus?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ângulo novo num roteiro vazio já entra com o esqueleto, para escrever por cima
  const escolherAngulo = (id: AnguloId) => {
    const novo = p.angulo === id ? "" : id;
    const esqueleto = ANGULOS.find((a) => a.id === novo)?.esqueleto;
    acoes.editar(!p.roteiro.trim() && esqueleto ? { angulo: novo, roteiro: esqueleto.map((s) => `${s}:\n`).join("\n") } : { angulo: novo });
  };

  const chip = (ativo: boolean) =>
    cn("flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors disabled:opacity-60", ativo ? "border-transparent bg-white/[0.16] text-white" : "border-white/[0.1] text-white/65 hover:border-white/25");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-[5vh] backdrop-blur-[2px] sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && acoes.fechar()}>
      <div ref={caixa} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="titulo-peca" className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#1C1C1E] text-white shadow-2xl outline-none">
        <div className="flex items-start gap-3 border-b border-white/[0.07] p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <label htmlFor="titulo-peca" className="sr-only">Título</label>
            <textarea
              id="titulo-peca"
              rows={1}
              maxLength={140}
              disabled={bloqueado}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value.replace(/\n/g, " "))}
              onBlur={() => titulo !== p.titulo && !acoes.editar({ titulo }) && setTitulo(p.titulo)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
              className="block w-full resize-none rounded-lg bg-transparent px-1 py-0.5 text-[20px] font-semibold leading-snug focus:bg-[#2C2C2E] focus:outline-none [field-sizing:content]"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 px-1 text-[13px] text-white/60">
              <label htmlFor="etapa-peca">Etapa</label>
              <select id="etapa-peca" disabled={bloqueado} value={p.etapa} onChange={(e) => acoes.mover(e.target.value as EtapaId)} className="h-8 rounded-md bg-[#2C2C2E] px-2 text-[13px] font-medium text-white">
                {ETAPAS.map((e) => <option key={e.id} value={e.id}>{e.titulo}</option>)}
              </select>
              <label htmlFor="tematica-peca" className="ml-1">Temática</label>
              <select id="tematica-peca" disabled={bloqueado} value={p.tematica} onChange={(e) => acoes.editar({ tematica: e.target.value })} className="h-8 max-w-[220px] rounded-md bg-[#2C2C2E] px-2 text-[13px] font-medium text-white">
                <option value="">Sem temática</option>
                {tematicas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
              {p.publicadoEm && <span className="text-emerald-300">no ar desde {p.publicadoEm.split("-").reverse().join("/")}</span>}
            </div>
          </div>
          <button type="button" onClick={acoes.fechar} aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-4 sm:p-5">
          {/* Ângulo, profundidade e formato */}
          <section>
            <h3 className={rotulo}>Ângulo</h3>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ângulo">
              {ANGULOS.map((a) => (
                <button key={a.id} type="button" disabled={bloqueado} aria-pressed={p.angulo === a.id} onClick={() => escolherAngulo(a.id)} className={chip(p.angulo === a.id)} title={a.serve}>
                  <span className="h-2 w-2 rounded-full" style={{ background: a.cor }} aria-hidden />
                  {a.nome}
                </button>
              ))}
            </div>
            {ang && <p className="mt-2 text-[12.5px] text-white/45">{ang.serve}. Esqueleto: {ang.esqueleto.join(" → ")}.</p>}
          </section>

          <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
            <section>
              <h3 className={rotulo}>Profundidade</h3>
              <div className="flex rounded-full bg-[#2C2C2E] p-0.5" role="group" aria-label="Profundidade">
                {(["raso", "profundo"] as Profundidade[]).map((pr) => (
                  <button
                    key={pr}
                    type="button"
                    disabled={bloqueado}
                    aria-pressed={p.profundidade === pr}
                    onClick={() => acoes.editar({ profundidade: p.profundidade === pr ? "" : pr })}
                    className={cn("h-8 rounded-full px-3.5 text-[12.5px] font-medium capitalize", p.profundidade === pr ? "bg-white/[0.16] text-white" : "text-white/55 hover:text-white")}
                    title={pr === "raso" ? "Traz gente nova" : "Constrói autoridade e vende"}
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3 className={rotulo}>Formato</h3>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Formato">
                {FORMATOS.map((f) => (
                  <button key={f.id} type="button" disabled={bloqueado} aria-pressed={p.formato === f.id} onClick={() => acoes.editar({ formato: p.formato === f.id ? "" : (f.id as FormatoId) })} className={chip(p.formato === f.id)}>
                    {f.nome}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Escrita */}
          <section className="space-y-4">
            <Texto id="gancho" rotuloTexto="Gancho (o que fisga nos 3 primeiros segundos)" valor={p.gancho} limite={300} linhas={2} placeholder="A primeira frase, na tela e na fala" bloqueado={bloqueado} salvar={(gancho) => acoes.editar({ gancho })} />
            <Texto id="roteiro" rotuloTexto="Roteiro" valor={p.roteiro} limite={8000} linhas={8} placeholder="Começo que fisga, meio que desenvolve, fim que conclui" bloqueado={bloqueado} salvar={(roteiro) => acoes.editar({ roteiro })} />
            <Texto id="legenda" rotuloTexto="Legenda" valor={p.legenda} limite={2200} linhas={4} placeholder="Fecha com motivo para salvar, enviar ou comentar" bloqueado={bloqueado} salvar={(legenda) => acoes.editar({ legenda })} contador />
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section>
              <h3 className={rotulo}><CalendarDays size={14} /> Data de publicação</h3>
              <input type="date" disabled={bloqueado} value={p.data} onChange={(e) => acoes.editar({ data: e.target.value })} className={cn(campo, "h-10 [color-scheme:dark]")} aria-label="Data de publicação" />
            </section>
            <section>
              <h3 className={rotulo}><Link2 size={14} /> Link (post no ar ou referência)</h3>
              <div className="flex gap-2">
                <input
                  type="url"
                  disabled={bloqueado}
                  value={link}
                  placeholder="https://"
                  onChange={(e) => setLink(e.target.value)}
                  onBlur={() => link.trim() !== p.link && !acoes.editar({ link: link.trim() }) && setLink(p.link)}
                  className={cn(campo, "h-10")}
                  aria-label="Link"
                />
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" aria-label="Abrir link" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2C2C2E] text-white/70 hover:text-white">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </section>
          </div>

          {/* Números: aparecem quando a peça está no ar */}
          {p.etapa === "publicado" && (
            <section>
              <h3 className={rotulo}><BarChart3 size={14} /> Números (Insights do Instagram)</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {METRICAS.map((m) => (
                  <Numero key={m.id} m={m} valor={p.metricas[m.id]} bloqueado={bloqueado} salvar={(v) => acoes.metricas({ [m.id]: v })} />
                ))}
              </div>
            </section>
          )}

          {/* Checklist */}
          <section>
            <h3 className={rotulo}><CheckSquare size={14} /> Para publicar</h3>
            <ul className="space-y-1">
              {p.checklist.map((i) => (
                <li key={i.id} className="group flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-white/[0.04]">
                  <input type="checkbox" disabled={bloqueado} checked={i.feito} onChange={() => acoes.alternarItem(i.id)} className="h-4 w-4 accent-[#0A84FF]" aria-label={i.texto} />
                  <span className={cn("flex-1 text-[14px]", i.feito && "text-white/40 line-through")}>{i.texto}</span>
                  {!bloqueado && (
                    <button type="button" onClick={() => acoes.removerItem(i.id)} aria-label={`Remover ${i.texto}`} className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 opacity-0 hover:bg-white/10 hover:text-white focus:opacity-100 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!bloqueado && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (novoItem.trim() && acoes.adicionarItem(novoItem)) setNovoItem("");
                }}
                className="mt-1.5"
              >
                <input value={novoItem} maxLength={200} onChange={(e) => setNovoItem(e.target.value)} placeholder="Adicionar item (Enter)" className={cn(campo, "h-9")} aria-label="Novo item" />
              </form>
            )}
          </section>

          {!bloqueado && (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
              <button type="button" onClick={acoes.duplicar} className="flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-[13px] font-medium hover:bg-white/[0.1]">
                <Copy size={14} /> Duplicar
              </button>
              {confirmarRemover ? (
                <span className="ml-auto flex items-center gap-2 text-[13px]">
                  Excluir esta peça?
                  <button type="button" onClick={acoes.remover} className="h-9 rounded-lg bg-[#FF453A] px-3 font-semibold">Excluir</button>
                  <button type="button" onClick={() => setConfirmarRemover(false)} className="h-9 rounded-lg px-3 text-white/70 hover:bg-white/10">Cancelar</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmarRemover(true)} className="ml-auto flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] text-[#FF6961] hover:bg-[#FF453A]/10">
                  <Trash2 size={14} /> Excluir
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
