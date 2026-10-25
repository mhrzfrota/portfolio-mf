import { createClient } from "@supabase/supabase-js";
import type { Bloqueado, ConfigRadar, Descartado, Envio, Lead } from "../../shared/radar/tipos.ts";
import type { Registro } from "../../shared/radar/funil.ts";
import type { EstadoEnvio } from "../../shared/radar/envio.ts";
import { validarConfig } from "../../shared/radar/envio.ts";
import { calcularPontuacao } from "../../shared/radar/pontuacao.ts";
import { faixaDa } from "../../shared/radar/criterios.ts";

type ClienteRadar = { from: (tabela: string) => any; auth?: any };
type Linha = { owner?: string; id?: string; lead_id?: string; chave?: string; usuario?: string; dados?: unknown; versao?: number };
type Armazem = ReturnType<typeof criarArmazem>;
const conflito = () => new Error("RADAR_CONFLITO_VERSAO");
const erroSupabase = (erro: { code?: string; message?: string } | null, tabela: string): void => {
  if (!erro) return;
  if (erro.code === "PGRST205" || erro.code === "42P01") throw new Error(`Tabela ${tabela} inexistente. Rode supabase/migrations/0005_radar.sql no Supabase.`);
  throw new Error(`Supabase: falha ao acessar ${tabela}${erro.code ? ` (${erro.code})` : ""}`);
};

