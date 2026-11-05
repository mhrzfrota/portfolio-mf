import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Cloud, Copy, ExternalLink, LoaderCircle, Pause, Play, RefreshCw, Search, Send, ThumbsDown, X } from "lucide-react";
import BuscaPainel from "@/components/radar/BuscaPainel";
import InternalShell from "@/components/InternalShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CRITERIOS, FAIXAS, faixaDa } from "@shared/radar/criterios";
import { filtrar, FILTROS_INICIAIS, semAcento, type Filtros } from "@shared/radar/filtros";
import { linkInstagram, host, linkSeguro, telefoneLegivel } from "@shared/radar/formato";
import { ETAPAS, type Etapa } from "@shared/radar/funil";
import { linkDeEnvio, MOTIVOS_REPROVACAO, PREFIXO_REPROVADO, resumoDoDia, type AcaoEnvio, type EstadoEnvio } from "@shared/radar/envio";
import { lerPapel, lerRadar, salvarAcaoRadar, type RetratoRadar } from "@/features/radar/nuvem";
import type { Envio, Lead, StatusEnvio } from "@shared/radar/tipos";

const abas = ["Buscar", "Fila", "Funil", "Leads", "Cliente ideal"] as const;
type Aba = typeof abas[number];
const painel = "rounded-xl border border-white/[0.08] bg-[#121318]";
const botao = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.12] px-3 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45";
const primario = "border-[#0C2AFE] bg-[#0C2AFE] hover:bg-[#2440ff]";

