import type {
  Bloqueado,
  ConfigRadar,
  Descartado,
  Envio,
  Lead,
} from "@shared/radar/tipos";
import type { Registro } from "@shared/radar/funil";
import type { AcaoEnvio, EstadoEnvio } from "@shared/radar/envio";
import { aplicarAcao } from "@shared/radar/envio";
import { calcularPontuacao } from "@shared/radar/pontuacao";
import { faixaDa } from "@shared/radar/criterios";
import {
  validarPedidoBusca,
  type BuscaRadar,
  type ModoBusca,
} from "@shared/radar/buscas";

export type ClienteRadar = {
  from: (tabela: string) => any;
  auth?: { getSession: () => Promise<any> };
};
type Linha = {
  id?: string;
  lead_id?: string;
  usuario?: string;
  dados?: unknown;
  versao?: number;
};
export type RetratoRadar =
  | {
      tipo: "ok";
      estado: EstadoEnvio;
      versoes: {
        envios: Map<string, number>;
        funil: Map<string, number>;
        config?: number;
      };
    }
  | { tipo: "vazio" | "sem-tabela" | "erro" | "invalido"; mensagem?: string };
export type GravacaoRadar =
  | { tipo: "ok"; estado: EstadoEnvio }
  | { tipo: "conflito" }
  | { tipo: "erro"; mensagem: string };

function falhaTabela(
  error: { code?: string; message?: string } | null
): "sem-tabela" | "erro" | null {
  if (!error) return null;
  return error.code === "PGRST205" || error.code === "42P01"
    ? "sem-tabela"
    : "erro";
}
async function linhas(
  cliente: ClienteRadar,
  tabela: string,
  owner: string
): Promise<{
  rows: Linha[];
  error: { code?: string; message?: string } | null;
}> {
  const { data, error } = await cliente
    .from(tabela)
    .select("*")
    .eq("owner", owner);
  return { rows: data ?? [], error };
}
function montarEstado(
  leads: Linha[],
  envios: Linha[],
  funil: Linha[],
  bloqueados: Linha[],
  config: Linha
): EstadoEnvio | null {
  const cfg = config.dados as ConfigRadar | undefined;
  if (!cfg || !Array.isArray(cfg.clienteIdeal?.nichos) || !cfg.envio)
    return null;
  const listaLeads = leads
    .map(r => r.dados as Lead)
    .map(lead => ({ ...lead, pontuacao: calcularPontuacao(lead.criterios) }));
  return {
    leads: listaLeads,
    envios: envios.map(r => r.dados as Envio),
    registros: Object.fromEntries(
      funil.map(r => [String(r.lead_id), r.dados as Registro])
    ),
    bloqueados: bloqueados.map(r => r.dados as Bloqueado),
    config: cfg,
  };
}
export async function lerRadar(
  cliente: ClienteRadar,
  owner: string
): Promise<RetratoRadar> {
  const tabelas = [
    "radar_leads",
    "radar_envios",
    "radar_funil",
    "radar_bloqueados",
    "radar_config",
  ];
  const respostas = await Promise.all(
    tabelas.map(tabela => linhas(cliente, tabela, owner))
  );
  for (const resposta of respostas) {
    const tipo = falhaTabela(resposta.error);
    if (tipo) return { tipo, mensagem: resposta.error?.message };
  }
  const [leads, envios, funil, bloqueados, configs] = respostas.map(
    r => r.rows
  );
  if (!configs.length) return { tipo: "vazio" };
  const estado = montarEstado(leads, envios, funil, bloqueados, configs[0]);
  if (!estado) return { tipo: "invalido" };
  return {
    tipo: "ok",
    estado,
    versoes: {
      envios: new Map(envios.map(r => [String(r.id), Number(r.versao ?? 1)])),
      funil: new Map(
        funil.map(r => [String(r.lead_id), Number(r.versao ?? 1)])
      ),
      config: configs[0].versao,
    },
  };
}
async function gravarVersao(
  cliente: ClienteRadar,
  tabela: string,
  chave: "id" | "lead_id" | "owner",
  id: string | undefined,
  owner: string,
  versao: number | undefined,
  dados: unknown,
  extra: Record<string, unknown> = {}
): Promise<"ok" | "conflito" | "erro"> {
  if (versao === undefined) {
    const { error } = await cliente
      .from(tabela)
      .insert({ owner, ...(id ? { [chave]: id } : {}), dados, ...extra });
    return error?.code === "23505" ? "conflito" : error ? "erro" : "ok";
  }
  let query = cliente
    .from(tabela)
    .update({ dados, ...extra })
    .eq("owner", owner)
    .eq("versao", versao);
  if (id !== undefined) query = query.eq(chave, id);
  const { data, error } = await query
    .select(chave === "owner" ? "owner" : chave)
    .maybeSingle();
  if (error) return "erro";
  return data ? "ok" : "conflito";
}
export async function salvarAcaoRadar(
  cliente: ClienteRadar,
  owner: string,
  retrato: RetratoRadar,
  acao: AcaoEnvio,
  agora = new Date()
): Promise<GravacaoRadar> {
  if (retrato.tipo !== "ok")
    return { tipo: "erro", mensagem: "O Radar ainda não foi carregado." };
  // Ação recusada pela regra (transição inválida, texto mudou, destino bloqueado): o motivo vai para a tela.
  let resultado: ReturnType<typeof aplicarAcao>;
  try {
    resultado = aplicarAcao(retrato.estado, acao, agora);
  } catch (e) {
    return {
      tipo: "erro",
      mensagem: e instanceof Error ? e.message : String(e),
    };
  }
  const antes = retrato.estado;
  const depois = resultado.estado;
  const diferentes = (a: unknown, b: unknown) =>
    JSON.stringify(a) !== JSON.stringify(b);
  const enviosAntes = new Map(antes.envios.map(e => [e.id, e]));
  const versoesEnvio = new Map(retrato.versoes.envios);
  for (const envio of depois.envios)
    if (diferentes(enviosAntes.get(envio.id), envio)) {
      const status = await gravarVersao(
        cliente,
        "radar_envios",
        "id",
        envio.id,
        owner,
        versoesEnvio.get(envio.id),
        envio,
        { lead_id: envio.leadId, status: envio.status }
      );
      if (status === "conflito") return { tipo: "conflito" };
      if (status === "erro")
        return { tipo: "erro", mensagem: "Falha ao gravar a fila de envio." };
    }
  for (const [leadId, registro] of Object.entries(depois.registros))
    if (diferentes(antes.registros[leadId], registro)) {
      const status = await gravarVersao(
        cliente,
        "radar_funil",
        "lead_id",
        leadId,
        owner,
        retrato.versoes.funil.get(leadId),
        registro
      );
      if (status === "conflito") return { tipo: "conflito" };
      if (status === "erro")
        return { tipo: "erro", mensagem: "Falha ao gravar o funil." };
    }
  if (diferentes(antes.config, depois.config)) {
    const status = await gravarVersao(
      cliente,
      "radar_config",
      "owner",
      undefined,
      owner,
      retrato.versoes.config,
      depois.config
    );
    if (status === "conflito") return { tipo: "conflito" };
    if (status === "erro")
      return { tipo: "erro", mensagem: "Falha ao gravar a configuração." };
  }
  if (diferentes(antes.bloqueados, depois.bloqueados)) {
    const payload = depois.bloqueados.map(b => ({
      owner,
      usuario: b.instagram,
      dados: b,
    }));
    const { error } = await cliente
      .from("radar_bloqueados")
      .upsert(payload, { onConflict: "owner,usuario" });
    if (error)
      return { tipo: "erro", mensagem: "Falha ao gravar os bloqueios." };
  }
  return { tipo: "ok", estado: depois };
}
export type AcaoConsulta = {
  acao: "leads";
  leads: Lead[];
  descartados: Descartado[];
};

