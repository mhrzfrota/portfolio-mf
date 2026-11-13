import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Filter, Images, Link2, LoaderCircle, Plus, Send, Trash2, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIMITES, type Automacao, type AutomacaoRascunho, type Conta, type Correspondencia, type Gatilho, type Publicacao } from "@shared/automacoes/tipos";
import type { Loja } from "@/features/automacoes/nuvem";
import Telefone from "./Telefone";
import { Avatar, botao, campo, GATILHOS, Interruptor, primario } from "./pecas";

export const RASCUNHO_VAZIO: AutomacaoRascunho = {
  nome: "", ativa: false, contas: [], gatilhos: ["comentario"], posts: [], palavras: [], correspondencia: "palavra",
  respostasPublicas: [], mensagem: "", botoes: [],
};

const MODOS: { valor: Correspondencia; nome: string; ajuda: string }[] = [
  { valor: "palavra", nome: "Palavra inteira", ajuda: "\"link\" responde a \"quero o link\", mas não a \"linkedin\"." },
  { valor: "contem", nome: "Contém", ajuda: "Responde se o trecho aparecer em qualquer lugar do texto." },
  { valor: "exata", nome: "Texto exato", ajuda: "Só responde se a pessoa escrever exatamente isso." },
];

function erros(r: AutomacaoRascunho) {
  const lista: string[] = [];
  if (!r.nome.trim()) lista.push("Dê um nome para a automação.");
  if (!r.contas.length) lista.push("Escolha pelo menos uma conta.");
  if (!r.gatilhos.length) lista.push("Escolha pelo menos um gatilho.");
  if (!r.mensagem.trim()) lista.push("Escreva a mensagem do Direct.");
  r.botoes.forEach((b, i) => {
    if (!b.titulo.trim()) lista.push(`Botão ${i + 1}: falta o texto.`);
    if (!/^https:\/\/\S+\.\S+/.test(b.url.trim())) lista.push(`Botão ${i + 1}: o link precisa começar com https://.`);
  });
  return lista;
}

function Passo({ numero, icone, titulo, resumo, cor, ultimo, children }: { numero: number; icone: ReactNode; titulo: string; resumo: string; cor: string; ultimo?: boolean; children: ReactNode }) {
  return (
    <section className="relative pl-[52px]">
      {!ultimo && <span className="absolute bottom-[-22px] left-[19px] top-11 w-px bg-gradient-to-b from-white/25 to-white/5" />}
      <span className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: `${cor}26`, color: cor, boxShadow: `inset 0 0 0 1px ${cor}55` }}>{icone}</span>
      <div className="rounded-2xl border border-white/[0.08] bg-[#121318] p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: cor }}>Passo {numero}</p>
        <h3 className="mt-0.5 text-[17px] font-semibold tracking-tight">{titulo}</h3>
        <p className="mt-0.5 text-[13px] text-white/50">{resumo}</p>
        <div className="mt-4 space-y-4">{children}</div>
      </div>
    </section>
  );
}

function Rotulo({ children, dica }: { children: ReactNode; dica?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-[12.5px] font-medium text-white/75">{children}</span>
      {dica && <span className="text-[11.5px] text-white/35">{dica}</span>}
    </div>
  );
}