function formatarProximo(iso?: string) {
  if (!iso) return "sem previsão";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
/** @ do Instagram ou o telefone do WhatsApp, como aparece para quem envia. */
function destinoLegivel(envio: Pick<Envio, "canal" | "destino">) {
  return envio.canal === "whatsapp" ? `WhatsApp ${telefoneLegivel(envio.destino)}` : `@${envio.destino}`;
}
function linkSeguroDeEnvio(envio: Envio) {
  try { return linkDeEnvio(envio); } catch { return undefined; }
}
function Item({ children }: { children: React.ReactNode }) { return <div className="min-w-0 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">{children}</div>; }

export default function Radar() {
  const { user, papel } = useAuth();
  const cliente = supabase as unknown as Parameters<typeof lerRadar>[0] | null;
  const [retrato, setRetrato] = useState<RetratoRadar>({ tipo: "vazio" });
  const retratoRef = useRef(retrato);
  const [aba, setAba] = useState<Aba>(papel === "parceiro" ? "Buscar" : "Fila");
  const [statusEnvioFiltro, setStatusEnvioFiltro] = useState<"" | StatusEnvio>("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(FILtros());
  const [termo, setTermo] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [motivo, setMotivo] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  // De quem é o Radar aberto: o parceiro usa o do dono (0007). Vazio até conferir, para não ler o Radar errado.
  const [radarOwner, setRadarOwner] = useState("");
  const seqRef = useRef(0);
  const salvandoRef = useRef(false);
  const setAtual = useCallback((r: RetratoRadar) => { retratoRef.current = r; setRetrato(r); }, []);

  useEffect(() => {
    if (!cliente || !user) return;
    void lerPapel(cliente, user.id).then((acesso) => setRadarOwner(acesso?.radarOwner ?? user.id)).catch(() => setRadarOwner(user.id));
  }, [cliente, user]);

  const recarregar = useCallback(async (silencioso = false) => {
    if (!cliente || !user) { setCarregando(false); return; }
    if (!radarOwner || salvandoRef.current) return;
    const minhaSeq = ++seqRef.current;
    if (!silencioso) setCarregando(true);
    try {
      const resultado = await lerRadar(cliente, radarOwner || user.id);
      if (minhaSeq === seqRef.current) setAtual(resultado);
    } catch {
      if (minhaSeq === seqRef.current) setAviso("Falha de conexão ao atualizar o Radar.");
    } finally { if (minhaSeq === seqRef.current) setCarregando(false); }
  }, [cliente, user, radarOwner, setAtual]);

  const recarregarSilencioso = useCallback(() => { void recarregar(true); }, [recarregar]);
  useEffect(() => { void recarregar(); const timer = window.setInterval(() => void recarregar(true), 5000); return () => window.clearInterval(timer); }, [recarregar]);
  useEffect(() => { retratoRef.current = retrato; }, [retrato]);

  const executarAcao = useCallback(async (acao: AcaoEnvio) => {
    if (!cliente || !user || salvandoRef.current || retratoRef.current.tipo !== "ok") return;
    salvandoRef.current = true; setSalvando(true);
    const minhaSeq = ++seqRef.current;
    try {
      const resultado = await salvarAcaoRadar(cliente, radarOwner || user.id, retratoRef.current, acao);
      if (resultado.tipo === "ok" || resultado.tipo === "conflito") {
        const atual = await lerRadar(cliente, radarOwner || user.id);
        if (minhaSeq === seqRef.current) setAtual(atual);
        setAviso(resultado.tipo === "ok" ? "Alteração salva." : "Outra tela alterou esses dados. Recarreguei o estado, confira antes de tentar de novo.");
      } else setAviso(resultado.mensagem);
    } catch {
      setAviso("Não foi possível salvar. Atualizei o estado, confira antes de tentar novamente.");
      try { const atual = await lerRadar(cliente, radarOwner || user.id); if (minhaSeq === seqRef.current) setAtual(atual); } catch { /* mantém o último retrato visível */ }
    } finally { salvandoRef.current = false; setSalvando(false); }
  }, [cliente, user, radarOwner, setAtual]);

  const estado = retrato.tipo === "ok" ? retrato.estado : null;
  const resumo = estado ? resumoDoDia(estado, new Date()) : null;
  const envios = estado?.envios ?? [];
  const porId = useMemo(() => new Map(envios.map((e) => [e.id, e])), [envios]);
  const leadSelecionado = leadId ? estado?.leads.find((l) => l.id === leadId) : null;
  const listaLeads = useMemo(() => estado ? filtrar(estado.leads, { ...filtros, busca: filtros.busca }, estado.registros).filter((l) => !termo || semAcento(`${l.nome} ${l.segmento} ${l.cidade} ${l.instagram?.usuario ?? ""} ${l.contato.whatsapp ?? l.contato.telefone ?? ""}`).includes(semAcento(termo))).sort((a, b) => b.analisadoEm.localeCompare(a.analisadoEm) || b.pontuacao - a.pontuacao) : [], [estado, filtros, termo]);
  // Mais novos primeiro: quem chegou por último na fila aparece no topo; no mesmo instante, a nota maior vem antes.
  const fila = useMemo(() => envios.filter((e) => e.status !== "cancelado").sort((a,b) => b.criadoEm.localeCompare(a.criadoEm) || (estado?.leads.find((l) => l.id === b.leadId)?.pontuacao ?? 0) - (estado?.leads.find((l) => l.id === a.leadId)?.pontuacao ?? 0)), [envios, estado?.leads]);
  const visiveis = useMemo(() => fila.filter((e) => !statusEnvioFiltro || e.status === statusEnvioFiltro), [fila, statusEnvioFiltro]);
  const atual = visiveis.findIndex((e) => e.id === selecionado);
  const envioSelecionado = selecionado ? porId.get(selecionado) : undefined;
  const mudaSelecao = (delta: number) => { const i = Math.max(0, Math.min(visiveis.length - 1, (atual < 0 ? 0 : atual) + delta)); setSelecionado(visiveis[i]?.id ?? null); };

  useEffect(() => {
    if (!visiveis.some((e) => e.id === selecionado)) setSelecionado(visiveis[0]?.id ?? null);
  }, [visiveis, selecionado]);

  useEffect(() => {
    if (aba !== "Fila") return;
    function teclado(e: KeyboardEvent) {
      if (e.repeat || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      const alvo = e.target as HTMLElement | null;
      if (alvo && (alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(alvo.tagName))) return;
      if (!visiveis.length) return;
      const chave = e.key.toLowerCase();
      if (chave === "j" || chave === "k") { e.preventDefault(); mudaSelecao(chave === "j" ? 1 : -1); return; }
      if (!envioSelecionado) return;
      // A aprova o texto que está na caixa (editado ou não), conferido contra o que estava salvo.
      if (chave === "a" && envioSelecionado.status === "rascunho") {
        e.preventDefault();
        if (!mensagem.trim() || mensagem.includes("—")) { setAviso("Confira a mensagem: vazia ou com travessão não pode ser aprovada."); return; }
        void executarAcao({ acao: "aprovar-revisado", id: envioSelecionado.id, base: envioSelecionado.mensagem, mensagem });
      }
      if (chave === "r" && envioSelecionado.status === "rascunho") { e.preventDefault(); const razao = window.prompt("Motivo da reprovação?"); if (razao?.trim()) void executarAcao({ acao: "reprovar", id: envioSelecionado.id, motivo: razao.trim() }); }
      if (chave === "e" && envioSelecionado.status === "rascunho") { e.preventDefault(); setMensagem(envioSelecionado.mensagem); setSelecionado(envioSelecionado.id); document.getElementById("radar-editor")?.focus(); }
    }
    window.addEventListener("keydown", teclado);
    return () => window.removeEventListener("keydown", teclado);
  }, [aba, visiveis, envioSelecionado, executarAcao, mensagem]);

  useEffect(() => { if (envioSelecionado) setMensagem(envioSelecionado.mensagem); }, [envioSelecionado?.id, envioSelecionado?.mensagem]);
  useEffect(() => { setMotivo(""); }, [envioSelecionado?.id]);
  useEffect(() => { if (!aviso) return; const t = window.setTimeout(() => setAviso(""), 6000); return () => window.clearTimeout(t); }, [aviso]);

  const tituloStatus = (status: StatusEnvio) => ({ rascunho: "Para aprovar", aprovado: "Aprovado", enviado: "Enviado", reprovado: "Reprovado", falhou: "Falhou", enviando: "Enviando", cancelado: "Cancelado" })[status];
  if (!cliente) return <InternalShell title="Radar"><h1 className="text-2xl font-semibold">Radar</h1><p className="mt-3 text-sm text-white/60">Configure o Supabase para acessar o Radar.</p></InternalShell>;

  return <InternalShell title="Radar">
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <h1 className="mr-auto text-[26px] font-semibold tracking-tight">Radar <span className="ml-1 text-sm font-normal text-white/45">Prospecção</span></h1>
      {resumo && <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/75"><Send size={13} /> {resumo.enviadosHoje}/{resumo.limite} hoje <span className="text-white/30">·</span> {resumo.pausado ? "pausado" : resumo.pode.ok ? "pronto para enviar" : resumo.pode.motivo === "fora-da-janela" || resumo.pode.motivo === "fim-de-semana" || resumo.pode.motivo === "limite-do-dia" ? `abre ${formatarProximo(resumo.pode.proximoEm)}` : resumo.pode.motivo}</div>}
      <button type="button" className={botao} onClick={() => void recarregar()} aria-label="Atualizar"><RefreshCw size={15} /> <span className="hidden sm:inline">Atualizar</span></button>
    </div>
    <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.035] p-1 sm:inline-flex sm:grid-cols-none">
      {abas.map((item) => <button key={item} type="button" onClick={() => setAba(item)} aria-pressed={aba === item} className={`min-h-10 rounded-lg px-4 text-[13px] font-medium ${aba === item ? "bg-white/[0.13] text-white" : "text-white/55 hover:text-white"}`}>{item}</button>)}
    </div>
    {aviso && <p role="status" className="mb-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-[13px]">{aviso}</p>}
    {carregando && <p className="mb-3 flex items-center gap-2 text-sm text-white/50"><LoaderCircle size={15} className="animate-spin" /> Carregando dados privados…</p>}
    {retrato.tipo === "sem-tabela" && <div className="mb-4 flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100"><AlertTriangle size={18} className="shrink-0" /><p>Rode o 0005_radar.sql no Supabase para criar as tabelas privadas do Radar.</p></div>}
    {retrato.tipo === "erro" && <p role="alert" className="mb-4 rounded-lg bg-red-400/10 p-3 text-sm text-red-200">Não foi possível ler o Radar agora. {retrato.mensagem}</p>}
    {retrato.tipo === "invalido" && <p role="alert" className="mb-4 rounded-lg bg-red-400/10 p-3 text-sm text-red-200">A configuração salva está inválida. Confira a tabela radar_config.</p>}
    {retrato.tipo === "vazio" && !carregando && <div className={`${painel} p-6 text-center`}><h2 className="text-lg font-medium">Radar ainda sem configuração</h2><p className="mt-2 text-sm text-white/55">{papel === "parceiro" ? "Seu acesso ainda não foi configurado. Fale com a MF Services." : "Importe a base no Mac com pnpm radar:importar -- --gravar."}</p></div>}

    {aba === "Buscar" && user && retrato.tipo !== "sem-tabela" && <BuscaPainel cliente={cliente} owner={radarOwner || user.id} aoConcluir={recarregarSilencioso} />}

    {estado && aba === "Fila" && <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
      <section className={`${painel} min-w-0 overflow-hidden`} aria-label="Fila de envio">
        <div className="flex flex-wrap gap-1 border-b border-white/[0.07] p-2">{(["", "rascunho", "aprovado", "enviando", "enviado", "reprovado", "falhou"] as const).map((s) => <button key={s || "todos"} type="button" onClick={() => setStatusEnvioFiltro(s)} aria-pressed={statusEnvioFiltro === s} className={`min-h-11 rounded-lg px-3 text-[12px] ${statusEnvioFiltro === s ? "bg-white/[0.12] text-white" : "text-white/50"}`}>{s ? tituloStatus(s) : "Todos"}</button>)}</div>
        <div className="max-h-[65dvh] overflow-y-auto p-2">{visiveis.length ? visiveis.map((envio) => {
          const l = estado.leads.find((x) => x.id === envio.leadId);
          return <button key={envio.id} type="button" onClick={() => setSelecionado(envio.id)} aria-pressed={selecionado === envio.id} className={`mb-1 block min-h-12 w-full rounded-lg border p-3 text-left ${selecionado === envio.id ? "border-[#0C2AFE]/70 bg-[#0C2AFE]/10" : "border-transparent hover:bg-white/[0.04]"}`}>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><strong className="mr-auto truncate text-[13px]">{l?.nome ?? envio.leadId}</strong><span className="text-[11px] text-white/50">{destinoLegivel(envio)}</span><span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-white/65">{tituloStatus(envio.status)}</span></span>
            <span className="mt-1 block break-words text-[12px] leading-relaxed text-white/55">{envio.mensagem}</span>
          </button>;
        }) : <p className="p-6 text-center text-sm text-white/45">Nenhum envio nesta lista.</p>}</div>
      </section>
      <section className={`${painel} min-w-0 p-4`} aria-label="Detalhe do envio">
        {envioSelecionado ? <>
          <div className="flex items-start gap-3"><div className="mr-auto min-w-0"><p className="text-[11px] uppercase tracking-wide text-white/40">{envioSelecionado.tipo === "primeira" ? "Primeira mensagem" : "Follow-up"}</p><h2 className="mt-1 truncate text-lg font-semibold">{estado.leads.find((l) => l.id === envioSelecionado.leadId)?.nome ?? envioSelecionado.leadId}</h2><a className="text-sm text-blue-300 underline-offset-4 hover:underline" href={envioSelecionado.canal === "whatsapp" ? linkSeguroDeEnvio({ ...envioSelecionado, mensagem: "" })?.replace(/\?text=$/, "") : linkInstagram(envioSelecionado.destino)} target="_blank" rel="noreferrer">{destinoLegivel(envioSelecionado)}</a></div><span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px]">{tituloStatus(envioSelecionado.status)}</span></div>
          {envioSelecionado.status === "rascunho" ? <label className="mt-4 block text-[12px] text-white/55">Mensagem, confira cada detalhe<textarea id="radar-editor" value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={7} className="mt-1.5 min-h-36 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-[13px] leading-relaxed text-white outline-none focus:border-[#0C2AFE]" /></label> : <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-black/20 p-3 text-[13px] leading-relaxed text-white/80">{envioSelecionado.mensagem}</p>}
          {mensagem.includes("—") && envioSelecionado.status === "rascunho" && <p className="mt-2 flex gap-2 text-[12px] text-amber-200"><AlertTriangle size={14} /> A mensagem contém travessão, corrija antes de aprovar.</p>}
          {envioSelecionado.status === "rascunho" && <>
            <div className="mt-3 flex flex-wrap gap-2"><button className={botao} type="button" disabled={salvando || !mensagem.trim() || mensagem.includes("—")} onClick={() => void executarAcao({ acao: "editar", id: envioSelecionado.id, mensagem })}>Salvar edição</button><button className={`${botao} ${primario}`} type="button" disabled={salvando || !mensagem.trim() || mensagem.includes("—")} onClick={() => void executarAcao({ acao: "aprovar-revisado", id: envioSelecionado.id, base: envioSelecionado.mensagem, mensagem })}><Check size={15} /> Aprovar</button></div>
            <label className="mt-4 block text-[12px] text-white/50">Motivo da reprovação<textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className="mt-1.5 min-h-14 w-full rounded-lg border border-white/10 bg-black/20 p-3 text-[13px] text-white outline-none focus:border-white/25" placeholder="Anote por que não deve sair" /></label><button className={`${botao} mt-2`} type="button" disabled={salvando || !motivo.trim()} onClick={() => void executarAcao({ acao: "reprovar", id: envioSelecionado.id, motivo: motivo.trim() })}>Reprovar</button>
          </>}
          {(envioSelecionado.status === "rascunho" || envioSelecionado.status === "aprovado") && <EnvioManual envio={envioSelecionado} mensagem={envioSelecionado.status === "rascunho" ? mensagem : envioSelecionado.mensagem} salvando={salvando} aoAvisar={setAviso}
            aoMarcar={() => void executarAcao({ acao: "enviado-manual", id: envioSelecionado.id, base: envioSelecionado.mensagem, mensagem: envioSelecionado.status === "rascunho" ? mensagem : envioSelecionado.mensagem })} />}
          {envioSelecionado.erro && <p className="mt-3 rounded-lg bg-red-400/10 p-3 text-sm text-red-200">{envioSelecionado.erro}</p>}
          <ReprovarLead key={envioSelecionado.leadId} registro={estado.registros[envioSelecionado.leadId]} salvando={salvando} aoReprovar={(motivo) => void executarAcao({ acao: "reprovar-lead", leadId: envioSelecionado.leadId, motivo })} />
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-3"><button className={botao} type="button" onClick={() => mudaSelecao(-1)} disabled={atual <= 0}><ChevronLeft size={16} /> Anterior</button><span className="text-[11px] text-white/35">J/K navegam, A aprova, R reprova, E edita</span><button className={botao} type="button" onClick={() => mudaSelecao(1)} disabled={atual < 0 || atual >= visiveis.length - 1}>Próximo <ChevronRight size={16} /></button></div>
        </> : <div className="grid min-h-56 place-items-center text-center text-sm text-white/45">Escolha um envio para revisar.</div>}
      </section>
    </div>}

    {estado && aba === "Funil" && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(ETAPAS).map(([etapa, nome]) => {
      const itens = estado.leads.filter((l) => (estado.registros[l.id]?.etapa ?? "novo") === etapa);
      return <div key={etapa} className={`${painel} min-w-0 p-3`}><h2 className="mb-2 flex items-center justify-between text-sm font-semibold">{nome}<span className="text-[11px] font-normal text-white/40">{itens.length}</span></h2><div className="space-y-2">{itens.map((lead) => <div key={lead.id} className="rounded-lg border border-white/[0.07] p-3"><button className="block min-h-8 text-left text-[13px] font-medium hover:underline" type="button" onClick={() => { setLeadId(lead.id); setAba("Leads"); }}>{lead.nome}</button><select aria-label={`Etapa de ${lead.nome}`} value={etapa} onChange={(e) => void executarAcao({ acao: "etapa", leadId: lead.id, etapa: e.target.value as Etapa })} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#1b1c22] px-2 text-xs text-white">{Object.entries(ETAPAS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select><textarea aria-label={`Anotação de ${lead.nome}`} defaultValue={estado.registros[lead.id]?.anotacao ?? ""} onBlur={(e) => { const valor = e.currentTarget.value.trim(); if (valor && valor !== estado.registros[lead.id]?.anotacao) void executarAcao({ acao: "etapa", leadId: lead.id, etapa: etapa as Etapa, anotacao: valor }); }} placeholder="Anotação do funil" rows={2} className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-white placeholder:text-white/35" /></div>)}</div></div>;
    })}</section>}

    {estado && aba === "Leads" && <div className="grid gap-3 lg:grid-cols-[minmax(0,.8fr)_minmax(320px,1.2fr)]">
      <section className={`${painel} min-w-0 p-3`}><label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" /><input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar lead" className="h-11 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-3 text-sm text-white placeholder:text-white/40" /></label><div className="mt-2 flex flex-wrap gap-2"><select aria-label="Filtrar por faixa" value={filtros.faixa} onChange={(e) => setFiltros((f) => ({ ...f, faixa: e.target.value as Filtros["faixa"] }))} className="h-10 max-w-full rounded-lg border border-white/10 bg-[#1b1c22] px-2 text-xs text-white"><option value="">Todas as notas</option>{Object.entries(FAIXAS).map(([id,v]) => <option key={id} value={id}>{v.nome}</option>)}</select><select aria-label="Filtrar por etapa" value={filtros.etapa} onChange={(e) => setFiltros((f) => ({ ...f, etapa: e.target.value as Filtros["etapa"] }))} className="h-10 max-w-full rounded-lg border border-white/10 bg-[#1b1c22] px-2 text-xs text-white"><option value="">Todas as etapas</option>{Object.entries(ETAPAS).map(([id,n]) => <option key={id} value={id}>{n}</option>)}</select><select aria-label="Filtrar por segmento" value={filtros.segmento} onChange={(e) => setFiltros((f) => ({ ...f, segmento: e.target.value }))} className="h-10 max-w-full rounded-lg border border-white/10 bg-[#1b1c22] px-2 text-xs text-white"><option value="">Todos os segmentos</option>{Array.from(new Set(estado.leads.map((l) => l.segmento))).sort().map((x) => <option key={x}>{x}</option>)}</select><select aria-label="Filtrar por UF" value={filtros.uf} onChange={(e) => setFiltros((f) => ({ ...f, uf: e.target.value }))} className="h-10 max-w-full rounded-lg border border-white/10 bg-[#1b1c22] px-2 text-xs text-white"><option value="">Todas as UFs</option>{Array.from(new Set(estado.leads.map((l) => l.uf))).sort().map((x) => <option key={x}>{x}</option>)}</select><select aria-label="Filtrar por presença web" value={filtros.site} onChange={(e) => setFiltros((f) => ({ ...f, site: e.target.value as Filtros["site"] }))} className="h-10 max-w-full rounded-lg border border-white/10 bg-[#1b1c22] px-2 text-xs text-white"><option value="">Qualquer presença web</option><option value="sem-site">Sem site</option><option value="ruim">Site ruim</option><option value="mediano">Site mediano</option><option value="bom">Site bom</option></select><select aria-label="Filtrar por serviço" value={filtros.servico} onChange={(e) => setFiltros((f) => ({ ...f, servico: e.target.value as Filtros["servico"] }))} className="h-10 max-w-full rounded-lg border border-white/10 bg-[#1b1c22] px-2 text-xs text-white"><option value="">Todos os serviços</option>{["site","landing-page","pagina-de-vendas","vsl","catalogo","loja-online"].map((x) => <option key={x}>{x}</option>)}</select></div><div className="mt-3 max-h-[60dvh] overflow-y-auto">{listaLeads.map((lead) => <button key={lead.id} type="button" aria-pressed={leadId === lead.id} onClick={() => setLeadId(lead.id)} className={`mb-1 flex min-h-12 w-full items-center gap-2 rounded-lg border px-3 text-left ${leadId === lead.id ? "border-[#0C2AFE]/70 bg-[#0C2AFE]/10" : "border-transparent hover:bg-white/[0.04]"}`}><span className="mr-auto min-w-0"><strong className="block truncate text-[13px]">{lead.nome}</strong><span className="block truncate text-[11px] text-white/45">{lead.cidade}/{lead.uf}{lead.instagram ? ` · @${lead.instagram.usuario}` : lead.contato.whatsapp || lead.contato.telefone ? ` · ${telefoneLegivel(lead.contato.whatsapp ?? lead.contato.telefone)}` : ""}</span></span><span className="text-sm font-semibold">{lead.pontuacao}</span></button>)}{!listaLeads.length && <p className="p-5 text-center text-sm text-white/45">Nenhum lead encontrado.</p>}</div></section>
      <section className={`${painel} min-w-0 p-4`}>{leadSelecionado ? <LeadDetalhe lead={leadSelecionado} estado={estado} salvando={salvando} aoEnfileirar={() => void executarAcao({ acao: "rascunho", leadId: leadSelecionado.id })} aoReprovar={(motivo) => void executarAcao({ acao: "reprovar-lead", leadId: leadSelecionado.id, motivo })} /> : <div className="grid min-h-56 place-items-center text-sm text-white/45">Escolha um lead para conferir critérios e evidências.</div>}</section>
    </div>}

    {estado && aba === "Cliente ideal" && <section className={`${painel} max-w-3xl p-4 sm:p-5`}><div className="flex flex-wrap items-center gap-3"><div className="mr-auto"><p className="text-[11px] uppercase tracking-wide text-white/40">Perfil de prospecção</p><h2 className="mt-1 text-lg font-semibold">Cliente ideal</h2></div><button type="button" className={`${botao} ${estado.config.envio.pausado ? primario : ""}`} disabled={salvando} onClick={() => void executarAcao({ acao: "pausa", pausado: !estado.config.envio.pausado })}>{estado.config.envio.pausado ? <><Play size={15} /> Retomar envio</> : <><Pause size={15} /> Pausar envio</>}</button></div><p className="mt-4 text-sm leading-relaxed text-white/75">{estado.config.clienteIdeal.descricao}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Item><h3 className="text-xs font-semibold text-white/55">Nichos</h3><p className="mt-2 text-sm">{estado.config.clienteIdeal.nichos.join(", ")}</p></Item><Item><h3 className="text-xs font-semibold text-white/55">Regiões</h3><p className="mt-2 text-sm">{estado.config.clienteIdeal.regioes.join(", ")}</p></Item><Item><h3 className="text-xs font-semibold text-white/55">Sinais desejados</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm">{estado.config.clienteIdeal.sinais.map((x) => <li key={x}>{x}</li>)}</ul></Item><Item><h3 className="text-xs font-semibold text-white/55">Fora do alvo</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm">{estado.config.clienteIdeal.fora.map((x) => <li key={x}>{x}</li>)}</ul></Item></div><p className="mt-4 text-xs text-white/45">{estado.config.envio.conta ? `Envio por Instagram · @${estado.config.envio.conta}` : "Envio manual"} · limite {estado.config.envio.limiteDiario}/dia · janela {estado.config.envio.janela.inicio}–{estado.config.envio.janela.fim}, horário de Fortaleza · dias úteis: {estado.config.envio.soDiasUteis ? "sim" : "não"}</p>{resumo && <p className="mt-2 text-sm text-white/70">Resumo de hoje: {resumo.enviadosHoje}/{resumo.limite} enviados, {resumo.aprovados} aprovados. {resumo.pausado ? "Envio pausado." : resumo.pode.ok ? "Janela aberta." : `Próxima janela: ${formatarProximo(resumo.pode.proximoEm)}.`}</p>}</section>}
  </InternalShell>;
}

function FILtros(): Filtros { return { ...FILTROS_INICIAIS }; }

/** Um toque reprova o lead inteiro: sai da fila, vai para descartado e o motivo ensina a próxima busca. */
function ReprovarLead({ registro, salvando, aoReprovar }: { registro?: EstadoEnvio["registros"][string]; salvando: boolean; aoReprovar: (motivo: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [outro, setOutro] = useState("");
  const reprovado = registro?.etapa === "descartado" && registro.anotacao.startsWith(PREFIXO_REPROVADO);
  if (reprovado) return <p className="mt-4 flex items-center gap-2 rounded-lg bg-red-400/10 p-3 text-[13px] text-red-100"><ThumbsDown size={14} /> Lead reprovado · {registro.anotacao.slice(PREFIXO_REPROVADO.length)}</p>;
  return <div className="mt-4 rounded-lg border border-white/[0.07] p-3">
    {!aberto ? <button className={botao} type="button" disabled={salvando} onClick={() => setAberto(true)}><ThumbsDown size={15} /> Reprovar lead</button> : <>
      <p className="text-[12px] text-white/55">Por que este lead não serve? Um toque reprova, tira da fila e ensina a próxima busca.</p>
      <div className="mt-2 flex flex-wrap gap-2">{MOTIVOS_REPROVACAO.map((m) => <button key={m} type="button" disabled={salvando} onClick={() => aoReprovar(m)} className="min-h-10 rounded-full border border-white/[0.12] px-3 text-[12px] text-white/80 transition-colors hover:border-red-300/50 hover:text-red-100 disabled:opacity-45">{m}</button>)}</div>
      <div className="mt-2 flex flex-wrap gap-2"><input value={outro} onChange={(e) => setOutro(e.target.value)} maxLength={200} placeholder="Outro motivo" aria-label="Outro motivo" className="h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 text-[13px] text-white placeholder:text-white/35 outline-none focus:border-white/25" /><button className={botao} type="button" disabled={salvando || !outro.trim()} onClick={() => aoReprovar(outro.trim())}>Reprovar</button><button className={botao} type="button" onClick={() => { setAberto(false); setOutro(""); }}>Cancelar</button></div>
    </>}
  </div>;
}

function LeadDetalhe({ lead, estado, salvando, aoEnfileirar, aoReprovar }: { lead: Lead; estado: EstadoEnvio; salvando: boolean; aoEnfileirar: () => void; aoReprovar: (motivo: string) => void }) {
  const registro = estado.registros[lead.id];
  return <>
    <div className="flex flex-wrap items-start gap-3"><div className="mr-auto"><p className="text-[11px] uppercase tracking-wide text-white/40">{lead.segmento} · {lead.cidade}/{lead.uf}</p><h2 className="mt-1 text-xl font-semibold">{lead.nome}</h2>{lead.instagram ? <a className="text-sm text-blue-300 underline-offset-4 hover:underline" href={linkInstagram(lead.instagram.usuario)} target="_blank" rel="noreferrer">@{lead.instagram.usuario}</a> : <span className="text-sm text-white/55">{lead.contato.whatsapp || lead.contato.telefone ? telefoneLegivel(lead.contato.whatsapp ?? lead.contato.telefone) : "Sem Instagram nem telefone"}</span>}{lead.origem === "rapida" && <span className="ml-2 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-white/60">Busca rápida, sem Instagram analisado</span>}</div><span className="rounded-full bg-white/[0.08] px-3 py-1 text-sm">{lead.pontuacao}/100 · {FAIXAS[faixaDa(lead.pontuacao)].nome}</span></div>
    <p className="mt-4 text-sm leading-relaxed text-white/75">{lead.oportunidade}</p><div className="mt-3 flex flex-wrap gap-2">{lead.servicos.map((s) => <span key={s} className="rounded-full bg-blue-400/10 px-2.5 py-1 text-[11px] text-blue-200">{s}</span>)}</div>
    <div className="mt-4 flex flex-wrap gap-2"><button className={`${botao} ${primario}`} type="button" disabled={salvando || (!lead.instagram && !lead.contato.whatsapp) || estado.envios.some((e) => e.leadId === lead.id && e.tipo === "primeira" && !["cancelado", "reprovado"].includes(e.status))} onClick={aoEnfileirar}><Send size={15} /> Colocar na fila</button><span className="self-center text-[11px] text-white/45">A mensagem entra como rascunho e precisa de aprovação.</span></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">{CRITERIOS.map((criterio) => { const a = lead.criterios[criterio.id]; const href = linkSeguro(a?.fonte); return <Item key={criterio.id}><div className="flex items-start gap-2"><span className={a?.ok ? "text-emerald-300" : "text-white/35"}>{a?.ok ? <Check size={14} /> : <X size={14} />}</span><div className="min-w-0"><h3 className="text-[12px] font-semibold">{criterio.nome}<span className="ml-2 font-normal text-white/40">{criterio.pontos} pts</span></h3><p className="mt-1 break-words text-[12px] leading-relaxed text-white/60">{a?.evidencia || "Sem evidência registrada."}</p>{href && <a className="mt-1 inline-block max-w-full truncate text-[11px] text-blue-300 hover:underline" href={href} target="_blank" rel="noreferrer">{host(href)}</a>}</div></div></Item>; })}</div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><Item><h3 className="text-xs font-semibold text-white/55">Problemas observados</h3><ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-white/75">{lead.problemas.map((p) => <li key={p}>{p}</li>)}</ul></Item><Item><h3 className="text-xs font-semibold text-white/55">Abordagem salva</h3><p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-white/75">{lead.abordagem.mensagem}</p>{lead.abordagem.mensagem.includes("—") && <p className="mt-2 text-xs text-amber-200">Aviso: a abordagem contém travessão.</p>}</Item></div>
    {lead.site.diagnostico && <Item><h3 className="text-xs font-semibold text-white/55">Diagnóstico do site</h3><p className="mt-2 text-sm">{lead.site.diagnostico.urlFinal ?? lead.site.diagnostico.url} · {lead.site.diagnostico.situacaoSugerida}{lead.site.diagnostico.status ? ` · HTTP ${lead.site.diagnostico.status}` : ""}</p><ul className="mt-2 list-inside list-disc text-[12px] text-white/65">{lead.site.diagnostico.problemas.map((p) => <li key={p}>{p}</li>)}</ul></Item>}
    <ReprovarLead key={lead.id} registro={registro} salvando={salvando} aoReprovar={aoReprovar} />
    <p className="mt-3 text-[11px] text-white/40">Etapa: {ETAPAS[registro?.etapa ?? "novo"]} · Analisado em {lead.analisadoEm} · Fontes: {lead.fontes.map(host).join(", ")}</p>
  </>;
}

/** Envio feito pela própria pessoa: copia o texto, abre a conversa e depois marca como enviado. */
function EnvioManual({ envio, mensagem, salvando, aoAvisar, aoMarcar }: { envio: Envio; mensagem: string; salvando: boolean; aoAvisar: (texto: string) => void; aoMarcar: () => void }) {
  const invalida = !mensagem.trim() || mensagem.includes("—");
  const link = linkSeguroDeEnvio({ ...envio, mensagem });
  const copiar = async () => {
    try { await navigator.clipboard.writeText(mensagem); aoAvisar("Mensagem copiada."); } catch { aoAvisar("Não deu para copiar. Selecione o texto e copie à mão."); }
  };
  return <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
    <h3 className="text-[12px] font-semibold">Enviar você mesmo</h3>
    <p className="mt-1 text-[12px] leading-relaxed text-white/55">{envio.canal === "whatsapp" ? "Abre o WhatsApp com a mensagem pronta." : "Copia a mensagem e abre o Direct; é só colar."} Depois de enviar, marque aqui para o funil andar.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {link ? <a href={invalida ? undefined : link} target="_blank" rel="noreferrer" aria-disabled={invalida} onClick={(e) => { if (invalida) { e.preventDefault(); return; } if (envio.canal === "instagram") void copiar(); }} className={`${botao} ${invalida ? "pointer-events-none opacity-45" : ""}`}><ExternalLink size={15} /> {envio.canal === "whatsapp" ? "Abrir no WhatsApp" : "Copiar e abrir o Direct"}</a> : <span className="self-center text-[12px] text-red-200">Destino inválido para envio.</span>}
      <button type="button" className={botao} disabled={invalida} onClick={() => void copiar()}><Copy size={15} /> Copiar</button>
      <button type="button" className={`${botao} ${primario}`} disabled={salvando || invalida} onClick={aoMarcar}><Check size={15} /> Marcar como enviado</button>
    </div>
  </div>;
}
