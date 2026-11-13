import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowRight, CircleAlert, Copy, LoaderCircle, Plus, RefreshCw, Sparkles, Trash2, Users, Workflow } from "lucide-react";
import InternalShell from "@/components/InternalShell";
import Editor from "@/components/automacoes/Editor";
import { Avatar, botao, GATILHOS, Interruptor, painel, primario, quando, SeloGatilho, SITUACOES, Vazio } from "@/components/automacoes/pecas";
import { useAuth } from "@/contexts/AuthContext";
import { lojaDemo } from "@/features/automacoes/demo";
import { lojaSupabase, type Loja, type Retrato } from "@/features/automacoes/nuvem";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Automacao, AutomacaoRascunho, Conta, Evento, SituacaoZernio } from "@shared/automacoes/tipos";

const ABAS = [
  { id: "automacoes", nome: "Automações", icone: Workflow },
  { id: "atividade", nome: "Atividade", icone: Activity },
  { id: "contas", nome: "Contas", icone: Users },
] as const;
type Aba = (typeof ABAS)[number]["id"];

export default function Automacoes() {
  const { user } = useAuth();
  const loja = useMemo(() => (supabase && user ? lojaSupabase(supabase as never, user.id) : null), [user]);
  if (!loja) return <InternalShell title="Automações"><Vazio icone={CircleAlert} titulo="Supabase não configurado">Faltam as variáveis do Supabase neste ambiente.</Vazio></InternalShell>;
  return <Tela loja={loja} />;
}

/** Só no pnpm dev: a tela com dados de demonstração, sem login e sem enviar nada. */
export function AutomacoesPrevia() {
  const loja = useMemo(() => lojaDemo(), []);
  return <Tela loja={loja} demo />;
}

function Numero({ valor, rotulo, cor }: { valor: number | string; rotulo: string; cor?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
      <p className="text-[26px] font-semibold leading-none tracking-tight tabular-nums" style={cor ? { color: cor } : undefined}>{valor}</p>
      <p className="mt-1.5 truncate text-[12px] text-white/50">{rotulo}</p>
    </div>
  );
}