export async function lerPapel(
  cliente: ClienteRadar,
  userId: string
): Promise<{ papel: "dono" | "parceiro"; radarOwner: string } | null> {
  const { data, error } = await cliente
    .from("radar_papeis")
    .select("papel,radar_owner")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Não foi possível verificar o acesso do Radar.");
  if (data?.papel === "dono") return { papel: "dono", radarOwner: userId };
  return data?.papel === "parceiro" && data.radar_owner
    ? { papel: "parceiro", radarOwner: data.radar_owner }
    : null;
}
export async function pedirBusca(
  cliente: ClienteRadar,
  modo: ModoBusca,
  entrada: unknown
): Promise<{ id?: string; resultado?: unknown }> {
  const pedido = validarPedidoBusca(modo, entrada);
  if (modo === "completa") {
    const { data, error } = await cliente
      .from("radar_buscas")
      .insert(pedido)
      .select("id")
      .single();
    if (error)
      throw new Error(
        error.message || "Não foi possível pedir a busca completa."
      );
    return { id: data.id };
  }
  const sessao = await cliente.auth?.getSession();
  const token = sessao?.data?.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const resposta = await fetch("/api/radar/busca", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(pedido),
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(corpo.erro || "A busca rápida falhou.");
  return { id: corpo.buscaId, resultado: corpo };
}
export async function listarBuscas(
  cliente: ClienteRadar,
  owner: string
): Promise<BuscaRadar[]> {
  const { data, error } = await cliente
    .from("radar_buscas")
    .select("*")
    .eq("owner", owner)
    .order("criado_em", { ascending: false })
    .limit(50);
  if (error) throw new Error("Não foi possível carregar as buscas.");
  return (data ?? []) as BuscaRadar[];
}
