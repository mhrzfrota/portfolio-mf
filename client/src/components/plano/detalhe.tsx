import { useEffect, useRef, useState } from "react";
import { CalendarDays, CheckSquare, Copy, ExternalLink, Link2, Tag, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLUNAS, ETIQUETAS, atrasado, progresso, type Cartao, type ColunaId, type EtiquetaId, type NovoCartao } from "@/features/plano/quadro";

type Acoes = {
  editar: (patch: Partial<NovoCartao>) => boolean;
  mover: (coluna: ColunaId) => void;
  adicionarItem: (texto: string) => boolean;
  alternarItem: (itemId: string) => void;
  editarItem: (itemId: string, texto: string) => boolean;
  removerItem: (itemId: string) => void;
  duplicar: () => void;
  remover: () => void;
  fechar: () => void;
};

const campo =
  "block w-full rounded-lg border border-transparent bg-[#2C2C2E] px-3 text-[14px] text-white placeholder:text-white/35 focus:border-[#0A84FF] focus:outline-none";

/**
 * Detalhe do cartão, como o do Trello: tudo editável no lugar. Cada campo
 * salva ao sair dele (ou no Enter), sem botão "salvar".
 */
export default function DetalheCartao({ c, projetos, bloqueado, acoes }: { c: Cartao; projetos: string[]; bloqueado: boolean; acoes: Acoes }) {
  const [titulo, setTitulo] = useState(c.titulo);
  const [descricao, setDescricao] = useState(c.descricao);
  const [projeto, setProjeto] = useState(c.projeto);
  const [link, setLink] = useState(c.link);
  const [novoItem, setNovoItem] = useState("");
  const [confirmarRemover, setConfirmarRemover] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const p = progresso(c);

  useEffect(() => {
    setTitulo(c.titulo);
    setDescricao(c.descricao);
    setProjeto(c.projeto);
    setLink(c.link);
  }, [c.id, c.titulo, c.descricao, c.projeto, c.link]);

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

  const salvarSeMudou = <K extends keyof NovoCartao>(chave: K, valor: NovoCartao[K], voltar: () => void) => {
    if (valor === c[chave as keyof Cartao]) return;
    if (!acoes.editar({ [chave]: valor } as Partial<NovoCartao>)) voltar();
  };

  const alternarEtiqueta = (id: EtiquetaId) =>
    acoes.editar({ etiquetas: c.etiquetas.includes(id) ? c.etiquetas.filter((e) => e !== id) : [...c.etiquetas, id] });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-[6vh] backdrop-blur-[2px] sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && acoes.fechar()}>
      <div ref={caixa} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="titulo-cartao" className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1C1C1E] text-white shadow-2xl outline-none">
        <div className="flex items-start gap-3 border-b border-white/[0.07] p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <label htmlFor="titulo-cartao" className="sr-only">
              Título
            </label>
            <textarea
              id="titulo-cartao"
              rows={1}
              maxLength={140}
              disabled={bloqueado}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value.replace(/\n/g, " "))}
              onBlur={() => salvarSeMudou("titulo", titulo, () => setTitulo(c.titulo))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
              className="block w-full resize-none rounded-lg bg-transparent px-1 py-0.5 text-[20px] font-semibold leading-snug focus:bg-[#2C2C2E] focus:outline-none [field-sizing:content]"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 px-1 text-[13px] text-white/60">
              na coluna
              <label htmlFor="coluna-cartao" className="sr-only">
                Coluna
              </label>
              <select
                id="coluna-cartao"
                disabled={bloqueado}
                value={c.coluna}
                onChange={(e) => acoes.mover(e.target.value as ColunaId)}
                className="h-8 rounded-md border border-transparent bg-[#2C2C2E] px-2 text-[13px] font-medium text-white"
              >
                {COLUNAS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.titulo}
                  </option>
                ))}
              </select>
              {c.concluidoEm && <span className="text-emerald-300">concluído em {c.concluidoEm.split("-").reverse().join("/")}</span>}
            </div>
          </div>
          <button type="button" onClick={acoes.fechar} aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-4 sm:p-5">
          {/* Etiquetas */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
              <Tag size={14} /> Etiquetas
            </h3>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Etiquetas">
              {ETIQUETAS.map((e) => {
                const ativa = c.etiquetas.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    disabled={bloqueado}
                    aria-pressed={ativa}
                    onClick={() => alternarEtiqueta(e.id)}
                    className={cn("h-8 rounded-md px-2.5 text-[12px] font-semibold transition-opacity", ativa ? "text-white" : "text-white/80 opacity-35 hover:opacity-70")}
                    style={{ background: e.cor }}
                  >
                    {e.nome}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Projeto, data, link */}
          <section className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
            <div>
              <label htmlFor="projeto-cartao" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                Projeto
              </label>
              <input
                id="projeto-cartao"
                list="lista-projetos"
                maxLength={60}
                disabled={bloqueado}
                value={projeto}
                onChange={(e) => setProjeto(e.target.value)}
                onBlur={() => salvarSeMudou("projeto", projeto.trim(), () => setProjeto(c.projeto))}
                placeholder="Ex.: TS Kite Center"
                className={cn(campo, "h-10")}
              />
              <datalist id="lista-projetos">
                {projetos.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                <CalendarDays size={14} /> Data
                {atrasado(c) && <span className="rounded bg-red-500/25 px-1.5 text-[11px] normal-case tracking-normal text-red-200">atrasado</span>}
              </p>
              <div className="flex gap-2">
                <label htmlFor="data-cartao" className="sr-only">
                  Data
                </label>
                <input
                  id="data-cartao"
                  type="date"
                  disabled={bloqueado}
                  value={c.data}
                  onChange={(e) => acoes.editar(e.target.value ? { data: e.target.value } : { data: "", hora: "" })}
                  className={cn(campo, "h-10 [color-scheme:dark]")}
                />
                <label htmlFor="hora-cartao" className="sr-only">
                  Hora
                </label>
                <input
                  id="hora-cartao"
                  type="time"
                  disabled={bloqueado || !c.data}
                  value={c.hora}
                  onChange={(e) => acoes.editar({ hora: e.target.value })}
                  className={cn(campo, "h-10 w-28 shrink-0 [color-scheme:dark] disabled:opacity-40")}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="link-cartao" className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                <Link2 size={14} /> Link
              </label>
              <div className="flex gap-2">
                <input
                  id="link-cartao"
                  type="url"
                  inputMode="url"
                  disabled={bloqueado}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  onBlur={() => salvarSeMudou("link", link.trim(), () => setLink(c.link))}
                  placeholder="https://"
                  className={cn(campo, "h-10")}
                />
                {c.link && (
                  <a href={c.link} target="_blank" rel="noopener noreferrer" aria-label="Abrir link" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Descrição */}
          <section>
            <label htmlFor="descricao-cartao" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
              Descrição
            </label>
            <textarea
              id="descricao-cartao"
              rows={4}
              maxLength={4000}
              disabled={bloqueado}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onBlur={() => salvarSeMudou("descricao", descricao, () => setDescricao(c.descricao))}
              placeholder="Detalhes, contexto, links do vault..."
              className={cn(campo, "py-2.5 leading-relaxed")}
            />
          </section>

          {/* Checklist */}
          <section>
            <h3 className="mb-2 flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
              <span className="flex items-center gap-2">
                <CheckSquare size={14} /> Checklist
              </span>
              {p.total > 0 && (
                <span className="normal-case tracking-normal">
                  {p.feitos}/{p.total}
                </span>
              )}
            </h3>
            {p.total > 0 && (
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={cn("h-full rounded-full transition-[width]", p.feitos === p.total ? "bg-emerald-400" : "bg-white/70")} style={{ width: `${(p.feitos / p.total) * 100}%` }} />
              </div>
            )}
            <ul className="space-y-1">
              {c.checklist.map((item) => (
                <ItemChecklist key={item.id} texto={item.texto} feito={item.feito} bloqueado={bloqueado} alternar={() => acoes.alternarItem(item.id)} editar={(t) => acoes.editarItem(item.id, t)} remover={() => acoes.removerItem(item.id)} />
              ))}
            </ul>
            {!bloqueado && (
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (novoItem.trim() && acoes.adicionarItem(novoItem)) setNovoItem("");
                }}
              >
                <label htmlFor="novo-item" className="sr-only">
                  Novo item
                </label>
                <input id="novo-item" maxLength={200} value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Adicionar um item" className={cn(campo, "h-10")} />
                <button type="submit" disabled={!novoItem.trim()} className="h-10 shrink-0 rounded-lg bg-white/10 px-3 text-[13px] font-semibold hover:bg-white/20 disabled:opacity-40">
                  Adicionar
                </button>
              </form>
            )}
          </section>
        </div>

        {!bloqueado && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] p-4 sm:px-5">
            <button type="button" onClick={acoes.duplicar} className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] text-white/75 hover:bg-white/10 hover:text-white">
              <Copy size={15} /> Duplicar
            </button>
            {confirmarRemover ? (
              <span className="flex items-center gap-2 text-[13px] text-red-200">
                Excluir este cartão?
                <button type="button" onClick={() => setConfirmarRemover(false)} className="h-9 rounded-lg bg-white/10 px-3 text-white">
                  Não
                </button>
                <button type="button" onClick={acoes.remover} className="h-9 rounded-lg bg-red-600 px-3 font-semibold text-white">
                  Excluir
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmarRemover(true)} className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] text-red-300 hover:bg-red-500/15">
                <Trash2 size={15} /> Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemChecklist({ texto, feito, bloqueado, alternar, editar, remover }: { texto: string; feito: boolean; bloqueado: boolean; alternar: () => void; editar: (t: string) => boolean; remover: () => void }) {
  const [valor, setValor] = useState(texto);
  useEffect(() => setValor(texto), [texto]);
  return (
    <li className="group flex items-center gap-2 rounded-lg px-1 hover:bg-white/[0.04]">
      <input type="checkbox" checked={feito} disabled={bloqueado} onChange={alternar} aria-label={`Concluir: ${texto}`} className="h-4 w-4 shrink-0 accent-emerald-400" />
      <input
        value={valor}
        disabled={bloqueado}
        maxLength={200}
        aria-label="Texto do item"
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => valor !== texto && !editar(valor) && setValor(texto)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className={cn("min-h-9 min-w-0 flex-1 rounded bg-transparent px-1.5 text-[14px] focus:bg-[#2C2C2E] focus:outline-none", feito && "text-white/45 line-through")}
      />
      {!bloqueado && (
        <button type="button" onClick={remover} aria-label={`Remover: ${texto}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-white/40 opacity-100 hover:bg-white/10 hover:text-white sm:opacity-0 sm:group-hover:opacity-100">
          <X size={14} />
        </button>
      )}
    </li>
  );
}