function Tela({ loja, demo }: { loja: Loja; demo?: boolean }) {
  const [retrato, setRetrato] = useState<Retrato | null>(null);
  const [aba, setAba] = useState<Aba>("automacoes");
  const [filtroConta, setFiltroConta] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ original: Automacao | null } | null>(null);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [zernio, setZernio] = useState<SituacaoZernio | null>(null);
  const [excluir, setExcluir] = useState<Automacao | null>(null);
  const seq = useRef(0);

  const recarregar = useCallback(async () => {
    const minha = ++seq.current;
    const r = await loja.ler().catch(() => ({ tipo: "erro", mensagem: "Falha de conexão." }) as Retrato);
    if (minha === seq.current) setRetrato(r);
  }, [loja]);

  useEffect(() => {
    void recarregar();
    const timer = window.setInterval(() => { if (!document.hidden) void recarregar(); }, 15000);
    return () => window.clearInterval(timer);
  }, [recarregar]);
  useEffect(() => { void loja.situacao().then((r) => { if (r.tipo === "ok") setZernio(r.valor); }); }, [loja]);
  useEffect(() => { if (!aviso) return; const t = window.setTimeout(() => setAviso(""), 6000); return () => window.clearTimeout(t); }, [aviso]);

  const contas: Conta[] = retrato?.tipo === "ok" ? retrato.contas : [];
  const automacoes: Automacao[] = retrato?.tipo === "ok" ? retrato.automacoes : [];
  const eventos: Evento[] = retrato?.tipo === "ok" ? retrato.eventos : [];
  const contaPorId = useMemo(() => new Map(contas.map((c) => [c.id, c])), [contas]);
  const nomePorId = useMemo(() => new Map(automacoes.map((a) => [a.id, a.nome])), [automacoes]);
  const visiveis = filtroConta ? automacoes.filter((a) => a.contas.includes(filtroConta)) : automacoes;
  const eventosVisiveis = filtroConta ? eventos.filter((e) => e.contaId === filtroConta) : eventos;
  const seteDias = Date.now() - 7 * 864e5;
  const enviadosPor = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const e of eventos) if (e.situacao === "enviado" && e.automacaoId && new Date(e.criadoEm).getTime() >= seteDias) mapa.set(e.automacaoId, (mapa.get(e.automacaoId) ?? 0) + 1);
    return mapa;
  }, [eventos, seteDias]);
  const enviados7 = eventos.filter((e) => e.situacao === "enviado" && new Date(e.criadoEm).getTime() >= seteDias).length;
  const problemas7 = eventos.filter((e) => (e.situacao === "falhou" || e.situacao === "incerto") && new Date(e.criadoEm).getTime() >= seteDias).length;

  async function salvar(rascunho: AutomacaoRascunho) {
    const original = editor?.original ?? null;
    const r = original ? await loja.salvar(original.id, original.versao, rascunho) : await loja.criar(rascunho);
    if (r.tipo === "conflito") return "Esta automação mudou em outra aba. Feche e abra de novo.";
    if (r.tipo === "erro") return r.mensagem;
    setEditor(null); setAviso(original ? "Automação salva." : "Automação criada."); await recarregar();
    return null;
  }
  async function ligar(a: Automacao, ativa: boolean) {
    setRetrato((atual) => (atual?.tipo === "ok" ? { ...atual, automacoes: atual.automacoes.map((x) => (x.id === a.id ? { ...x, ativa } : x)) } : atual));
    const r = await loja.ligar(a.id, a.versao, ativa);
    if (r.tipo !== "ok") setAviso(r.tipo === "conflito" ? "A automação mudou em outra aba. Atualizei a lista." : r.mensagem);
    await recarregar();
  }
  async function duplicar(a: Automacao) {
    const { id: _id, criadaEm: _c, atualizadaEm: _a, versao: _v, ...resto } = a;
    const r = await loja.criar({ ...resto, nome: `${a.nome} (cópia)`.slice(0, 80), ativa: false });
    setAviso(r.tipo === "ok" ? "Cópia criada, desligada." : r.tipo === "erro" ? r.mensagem : "Não foi possível copiar.");
    await recarregar();
  }
  async function confirmarExclusao() {
    if (!excluir) return;
    const r = await loja.excluir(excluir.id);
    setExcluir(null); setAviso(r.tipo === "ok" ? "Automação excluída." : r.tipo === "erro" ? r.mensagem : "Não foi possível excluir.");
    await recarregar();
  }
  async function sincronizar() {
    setOcupado("contas");
    const r = await loja.sincronizarContas();
    setOcupado(""); setAviso(r.tipo === "ok" ? `${r.valor.length} conta${r.valor.length === 1 ? "" : "s"} no Zernio.` : r.tipo === "erro" ? r.mensagem : "Não foi possível sincronizar.");
    await recarregar();
  }
  async function ligarConta(c: Conta, ativa: boolean) {
    setRetrato((atual) => (atual?.tipo === "ok" ? { ...atual, contas: atual.contas.map((x) => (x.id === c.id ? { ...x, ativa } : x)) } : atual));
    const r = await loja.ligarConta(c.id, ativa);
    if (r.tipo !== "ok") setAviso(r.tipo === "erro" ? r.mensagem : "Não foi possível alterar a conta.");
    await recarregar();
  }
  async function registrar() {
    setOcupado("webhook");
    const r = await loja.registrarWebhook();
    setOcupado("");
    if (r.tipo === "ok") { setZernio(r.valor); setAviso(r.valor.webhookRegistrado ? "Zernio ligado a esta plataforma." : "O Zernio não confirmou o registro."); }
    else setAviso(r.tipo === "erro" ? r.mensagem : "Não foi possível ligar o Zernio.");
  }

  const pronto = zernio?.chaveConfigurada && zernio.segredoConfigurado && zernio.webhookRegistrado;

  return (
    <InternalShell title="Automações">
      {/* Cabeçalho */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101116] p-5 sm:p-7">
        <span className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#0C2AFE]/35 blur-[90px]" />
        <span className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-[#DD2A7B]/15 blur-[100px]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[26px] font-semibold tracking-tight sm:text-[30px]">Automações</h1>
              {demo && <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11.5px] font-medium text-amber-300">Demonstração</span>}
              {zernio && (
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", pronto ? "bg-emerald-400/12 text-emerald-300" : "bg-amber-400/12 text-amber-300")}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", pronto ? "bg-emerald-400" : "bg-amber-400")} />
                  {pronto ? "Zernio ligado" : "Zernio por ligar"}
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-white/55">Alguém comenta, manda Direct ou responde um story, e a resposta sai sozinha. Em todas as suas contas.</p>
          </div>
          <button type="button" onClick={() => setEditor({ original: null })} disabled={retrato?.tipo !== "ok"} className={cn(botao, primario, "min-h-11 px-4")}><Plus size={17} /> Nova automação</button>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Numero valor={automacoes.filter((a) => a.ativa).length} rotulo={`de ${automacoes.length} automações ligadas`} />
          <Numero valor={contas.filter((c) => c.ativa).length} rotulo={`de ${contas.length} contas respondendo`} />
          <Numero valor={enviados7} rotulo="respostas em 7 dias" cor="#34D399" />
          <Numero valor={problemas7} rotulo="falhas ou incertas em 7 dias" cor={problemas7 ? "#FBBF24" : undefined} />
        </div>
      </section>

      {aviso && <p className="mt-3 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-[13.5px]" role="status">{aviso}</p>}

      {/* Contas (filtro) e abas */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <nav aria-label="Seções" className="flex rounded-xl bg-white/[0.06] p-1">
          {ABAS.map(({ id, nome, icone: Icone }) => (
            <button key={id} type="button" onClick={() => setAba(id)} aria-current={aba === id ? "page" : undefined}
              className={cn("flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-medium transition-colors", aba === id ? "bg-white/[0.14] text-white" : "text-white/60 hover:text-white")}>
              <Icone size={15} /> {nome}
            </button>
          ))}
        </nav>
        {contas.length > 0 && aba !== "contas" && (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            <button type="button" onClick={() => setFiltroConta(null)} className={cn("h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-medium", !filtroConta ? "border-white/25 bg-white/[0.12] text-white" : "border-white/[0.1] text-white/55 hover:text-white")}>Todas</button>
            {contas.map((c) => (
              <button key={c.id} type="button" onClick={() => setFiltroConta(filtroConta === c.id ? null : c.id)} aria-pressed={filtroConta === c.id}
                className={cn("flex h-9 shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-[13px]", filtroConta === c.id ? "border-[#4d63ff] bg-[#0C2AFE]/20 text-white" : "border-white/[0.1] text-white/60 hover:text-white")}>
                <Avatar conta={c} tamanho={26} apagado={!c.ativa} /> @{c.usuario}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        {retrato === null && <div className="grid place-items-center py-24 text-white/50"><LoaderCircle className="animate-spin" /></div>}
        {retrato?.tipo === "erro" && <Vazio icone={CircleAlert} titulo="Não deu para abrir">{retrato.mensagem}</Vazio>}
        {retrato?.tipo === "sem-tabela" && (
          <Vazio icone={Sparkles} titulo="Falta criar as tabelas">
            Rode o arquivo <code className="text-white/80">supabase/migrations/0008_automacoes.sql</code> no SQL Editor do Supabase e recarregue esta página.
          </Vazio>
        )}

        {retrato?.tipo === "ok" && aba === "automacoes" && (
          visiveis.length === 0 ? (
            <Vazio icone={Workflow} titulo={automacoes.length ? "Nenhuma automação nesta conta" : "Crie a primeira automação"}>
              {automacoes.length ? "Troque o filtro ou crie uma para esta conta." : "Exemplo: quem comentar LINK no post recebe o catálogo no Direct."}
            </Vazio>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {visiveis.map((a) => (
                <article key={a.id} className={cn(painel, "group flex flex-col p-4 transition-colors hover:border-white/[0.16] sm:p-5", !a.ativa && "opacity-70")}>
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => setEditor({ original: a })} className="min-w-0 flex-1 text-left">
                      <h2 className="truncate text-[16.5px] font-semibold tracking-tight">{a.nome}</h2>
                      <p className="mt-0.5 text-[12px] text-white/40">Editada {quando(a.atualizadaEm)}</p>
                    </button>
                    <Interruptor ligado={a.ativa} aoMudar={(v) => void ligar(a, v)} rotulo={a.ativa ? "Desligar" : "Ligar"} />
                  </div>

                  {/* O fluxo em miniatura */}
                  <button type="button" onClick={() => setEditor({ original: a })} className="mt-4 flex flex-1 flex-col gap-2 text-left">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {a.gatilhos.map((g) => <SeloGatilho key={g} gatilho={g} />)}
                      {a.posts.length > 0 && <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] text-white/60">{a.posts.length} publicaç{a.posts.length === 1 ? "ão" : "ões"}</span>}
                    </div>
                    <div className="flex items-start gap-2 pl-1">
                      <ArrowRight size={14} className="mt-1.5 shrink-0 text-white/25" />
                      <div className="flex flex-wrap gap-1.5">
                        {a.palavras.length === 0 ? <span className="rounded-lg bg-white/[0.06] px-2 py-1 text-[12.5px] text-white/55">qualquer texto</span>
                          : a.palavras.slice(0, 5).map((p) => <span key={p} className="rounded-lg bg-[#38BDF8]/12 px-2 py-1 text-[12.5px] text-[#7dd3fc]">{p}</span>)}
                        {a.palavras.length > 5 && <span className="px-1 py-1 text-[12.5px] text-white/40">+{a.palavras.length - 5}</span>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pl-1">
                      <ArrowRight size={14} className="mt-2.5 shrink-0 text-white/25" />
                      <div className="min-w-0 flex-1 overflow-hidden rounded-[18px] rounded-bl-md bg-[#1c1d23]">
                        <p className="line-clamp-2 px-3.5 py-2.5 text-[13px] leading-snug text-white/85">{a.mensagem}</p>
                        {a.botoes.map((b, i) => <span key={i} className="block truncate border-t border-white/[0.07] px-3.5 py-2 text-center text-[12.5px] font-semibold text-[#5AA9FF]">{b.titulo}</span>)}
                      </div>
                    </div>
                  </button>

                  <footer className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-3.5">
                    <div className="flex -space-x-2">
                      {a.contas.slice(0, 4).map((id) => { const c = contaPorId.get(id); return c ? <Avatar key={id} conta={c} tamanho={28} apagado={!c.ativa} /> : null; })}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/50">
                      <b className="font-semibold tabular-nums text-emerald-300">{enviadosPor.get(a.id) ?? 0}</b> envios em 7 dias
                    </span>
                    <button type="button" onClick={() => void duplicar(a)} className="grid h-8 w-8 place-items-center rounded-lg text-white/45 hover:bg-white/[0.08] hover:text-white" title="Duplicar" aria-label="Duplicar"><Copy size={15} /></button>
                    <button type="button" onClick={() => setExcluir(a)} className="grid h-8 w-8 place-items-center rounded-lg text-white/45 hover:bg-rose-400/15 hover:text-rose-300" title="Excluir" aria-label="Excluir"><Trash2 size={15} /></button>
                  </footer>
                </article>
              ))}
            </div>
          )
        )}

        {retrato?.tipo === "ok" && aba === "atividade" && (
          eventosVisiveis.length === 0 ? <Vazio icone={Activity} titulo="Nada por aqui ainda">Cada comentário, Direct e resposta de story que chegar aparece nesta lista, com o que foi feito.</Vazio> : (
            <ul className={cn(painel, "divide-y divide-white/[0.06] overflow-hidden")}>
              {eventosVisiveis.map((e) => {
                const conta = contaPorId.get(e.contaId); const s = SITUACOES[e.situacao]; const Icone = GATILHOS[e.tipo].icone;
                return (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${GATILHOS[e.tipo].cor}1F`, color: GATILHOS[e.tipo].cor }}><Icone size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px]"><b className="font-semibold">{e.usuario ? `@${e.usuario}` : "Alguém"}</b> <span className="text-white/60">{e.texto ? `"${e.texto}"` : GATILHOS[e.tipo].frase}</span></p>
                      <p className="truncate text-[12px] text-white/40">
                        {conta ? `@${conta.usuario}` : "conta removida"} · {e.automacaoId ? nomePorId.get(e.automacaoId) ?? "automação excluída" : "nenhuma automação combinou"}{e.erro ? ` · ${e.erro}` : ""}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1", s.classe)}>{s.nome}</span>
                    <time className="hidden w-24 shrink-0 text-right text-[12px] text-white/40 sm:block">{quando(e.criadoEm)}</time>
                  </li>
                );
              })}
            </ul>
          )
        )}

        {retrato?.tipo === "ok" && aba === "contas" && (
          <div className="space-y-3">
            <div className={cn(painel, "flex flex-wrap items-center gap-3 p-4")}>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold">Ligação com o Zernio</p>
                <p className="mt-0.5 text-[13px] text-white/50">
                  {!zernio ? "Conferindo…" : !zernio.chaveConfigurada ? "Falta a variável ZERNIO_API_KEY no servidor." : !zernio.segredoConfigurado ? "Falta a variável AUTOMACOES_WEBHOOK_SECRET no servidor." : zernio.webhookRegistrado ? "O Zernio avisa esta plataforma a cada comentário e Direct." : "Falta registrar o aviso (webhook) no Zernio."}
                </p>
              </div>
              <button type="button" onClick={() => void sincronizar()} disabled={!!ocupado} className={botao}>{ocupado === "contas" ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />} Sincronizar contas</button>
              {zernio?.chaveConfigurada && zernio.segredoConfigurado && !zernio.webhookRegistrado && (
                <button type="button" onClick={() => void registrar()} disabled={!!ocupado} className={cn(botao, primario)}>{ocupado === "webhook" && <LoaderCircle size={15} className="animate-spin" />} Ligar o Zernio</button>
              )}
            </div>
            {contas.length === 0 ? <Vazio icone={Users} titulo="Nenhuma conta ainda">Conecte as contas do Instagram no Zernio e toque em Sincronizar contas.</Vazio> : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {contas.map((c) => {
                  const usadas = automacoes.filter((a) => a.contas.includes(c.id)).length;
                  return (
                    <div key={c.id} className={cn(painel, "flex items-center gap-3.5 p-4")}>
                      <Avatar conta={c} tamanho={52} apagado={!c.ativa} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold">@{c.usuario}</p>
                        <p className="truncate text-[12.5px] text-white/50">{c.nome ?? "Instagram"} · {usadas} automaç{usadas === 1 ? "ão" : "ões"}</p>
                        <p className={cn("mt-1 text-[12px]", c.ativa ? "text-emerald-300" : "text-white/40")}>{c.ativa ? "Respondendo por aqui" : "Desligada: esta plataforma não responde"}</p>
                      </div>
                      <Interruptor ligado={c.ativa} aoMudar={(v) => void ligarConta(c, v)} rotulo={c.ativa ? "Parar de responder nesta conta" : "Responder nesta conta"} />
                    </div>
                  );
                })}
              </div>
            )}
            <p className="px-1 text-[12.5px] leading-relaxed text-white/40">Conta que já tem resposta automática em outro sistema deve ficar desligada aqui, para a pessoa não receber duas respostas.</p>
          </div>
        )}
      </div>

      {editor && <Editor original={editor.original} contas={contas} loja={loja} aoFechar={() => setEditor(null)} aoSalvar={salvar} />}

      {excluir && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" onClick={() => setExcluir(null)}>
          <div className={cn(painel, "w-full max-w-sm p-5")} onClick={(e) => e.stopPropagation()}>
            <p className="text-[16px] font-semibold">Excluir "{excluir.nome}"?</p>
            <p className="mt-1.5 text-[13.5px] text-white/55">Ela para de responder na hora. O histórico da atividade continua.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setExcluir(null)} className={botao}>Cancelar</button>
              <button type="button" onClick={() => void confirmarExclusao()} className={cn(botao, "border-rose-500 bg-rose-500 hover:bg-rose-400")}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </InternalShell>
  );
}