/** Armazém injetável para os testes não dependerem da rede. */
export function criarArmazem(cliente: ClienteRadar, owner: string) {
  const lerLinhas = async (tabela: string): Promise<Linha[]> => {
    const { data, error } = await cliente.from(tabela).select("*").eq("owner", owner);
    erroSupabase(error, tabela);
    return (data ?? []) as Linha[];
  };
  const upsert = async (tabela: string, linhas: Record<string, unknown>[], chave: string): Promise<void> => {
    if (!linhas.length) return;
    const { error } = await cliente.from(tabela).upsert(linhas.map((l) => ({ ...l, owner })), { onConflict: `owner,${chave}` });
    erroSupabase(error, tabela);
  };
  const salvarComVersao = async (tabela: string, chave: "id" | "lead_id" | "owner", id: string | undefined, dados: unknown, extra: Record<string, unknown>, versao: number | undefined): Promise<void> => {
    if (versao === undefined) {
      const linha = { owner, ...(id === undefined ? {} : { [chave]: id }), ...extra, dados };
      const { error } = await cliente.from(tabela).insert(linha);
      if (error?.code === "23505") throw conflito();
      erroSupabase(error, tabela);
      return;
    }
    let q = cliente.from(tabela).update({ ...extra, dados }).eq("owner", owner).eq("versao", versao);
    if (id !== undefined) q = q.eq(chave, id);
    const { data, error } = await q.select(chave === "owner" ? "owner" : chave).maybeSingle();
    erroSupabase(error, tablaLegivel(tabela));
    if (!data) throw conflito();
  };
  const lerRetrato = async () => {
    const [leadsRows, enviosRows, funilRows, bloqueadosRows, configRows] = await Promise.all([
      lerLinhas("radar_leads"), lerLinhas("radar_envios"), lerLinhas("radar_funil"), lerLinhas("radar_bloqueados"), lerLinhas("radar_config"),
    ]);
    const config = configRows[0]?.dados;
    const configErros = validarConfig(config);
    if (configErros.length) throw new Error(configRows.length ? `radar_config inválida: ${configErros.join("; ")}` : "radar_config vazia. Rode pnpm radar:importar -- --gravar.");
    const leads = leadsRows.map((r) => r.dados as Lead).map((l) => ({ ...l, pontuacao: calcularPontuacao(l.criterios) }));
    return { estado: {
      leads, envios: enviosRows.map((r) => r.dados as Envio),
      registros: Object.fromEntries(funilRows.map((r) => [String(r.lead_id), r.dados as Registro])),
      bloqueados: bloqueadosRows.map((r) => r.dados as Bloqueado), config: config as ConfigRadar,
    }, linhas: { leads: leadsRows, envios: enviosRows, funil: funilRows, config: configRows } };
  };
  const lerEstado = async (): Promise<EstadoEnvio> => (await lerRetrato()).estado;
  const persistir = async (antes: EstadoEnvio, depois: EstadoEnvio, lidos: Awaited<ReturnType<typeof lerRetrato>>["linhas"]): Promise<void> => {
    const mudou = <T,>(a: T, b: T) => JSON.stringify(a) !== JSON.stringify(b);
    const porId = <T extends { id: string }>(itens: T[]) => new Map(itens.map((x) => [x.id, x]));
    const leadsNovos = porId(depois.leads);
    const leadsVelhos = porId(antes.leads);
    const removidos = [...leadsVelhos.keys()].filter((id) => !leadsNovos.has(id));
    for (const id of removidos) {
      const { error } = await cliente.from("radar_leads").delete().eq("owner", owner).eq("id", id);
      erroSupabase(error, "radar_leads");
    }
    await upsert("radar_leads", depois.leads.filter((l) => !leadsVelhos.has(l.id) || mudou(leadsVelhos.get(l.id), l)).map((l) => ({ id: l.id, dados: l, pontuacao: l.pontuacao, faixa: faixaDa(l.pontuacao), analisado_em: l.analisadoEm })), "id");
    if (mudou(antes.envios, depois.envios)) {
      const versoes = new Map(lidos.envios.map((r) => [String(r.id), r.versao]));
      const antigos = new Map(antes.envios.map((e) => [e.id, e]));
      for (const envio of depois.envios) if (mudou(antigos.get(envio.id), envio)) await salvarComVersao("radar_envios", "id", envio.id, envio, { lead_id: envio.leadId, status: envio.status }, versoes.get(envio.id));
    }
    if (mudou(antes.registros, depois.registros)) {
      const antigos = new Map(lidos.funil.map((r) => [String(r.lead_id), r]));
      for (const [leadId, registro] of Object.entries(depois.registros)) if (mudou(antes.registros[leadId], registro)) await salvarComVersao("radar_funil", "lead_id", leadId, registro, {}, antigos.get(leadId)?.versao);
    }
    if (mudou(antes.config, depois.config)) await salvarComVersao("radar_config", "owner", undefined, depois.config, {}, lidos.config[0]?.versao);
    if (mudou(antes.bloqueados, depois.bloqueados)) await upsert("radar_bloqueados", depois.bloqueados.map((b) => ({ usuario: b.instagram, dados: b })), "usuario");
  };
  async function alterarEstado(fn: (estado: EstadoEnvio) => EstadoEnvio | Promise<EstadoEnvio>): Promise<EstadoEnvio> {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const retrato = await lerRetrato();
      const antes = retrato.estado;
      const depois = await fn(antes);
      try { await persistir(antes, depois, retrato.linhas); return depois; }
      catch (erro) {
        if (!(erro instanceof Error) || erro.message !== "RADAR_CONFLITO_VERSAO") throw erro;
        if (tentativa === 1) throw new Error("Conflito de versão repetido. Recarregue o estado e tente a ação novamente.");
      }
    }
    throw new Error("Conflito de versão.");
  }
  async function lerLeads(): Promise<Lead[]> { return (await lerLinhas("radar_leads")).map((r) => r.dados as Lead); }
  async function salvarLeads(leads: Lead[]): Promise<void> {
    await upsert("radar_leads", leads.map((l) => ({ id: l.id, dados: l, pontuacao: l.pontuacao, faixa: faixaDa(l.pontuacao), analisado_em: l.analisadoEm })), "id");
  }
  async function removerLead(id: string): Promise<void> { const { error } = await cliente.from("radar_leads").delete().eq("owner", owner).eq("id", id); erroSupabase(error, "radar_leads"); }
  async function lerDescartados(): Promise<Descartado[]> { return (await lerLinhas("radar_descartados")).map((r) => r.dados as Descartado); }
  async function salvarDescartados(descartados: Descartado[]): Promise<void> { await upsert("radar_descartados", descartados.map((d) => ({ chave: d.instagram.toLowerCase().replace(/^@/, ""), dados: d })), "chave"); }
  async function lerEnvios(): Promise<Envio[]> { return (await lerLinhas("radar_envios")).map((r) => r.dados as Envio); }
  async function salvarEnvios(envios: Envio[]): Promise<void> { const atuais = await lerLinhas("radar_envios"); const mapa = new Map(atuais.map((r) => [String(r.id), r])); for (const e of envios) { const atual = mapa.get(e.id); if (JSON.stringify(atual?.dados) !== JSON.stringify(e)) await salvarComVersao("radar_envios", "id", e.id, e, { lead_id: e.leadId, status: e.status }, atual?.versao); } }
  async function lerFunil(): Promise<Record<string, Registro>> { return Object.fromEntries((await lerLinhas("radar_funil")).map((r) => [String(r.lead_id), r.dados as Registro])); }
  async function salvarFunil(registros: Record<string, Registro>): Promise<void> { const atuais = await lerLinhas("radar_funil"); const mapa = new Map(atuais.map((r) => [String(r.lead_id), r])); for (const [id, r] of Object.entries(registros)) { const atual = mapa.get(id); if (JSON.stringify(atual?.dados) !== JSON.stringify(r)) await salvarComVersao("radar_funil", "lead_id", id, r, {}, atual?.versao); } }
  async function lerBloqueados(): Promise<Bloqueado[]> { return (await lerLinhas("radar_bloqueados")).map((r) => r.dados as Bloqueado); }
  async function salvarBloqueados(itens: Bloqueado[]): Promise<void> { await upsert("radar_bloqueados", itens.map((b) => ({ usuario: b.instagram, dados: b })), "usuario"); }
  async function lerConfig(): Promise<ConfigRadar> { const { data, error } = await cliente.from("radar_config").select("dados").eq("owner", owner).maybeSingle(); erroSupabase(error, "radar_config"); const erros = validarConfig(data?.dados); if (!data || erros.length) throw new Error(data ? `radar_config inválida: ${erros.join("; ")}` : "Configuração do Radar ausente."); return data.dados as ConfigRadar; }
  async function salvarConfig(config: ConfigRadar): Promise<void> { const erros = validarConfig(config); if (erros.length) throw new Error(erros.join("; ")); const { data, error } = await cliente.from("radar_config").select("dados,versao").eq("owner", owner).maybeSingle(); erroSupabase(error, "radar_config"); if (JSON.stringify(data?.dados) !== JSON.stringify(config)) await salvarComVersao("radar_config", "owner", undefined, config, {}, data?.versao); }
  return { lerEstado, alterarEstado, lerLeads, salvarLeads, removerLead, lerDescartados, salvarDescartados, lerEnvios, salvarEnvios, lerFunil, salvarFunil, lerBloqueados, salvarBloqueados, lerConfig, salvarConfig };
}
function tablaLegivel(tabela: string) { return tabela; }

