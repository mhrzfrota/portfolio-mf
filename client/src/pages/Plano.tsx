import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Lightbulb, Trash2 } from "lucide-react";
import InternalShell from "@/components/InternalShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  adicionar,
  alternarFeito,
  isPlanoState,
  mover,
  remover,
  semear,
  storageKey,
  type Etapa,
  type Item,
  type PlanoState,
} from "@/features/plano/store";

const FILTROS: { id: Etapa | "todas"; rotulo: string }[] = [
  { id: "todas", rotulo: "Tudo" },
  { id: "fazer", rotulo: "Vou fazer" },
  { id: "ideia", rotulo: "Ideias" },
  { id: "feito", rotulo: "Feito" },
];

const SECOES: { etapa: Etapa; titulo: string; vazio: string }[] = [
  { etapa: "fazer", titulo: "Vou fazer", vazio: "Nada na fila. Promova uma ideia." },
  { etapa: "ideia", titulo: "Ideias", vazio: "Nenhuma ideia anotada." },
  { etapa: "feito", titulo: "Feito", vazio: "Nada concluído ainda." },
];

const dataCurta = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

function lerInicial(userId: string): { state: PlanoState; erro: string } {
  try {
    const bruto = localStorage.getItem(storageKey(userId));
    if (!bruto) return { state: semear(), erro: "" };
    const valor: unknown = JSON.parse(bruto);
    if (!isPlanoState(valor)) throw new Error("invalid");
    return { state: valor, erro: "" };
  } catch {
    return { state: { itens: [] }, erro: "Não foi possível ler a lista salva neste navegador." };
  }
}

export default function Plano() {
  const { user } = useAuth();
  return user ? <PlanoConteudo key={user.id} userId={user.id} /> : null;
}

function PlanoConteudo({ userId }: { userId: string }) {
  const [inicial] = useState(() => lerInicial(userId));
  const [state, setState] = useState(inicial.state);
  const [erro, setErro] = useState(inicial.erro);
  const [filtro, setFiltro] = useState<Etapa | "todas">("todas");
  const [texto, setTexto] = useState("");
  const [etapaNova, setEtapaNova] = useState<Exclude<Etapa, "feito">>("ideia");

  function salvar(proximo: PlanoState) {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(proximo));
      setState(proximo);
      setErro("");
    } catch {
      setErro("Não foi possível salvar. Verifique o espaço ou as permissões do navegador.");
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!texto.trim()) return;
    salvar(adicionar(state, texto, etapaNova));
    setTexto("");
  }

  const contagem = (e: Etapa) => state.itens.filter((i) => i.etapa === e).length;
  const secoes = SECOES.filter((s) => filtro === "todas" || s.etapa === filtro);

  return (
    <InternalShell title="Plano">
      <p className="mt-3 text-sm text-white/70">Ideias que já pensei, o que vou fazer e o que já fiz.</p>

      <form onSubmit={enviar} className="board-glass mt-8 flex flex-col gap-3 rounded-3xl p-3 sm:flex-row sm:items-center">
        <label htmlFor="plano-texto" className="sr-only">Nova anotação</label>
        <input
          id="plano-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Anotar uma ideia ou tarefa"
          maxLength={200}
          className="min-h-12 flex-1 rounded-2xl bg-white/10 px-4 text-[15px] text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        />
        <div className="flex gap-2">
          <div className="habit-glass inline-flex rounded-full p-1" role="group" aria-label="Onde anotar">
            {(["ideia", "fazer"] as const).map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={etapaNova === e}
                onClick={() => setEtapaNova(e)}
                className={cn(
                  "mono-label min-h-10 rounded-full px-4 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                  etapaNova === e ? "bg-white text-black" : "text-white/75 hover:text-white",
                )}
              >
                {e === "ideia" ? "Ideia" : "Vou fazer"}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!texto.trim()}
            className="mono-label min-h-12 rounded-full bg-white px-5 text-[10px] text-black transition-opacity disabled:opacity-40"
          >
            Anotar
          </button>
        </div>
      </form>

      {erro && <p role="alert" className="mt-4 text-sm text-red-200">{erro}</p>}

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filtro === f.id}
            onClick={() => setFiltro(f.id)}
            className={cn(
              "habit-glass mono-label rounded-full px-4 py-2.5 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              filtro === f.id ? "bg-white text-black" : "text-white/80 hover:text-white",
            )}
          >
            {f.rotulo}
            {f.id !== "todas" && <span className="ml-2 opacity-60">{contagem(f.id)}</span>}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-8">
        {secoes.map((s) => {
          const itens = state.itens.filter((i) => i.etapa === s.etapa);
          return (
            <section key={s.etapa} aria-labelledby={`secao-${s.etapa}`}>
              <h2 id={`secao-${s.etapa}`} className="mono-label mb-3 text-[10px] text-white/60">
                {s.titulo} · {itens.length}
              </h2>
              {itens.length ? (
                <ul className="board-glass divide-y divide-white/10 overflow-hidden rounded-3xl">
                  {itens.map((item) => (
                    <Linha
                      key={item.id}
                      item={item}
                      alternar={() => salvar(alternarFeito(state, item.id))}
                      promover={() => salvar(mover(state, item.id, "fazer"))}
                      rebaixar={() => salvar(mover(state, item.id, "ideia"))}
                      apagar={() => salvar(remover(state, item.id))}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/55">{s.vazio}</p>
              )}
            </section>
          );
        })}
      </div>
    </InternalShell>
  );
}

function Linha({
  item,
  alternar,
  promover,
  rebaixar,
  apagar,
}: {
  item: Item;
  alternar: () => void;
  promover: () => void;
  rebaixar: () => void;
  apagar: () => void;
}) {
  const feito = item.etapa === "feito";
  const acao =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
  return (
    <li className="group flex items-center gap-3 px-4 py-3 sm:px-5">
      <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
        <input type="checkbox" checked={feito} onChange={alternar} className="peer sr-only" />
        <span
          aria-hidden
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-white/70",
            feito ? "border-white bg-white text-black" : "border-white/40",
          )}
        >
          {feito && <Check size={15} strokeWidth={3} />}
        </span>
        <span className={cn("min-w-0 text-[15px] leading-snug [overflow-wrap:anywhere]", feito && "text-white/50 line-through")}>
          {item.texto}
        </span>
      </label>
      {feito && item.feitoEm && <span className="mono-label shrink-0 text-[9px] text-white/45">{dataCurta(item.feitoEm)}</span>}
      {item.etapa === "ideia" && (
        <button type="button" onClick={promover} className={acao} aria-label={`Vou fazer: ${item.texto}`} title="Vou fazer">
          <ArrowUpRight size={17} />
        </button>
      )}
      {item.etapa === "fazer" && (
        <button type="button" onClick={rebaixar} className={acao} aria-label={`Voltar para ideias: ${item.texto}`} title="Voltar para ideias">
          <Lightbulb size={16} />
        </button>
      )}
      <button type="button" onClick={apagar} className={acao} aria-label={`Apagar: ${item.texto}`} title="Apagar">
        <Trash2 size={16} />
      </button>
    </li>
  );
}
