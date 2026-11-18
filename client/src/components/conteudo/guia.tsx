import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRUPOS, notasDoGrupo, type Estudio, type GrupoNota, type Nota } from "@/features/conteudo/estudio";

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const resumo = (t: string) => t.replace(/\s+/g, " ").trim().slice(0, 90);

export type AcoesNota = {
  adicionar: (grupo: GrupoNota) => string | null;
  editar: (id: string, patch: { titulo?: string; texto?: string }) => boolean;
  fixar: (id: string) => void;
  remover: (id: string) => boolean;
};

/**
 * Guia: as notas de conteúdo no jeito do app Notas. Pastas à esquerda, lista
 * no meio, a nota aberta à direita. Tudo salva ao sair do campo. No celular,
 * uma coisa por vez.
 */
export default function Guia({ estudio, acoes, bloqueado }: { estudio: Estudio; acoes: AcoesNota; bloqueado: boolean }) {
  const [grupo, setGrupo] = useState<GrupoNota>("metodo");
  const [busca, setBusca] = useState("");
  // No computador já abre a primeira nota; no celular começa pela lista
  const [aberta, setAberta] = useState<string | null>(() =>
    window.matchMedia("(min-width: 768px)").matches ? notasDoGrupo(estudio, "metodo")[0]?.id ?? null : null,
  );
  const lista = useMemo(() => {
    if (!busca.trim()) return notasDoGrupo(estudio, grupo);
    const q = semAcento(busca.trim());
    return estudio.notas.filter((n) => semAcento(`${n.titulo} ${n.texto}`).includes(q));
  }, [estudio, grupo, busca]);
  const nota = aberta ? estudio.notas.find((n) => n.id === aberta) ?? null : null;
  const contagem = (g: GrupoNota) => estudio.notas.filter((n) => n.grupo === g).length;

  return (
    <div className="grid min-h-[calc(100dvh-14rem)] grid-cols-1 grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-white/[0.07] bg-[var(--i-s1)] md:grid-cols-[200px_280px_minmax(0,1fr)] md:grid-rows-1">
      {/* Pastas */}
      <nav aria-label="Pastas" className={cn("min-w-0 border-b border-white/[0.07] p-2 md:border-b-0 md:border-r", nota && "hidden md:block")}>
        <ul className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0 [scrollbar-width:none]">
          {GRUPOS.map((g) => (
            <li key={g.id} className="shrink-0">
              <button
                type="button"
                aria-current={grupo === g.id && !busca ? "true" : undefined}
                onClick={() => {
                  setGrupo(g.id);
                  setBusca("");
                  setAberta(null);
                }}
                className={cn("flex h-9 w-full items-center justify-between gap-3 rounded-lg px-3 text-[13.5px]", grupo === g.id && !busca ? "bg-white/[0.12] font-medium text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white")}
              >
                {g.nome}
                <span className="text-[12px] text-white/35">{contagem(g.id)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Lista */}
      <section aria-label="Notas" className={cn("flex min-w-0 flex-col border-white/[0.07] md:border-r", nota && "hidden md:flex")}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] p-2">
          <label className="relative flex-1">
            <span className="sr-only">Buscar nas notas</span>
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar em tudo" className="h-8 w-full rounded-lg bg-white/[0.05] pl-8 pr-2 text-[13px] text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-[#0A84FF]" />
          </label>
          {!bloqueado && (
            <button
              type="button"
              onClick={() => {
                const id = acoes.adicionar(grupo);
                if (id) {
                  setBusca("");
                  setAberta(id);
                }
              }}
              aria-label="Nova nota"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            >
              <Plus size={17} />
            </button>
          )}
        </div>
        <ul className="flex-1 overflow-y-auto p-1.5 [scrollbar-width:thin]">
          {lista.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => setAberta(n.id)} className={cn("block w-full rounded-lg px-3 py-2.5 text-left", aberta === n.id ? "bg-[#0A84FF]/25" : "hover:bg-white/[0.05]")}>
                <span className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                  {n.fixada && <Pin size={12} className="shrink-0 text-[#B86E00]" aria-label="Fixada" />}
                  <span className="truncate">{n.titulo}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-white/45">{resumo(n.texto) || "Sem texto"}</span>
              </button>
            </li>
          ))}
          {lista.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-white/35">{busca ? "Nada encontrado." : "Nenhuma nota aqui ainda."}</li>}
        </ul>
      </section>

      {/* Nota aberta */}
      <section aria-label="Nota" className={cn("row-span-2 min-w-0 md:row-span-1", !nota && "hidden md:block")}>
        {nota ? (
          <Editor key={nota.id} nota={nota} acoes={acoes} bloqueado={bloqueado} voltar={() => setAberta(null)} fechar={() => setAberta(null)} />
        ) : (
          <p className="grid h-full place-items-center p-8 text-[13.5px] text-white/30">Escolha uma nota</p>
        )}
      </section>
    </div>
  );
}

function Editor({ nota, acoes, bloqueado, voltar, fechar }: { nota: Nota; acoes: AcoesNota; bloqueado: boolean; voltar: () => void; fechar: () => void }) {
  const [titulo, setTitulo] = useState(nota.titulo);
  const [texto, setTexto] = useState(nota.texto);
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => {
    setTitulo(nota.titulo);
    setTexto(nota.texto);
  }, [nota.titulo, nota.texto]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-white/[0.07] p-2">
        <button type="button" onClick={voltar} className="flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-[#0A6CDB] md:hidden">
          <ChevronLeft size={16} /> Notas
        </button>
        <span className="ml-1 hidden text-[12px] text-white/35 md:inline">editada em {nota.atualizadoEm.split("-").reverse().join("/")}</span>
        {!bloqueado && (
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => acoes.fixar(nota.id)} aria-label={nota.fixada ? "Desafixar" : "Fixar no topo"} title={nota.fixada ? "Desafixar" : "Fixar no topo"} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white">
              {nota.fixada ? <PinOff size={15} /> : <Pin size={15} />}
            </button>
            {confirmar ? (
              <span className="flex items-center gap-1 text-[12.5px]">
                <button type="button" onClick={() => acoes.remover(nota.id) && fechar()} className="h-8 rounded-lg bg-[#FF453A] px-2.5 font-semibold">Excluir</button>
                <button type="button" onClick={() => setConfirmar(false)} className="h-8 rounded-lg px-2 text-white/60 hover:bg-white/10">Não</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmar(true)} aria-label="Excluir nota" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <input
          value={titulo}
          maxLength={120}
          disabled={bloqueado}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => titulo !== nota.titulo && !acoes.editar(nota.id, { titulo }) && setTitulo(nota.titulo)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Título da nota"
          className="w-full bg-transparent text-[22px] font-bold tracking-tight focus:outline-none"
        />
        <textarea
          value={texto}
          maxLength={12000}
          disabled={bloqueado}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => texto !== nota.texto && !acoes.editar(nota.id, { texto }) && setTexto(nota.texto)}
          aria-label="Texto da nota"
          placeholder="Escreva aqui"
          className="mt-3 min-h-[320px] w-full flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-white/85 placeholder:text-white/25 focus:outline-none"
        />
      </div>
    </div>
  );
}