let instancia: Armazem | undefined;
async function padrao(): Promise<Armazem> {
  if (instancia) return instancia;
  const env = process.env;
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase: configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = (env.RADAR_OWNER_EMAIL?.trim() || env.NOITE_OWNER_EMAIL?.trim())?.toLowerCase();
  const usuarios: { id: string; email?: string }[] = [];
  let owner: string | undefined;
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error("Supabase: falha ao listar usuários");
    usuarios.push(...data.users);
    if (email) owner = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (owner || data.users.length < 100 || (!email && usuarios.length > 1)) break;
  }
  owner ??= !email && usuarios.length === 1 ? usuarios[0].id : undefined;
  if (!owner) throw new Error(email ? "Supabase: dono não encontrado pelo e-mail RADAR_OWNER_EMAIL" : "Supabase: defina RADAR_OWNER_EMAIL ou NOITE_OWNER_EMAIL, pois não há um único usuário");
  instancia = criarArmazem(db, owner);
  return instancia;
}
export async function comTrava<T>(fn: () => T | Promise<T>): Promise<T> { return fn(); }
export async function lerEstado() { return (await padrao()).lerEstado(); }
export async function alterarEstado(fn: (estado: EstadoEnvio) => EstadoEnvio | Promise<EstadoEnvio>) { return (await padrao()).alterarEstado(fn); }
export async function lerLeads() { return (await padrao()).lerLeads(); }
export async function salvarLeads(leads: Lead[]) { return (await padrao()).salvarLeads(leads); }
export async function removerLead(id: string) { return (await padrao()).removerLead(id); }
export async function lerDescartados() { return (await padrao()).lerDescartados(); }
export async function salvarDescartados(itens: Descartado[]) { return (await padrao()).salvarDescartados(itens); }
export async function lerEnvios() { return (await padrao()).lerEnvios(); }
export async function salvarEnvios(itens: Envio[]) { return (await padrao()).salvarEnvios(itens); }
export async function lerFunil() { return (await padrao()).lerFunil(); }
export async function salvarFunil(itens: Record<string, Registro>) { return (await padrao()).salvarFunil(itens); }
export async function lerBloqueados() { return (await padrao()).lerBloqueados(); }
export async function salvarBloqueados(itens: Bloqueado[]) { return (await padrao()).salvarBloqueados(itens); }
export async function lerConfig() { return (await padrao()).lerConfig(); }
export async function salvarConfig(config: ConfigRadar) { return (await padrao()).salvarConfig(config); }