export default function Editor({ original, contas, loja, aoFechar, aoSalvar }: {
  original: Automacao | null;
  contas: Conta[];
  loja: Loja;
  aoFechar: () => void;
  aoSalvar: (rascunho: AutomacaoRascunho) => Promise<string | null>;
}) {
  const [r, setR] = useState<AutomacaoRascunho>(() => (original ? { ...original } : { ...RASCUNHO_VAZIO, contas: contas.filter((c) => c.ativa).slice(0, 1).map((c) => c.id) }));
  const [palavra, setPalavra] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [tentou, setTentou] = useState(false);
  const [previa, setPrevia] = useState<Gatilho>(r.gatilhos[0] ?? "comentario");
  const [posts, setPosts] = useState<{ tipo: "fechado" | "carregando" | "ok" | "erro"; lista: Publicacao[]; mensagem?: string }>({ tipo: "fechado", lista: [] });
  const mudar = (campos: Partial<AutomacaoRascunho>) => setR((atual) => ({ ...atual, ...campos }));
  const pendencias = useMemo(() => erros(r), [r]);
  const contaPrevia = contas.find((c) => r.contas.includes(c.id)) ?? null;
  const temComentario = r.gatilhos.includes("comentario");

  useEffect(() => { if (!r.gatilhos.includes(previa) && r.gatilhos[0]) setPrevia(r.gatilhos[0]); }, [r.gatilhos, previa]);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    window.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", tecla); document.body.style.overflow = antes; };
  }, [aoFechar]);

  function alternar<T>(lista: T[], item: T) { return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item]; }
  function juntarPalavra() {
    const novas = palavra.split(",").map((p) => p.trim().slice(0, LIMITES.palavra)).filter(Boolean);
    if (novas.length) mudar({ palavras: Array.from(new Set([...r.palavras, ...novas])).slice(0, LIMITES.palavras) });
    setPalavra("");
  }
  async function abrirPosts() {
    const conta = r.contas[0];
    if (!conta) { setPosts({ tipo: "erro", lista: [], mensagem: "Escolha uma conta primeiro." }); return; }
    setPosts({ tipo: "carregando", lista: [] });
    const resposta = await loja.publicacoes(conta);
    setPosts(resposta.tipo === "ok" ? { tipo: "ok", lista: resposta.valor } : { tipo: "erro", lista: [], mensagem: resposta.tipo === "erro" ? resposta.mensagem : "Não foi possível ler as publicações." });
  }
  async function salvar() {
    setTentou(true);
    if (pendencias.length || salvando) return;
    setSalvando(true); setAviso("");
    const falha = await aoSalvar({ ...r, nome: r.nome.trim(), mensagem: r.mensagem.trim(), respostasPublicas: r.respostasPublicas.map((x) => x.trim()).filter(Boolean), botoes: r.botoes.map((b) => ({ titulo: b.titulo.trim(), url: b.url.trim() })) });
    setSalvando(false);
    if (falha) setAviso(falha);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#08090C]" role="dialog" aria-modal="true" aria-label={original ? "Editar automação" : "Nova automação"}>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.07] px-3 sm:px-6">
        <button type="button" onClick={aoFechar} className="grid h-9 w-9 place-items-center rounded-xl text-white/70 hover:bg-white/[0.08] hover:text-white" aria-label="Fechar"><X size={19} /></button>
        <input
          value={r.nome}
          onChange={(e) => mudar({ nome: e.target.value.slice(0, LIMITES.nome) })}
          placeholder="Nome da automação"
          className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold tracking-tight outline-none placeholder:text-white/30"
          autoFocus={!original}
        />
        <label className="hidden items-center gap-2.5 text-[13px] text-white/60 sm:flex">
          {r.ativa ? "Ligada" : "Desligada"}
          <Interruptor ligado={r.ativa} aoMudar={(ativa) => mudar({ ativa })} rotulo="Ligar a automação" />
        </label>
        <button type="button" onClick={salvar} disabled={salvando} className={cn(botao, primario)}>
          {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} Salvar
        </button>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-h-0 overflow-y-auto px-3 py-6 sm:px-8">
          <div className="mx-auto max-w-2xl space-y-[22px]">
            {(aviso || (tentou && pendencias.length > 0)) && (
              <div className="rounded-xl border border-rose-400/25 bg-rose-400/[0.08] px-4 py-3 text-[13px] text-rose-200" role="alert">
                {aviso || <ul className="list-inside list-disc space-y-0.5">{pendencias.map((p) => <li key={p}>{p}</li>)}</ul>}
              </div>
            )}

            <Passo numero={1} icone={<Zap size={19} />} cor="#F59E0B" titulo="Quando alguém…" resumo="Escolha o que dispara e em quais contas.">
              <div>
                <Rotulo>Gatilho</Rotulo>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(GATILHOS) as Gatilho[]).map((g) => {
                    const info = GATILHOS[g]; const Icone = info.icone; const ligado = r.gatilhos.includes(g);
                    return (
                      <button key={g} type="button" aria-pressed={ligado} onClick={() => mudar({ gatilhos: alternar(r.gatilhos, g) })}
                        className={cn("rounded-xl border p-3 text-left transition-colors", ligado ? "border-transparent" : "border-white/[0.1] hover:bg-white/[0.04]")}
                        style={ligado ? { background: `${info.cor}1A`, boxShadow: `inset 0 0 0 1.5px ${info.cor}` } : undefined}>
                        <Icone size={18} style={{ color: info.cor }} />
                        <p className="mt-2 text-[13.5px] font-semibold">{info.nome}</p>
                        <p className="text-[12px] leading-snug text-white/50">{info.frase}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Rotulo dica={`${r.contas.length} escolhida${r.contas.length === 1 ? "" : "s"}`}>Nas contas</Rotulo>
                {contas.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/[0.14] px-3.5 py-3 text-[13px] text-white/50">Nenhuma conta ainda. Feche e sincronize em Contas.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {contas.map((c) => {
                      const ligado = r.contas.includes(c.id);
                      return (
                        <button key={c.id} type="button" aria-pressed={ligado} onClick={() => mudar({ contas: alternar(r.contas, c.id) })}
                          className={cn("flex items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-[13px] transition-colors", ligado ? "border-[#4d63ff] bg-[#0C2AFE]/20 text-white" : "border-white/[0.1] text-white/60 hover:bg-white/[0.05]")}>
                          <Avatar conta={c} tamanho={28} apagado={!ligado} />
                          @{c.usuario}
                          {!c.ativa && <span className="rounded-full bg-amber-400/15 px-1.5 text-[10.5px] text-amber-300">desligada</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {temComentario && (
                <div>
                  <Rotulo dica={r.posts.length ? `${r.posts.length} escolhida${r.posts.length === 1 ? "" : "s"}` : "todas"}>Em quais publicações</Rotulo>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => { mudar({ posts: [] }); setPosts({ tipo: "fechado", lista: [] }); }} className={cn(botao, !r.posts.length && posts.tipo === "fechado" && "border-[#4d63ff] bg-[#0C2AFE]/20")}>Qualquer publicação</button>
                    <button type="button" onClick={abrirPosts} className={cn(botao, (r.posts.length > 0 || posts.tipo !== "fechado") && "border-[#4d63ff] bg-[#0C2AFE]/20")}><Images size={15} /> Escolher publicações</button>
                  </div>
                  {posts.tipo === "carregando" && <p className="mt-3 flex items-center gap-2 text-[13px] text-white/50"><LoaderCircle size={14} className="animate-spin" /> Lendo as publicações…</p>}
                  {posts.tipo === "erro" && <p className="mt-3 text-[13px] text-rose-300">{posts.mensagem}</p>}
                  {posts.tipo === "ok" && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {posts.lista.slice(0, LIMITES.posts).map((p) => {
                        const ligado = r.posts.includes(p.id);
                        return (
                          <button key={p.id} type="button" aria-pressed={ligado} onClick={() => mudar({ posts: alternar(r.posts, p.id) })} title={p.legenda ?? ""}
                            className={cn("group relative overflow-hidden rounded-xl border text-left", ligado ? "border-[#4d63ff] ring-2 ring-[#0C2AFE]/60" : "border-white/[0.1]")}>
                            {/* Miniatura na proporção que vier: o card acompanha a foto. */}
                            {p.miniatura ? <img src={p.miniatura} alt="" className="block h-auto w-full" referrerPolicy="no-referrer" loading="lazy" /> : <span className="block aspect-square bg-gradient-to-br from-white/[0.1] to-white/[0.02]" />}
                            <span className="block truncate px-2 py-1.5 text-[11.5px] text-white/70">{p.legenda || "Sem legenda"}</span>
                            {ligado && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#0C2AFE]"><Check size={12} /></span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Passo>

            <Passo numero={2} icone={<Filter size={18} />} cor="#38BDF8" titulo="E o texto tiver…" resumo="Sem palavra-chave, qualquer texto dispara.">
              <div>
                <Rotulo dica={`${r.palavras.length}/${LIMITES.palavras}`}>Palavras-chave</Rotulo>
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] p-2 focus-within:border-[#4d63ff]">
                  {r.palavras.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 rounded-lg bg-[#38BDF8]/15 py-1 pl-2.5 pr-1 text-[13px] text-[#7dd3fc]">
                      {p}
                      <button type="button" onClick={() => mudar({ palavras: r.palavras.filter((x) => x !== p) })} className="grid h-5 w-5 place-items-center rounded-md hover:bg-white/10" aria-label={`Tirar ${p}`}><X size={12} /></button>
                    </span>
                  ))}
                  <input value={palavra} onChange={(e) => setPalavra(e.target.value)} onBlur={juntarPalavra}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); juntarPalavra(); } if (e.key === "Backspace" && !palavra && r.palavras.length) mudar({ palavras: r.palavras.slice(0, -1) }); }}
                    placeholder={r.palavras.length ? "Outra palavra" : "Ex.: link, quero, preço (Enter para juntar)"}
                    className="min-w-[160px] flex-1 bg-transparent px-1.5 py-1 text-[14px] outline-none placeholder:text-white/30" />
                </div>
              </div>
              <div>
                <Rotulo>Como comparar</Rotulo>
                <div className="grid gap-2 sm:grid-cols-3">
                  {MODOS.map((m) => (
                    <button key={m.valor} type="button" aria-pressed={r.correspondencia === m.valor} onClick={() => mudar({ correspondencia: m.valor })}
                      className={cn("rounded-xl border p-3 text-left transition-colors", r.correspondencia === m.valor ? "border-[#38BDF8] bg-[#38BDF8]/10" : "border-white/[0.1] hover:bg-white/[0.04]")}>
                      <p className="text-[13.5px] font-semibold">{m.nome}</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-white/50">{m.ajuda}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Passo>

            <Passo numero={3} icone={<Send size={17} />} cor="#34D399" titulo="Então responder" resumo="O Direct sai na hora. A resposta pública é opcional." ultimo>
              {temComentario && (
                <div>
                  <Rotulo dica="uma é sorteada a cada resposta">Resposta pública no comentário</Rotulo>
                  <div className="space-y-2">
                    {r.respostasPublicas.map((texto, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={texto} onChange={(e) => mudar({ respostasPublicas: r.respostasPublicas.map((x, j) => (j === i ? e.target.value.slice(0, LIMITES.respostaPublica) : x)) })} placeholder="Ex.: Te mandei no Direct!" className={campo} />
                        <button type="button" onClick={() => mudar({ respostasPublicas: r.respostasPublicas.filter((_, j) => j !== i) })} className={cn(botao, "px-2.5")} aria-label="Tirar variação"><Trash2 size={15} /></button>
                      </div>
                    ))}
                    {r.respostasPublicas.length < LIMITES.respostasPublicas && (
                      <button type="button" onClick={() => mudar({ respostasPublicas: [...r.respostasPublicas, ""] })} className={cn(botao, "border-dashed text-white/70")}><Plus size={15} /> {r.respostasPublicas.length ? "Outra variação" : "Responder em público também"}</button>
                    )}
                  </div>
                </div>
              )}
              <div>
                <Rotulo dica={`${r.mensagem.length}/${LIMITES.mensagem}`}>Mensagem do Direct</Rotulo>
                <textarea value={r.mensagem} onChange={(e) => mudar({ mensagem: e.target.value.slice(0, LIMITES.mensagem) })} rows={4} placeholder="Oi {usuario}! Aqui está o que você pediu." className={cn(campo, "resize-y leading-relaxed")} />
                <button type="button" onClick={() => mudar({ mensagem: `${r.mensagem}{usuario}`.slice(0, LIMITES.mensagem) })} className="mt-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/65 hover:bg-white/[0.1]">+ nome da pessoa <code className="text-white/40">{"{usuario}"}</code></button>
              </div>
              <div>
                <Rotulo dica={`até ${LIMITES.botoes}`}>Botões de link</Rotulo>
                <div className="space-y-2">
                  {r.botoes.map((b, i) => (
                    <div key={i} className="grid gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5 sm:grid-cols-[1fr_1.6fr_auto]">
                      <input value={b.titulo} onChange={(e) => mudar({ botoes: r.botoes.map((x, j) => (j === i ? { ...x, titulo: e.target.value.slice(0, LIMITES.botaoTitulo) } : x)) })} placeholder="Texto do botão" className={campo} />
                      <input value={b.url} onChange={(e) => mudar({ botoes: r.botoes.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://" inputMode="url" className={campo} />
                      <button type="button" onClick={() => mudar({ botoes: r.botoes.filter((_, j) => j !== i) })} className={cn(botao, "px-2.5")} aria-label="Tirar botão"><Trash2 size={15} /></button>
                    </div>
                  ))}
                  {r.botoes.length < LIMITES.botoes && (
                    <button type="button" onClick={() => mudar({ botoes: [...r.botoes, { titulo: "", url: "" }] })} className={cn(botao, "border-dashed text-white/70")}><Link2 size={15} /> Juntar botão</button>
                  )}
                </div>
              </div>
            </Passo>

            {/* No celular a prévia vem depois dos passos; no computador fica ao lado. */}
            <div className="pt-2 lg:hidden">
              <Telefone rascunho={r} conta={contaPrevia} gatilho={previa} />
            </div>
          </div>
        </div>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-white/[0.07] bg-[radial-gradient(120%_60%_at_50%_0%,rgba(12,42,254,0.16),transparent_70%)] px-6 py-6 lg:block">
          {r.gatilhos.length > 1 && (
            <div className="mx-auto mb-4 flex w-fit rounded-xl bg-white/[0.06] p-1">
              {r.gatilhos.map((g) => (
                <button key={g} type="button" onClick={() => setPrevia(g)} className={cn("rounded-lg px-3 py-1.5 text-[12.5px] font-medium", previa === g ? "bg-white/[0.14] text-white" : "text-white/55 hover:text-white")}>{GATILHOS[g].nome}</button>
              ))}
            </div>
          )}
          <Telefone rascunho={r} conta={contaPrevia} gatilho={previa} />
        </aside>
      </div>
    </div>
  );
}
