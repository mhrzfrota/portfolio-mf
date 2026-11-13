import type {
  Automacao,
  AutomacaoRascunho,
  Conta,
  Evento,
  PedidoPainel,
  Publicacao,
  RespostaPainel,
  SituacaoZernio,
} from "@shared/automacoes/tipos";

/**
 * A tela só conhece esta interface. Hoje há duas lojas: a do Supabase (de
 * verdade) e a de demonstração em memória (prévia em /dev/automacoes).
 */
export type Retrato =
  | { tipo: "ok"; contas: Conta[]; automacoes: Automacao[]; eventos: Evento[] }
  | { tipo: "sem-tabela" }
  | { tipo: "erro"; mensagem: string };

export type Gravacao<T = void> =
  | { tipo: "ok"; valor: T }
  | { tipo: "conflito" }
  | { tipo: "erro"; mensagem: string };

export type Loja = {
  ler(): Promise<Retrato>;
  criar(rascunho: AutomacaoRascunho): Promise<Gravacao<Automacao>>;
  salvar(id: string, versao: number, rascunho: AutomacaoRascunho): Promise<Gravacao<Automacao>>;
  ligar(id: string, versao: number, ativa: boolean): Promise<Gravacao<Automacao>>;
  excluir(id: string): Promise<Gravacao>;
  ligarConta(id: string, ativa: boolean): Promise<Gravacao>;
  sincronizarContas(): Promise<Gravacao<Conta[]>>;
  publicacoes(contaId: string): Promise<Gravacao<Publicacao[]>>;
  situacao(): Promise<Gravacao<SituacaoZernio>>;
  registrarWebhook(): Promise<Gravacao<SituacaoZernio>>;
};

type Erro = { code?: string; message?: string } | null;
type Cliente = {
  from: (tabela: string) => any;
  auth: { getSession: () => Promise<{ data: { session: { access_token?: string } | null } }> };
};

const semTabela = (e: Erro) => e?.code === "PGRST205" || e?.code === "42P01";
const texto = (x: unknown) => (typeof x === "string" ? x : "");
const lista = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is string => typeof i === "string") : []);

function contaDe(l: Record<string, unknown>): Conta {
  return {
    id: texto(l.id),
    usuario: texto(l.usuario),
    nome: texto(l.nome) || null,
    foto: texto(l.foto) || null,
    ativa: l.ativa === true,
    sincronizadaEm: texto(l.sincronizada_em),
  };
}

function automacaoDe(l: Record<string, unknown>): Automacao {
  const botoes = Array.isArray(l.botoes) ? l.botoes : [];
  return {
    id: texto(l.id),
    nome: texto(l.nome),
    ativa: l.ativa === true,
    contas: lista(l.contas),
    gatilhos: lista(l.gatilhos) as Automacao["gatilhos"],
    posts: lista(l.posts),
    palavras: lista(l.palavras),
    correspondencia: (texto(l.correspondencia) || "contem") as Automacao["correspondencia"],
    respostasPublicas: lista(l.respostas_publicas),
    mensagem: texto(l.mensagem),
    botoes: botoes
      .filter((b): b is { titulo: string; url: string } => !!b && typeof b.titulo === "string" && typeof b.url === "string")
      .map((b) => ({ titulo: b.titulo, url: b.url })),
    criadaEm: texto(l.criada_em),
    atualizadaEm: texto(l.atualizada_em),
    versao: typeof l.versao === "number" ? l.versao : 1,
  };
}

function eventoDe(l: Record<string, unknown>): Evento {
  return {
    id: texto(l.id),
    contaId: texto(l.conta_id),
    automacaoId: texto(l.automacao_id) || null,
    tipo: (texto(l.tipo) || "comentario") as Evento["tipo"],
    usuario: texto(l.usuario) || null,
    texto: texto(l.texto) || null,
    postId: texto(l.post_id) || null,
    situacao: (texto(l.situacao) || "ignorado") as Evento["situacao"],
    erro: texto(l.erro) || null,
    criadoEm: texto(l.criado_em),
  };
}

function linhaDe(r: AutomacaoRascunho) {
  return {
    nome: r.nome,
    ativa: r.ativa,
    contas: r.contas,
    gatilhos: r.gatilhos,
    posts: r.posts,
    palavras: r.palavras,
    correspondencia: r.correspondencia,
    respostas_publicas: r.respostasPublicas,
    mensagem: r.mensagem,
    botoes: r.botoes,
  };
}

export function lojaSupabase(cliente: Cliente, owner: string): Loja {
  async function painel<T extends RespostaPainel>(pedido: PedidoPainel): Promise<Gravacao<Extract<T, { ok: true }>>> {
    try {
      const { data } = await cliente.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return { tipo: "erro", mensagem: "Sessão expirada. Entre de novo." };
      const resposta = await fetch("/api/automacoes/painel", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(pedido),
      });
      const corpo = (await resposta.json().catch(() => null)) as RespostaPainel | null;
      if (!corpo) return { tipo: "erro", mensagem: `O servidor respondeu ${resposta.status}.` };
      if (!corpo.ok) return { tipo: "erro", mensagem: corpo.erro };
      return { tipo: "ok", valor: corpo as Extract<T, { ok: true }> };
    } catch {
      return { tipo: "erro", mensagem: "Falha de conexão com o servidor." };
    }
  }

  async function atualizar(id: string, versao: number, campos: Record<string, unknown>): Promise<Gravacao<Automacao>> {
    const { data, error } = await cliente
      .from("auto_automacoes")
      .update({ ...campos, versao })
      .eq("id", id)
      .eq("owner", owner)
      .eq("versao", versao)
      .select()
      .maybeSingle();
    if (error) return { tipo: "erro", mensagem: error.message ?? "Não foi possível salvar." };
    if (!data) return { tipo: "conflito" };
    return { tipo: "ok", valor: automacaoDe(data) };
  }

  return {
    async ler() {
      const [contas, automacoes, eventos] = await Promise.all([
        cliente.from("auto_contas").select("*").eq("owner", owner).order("usuario"),
        cliente.from("auto_automacoes").select("*").eq("owner", owner).order("atualizada_em", { ascending: false }),
        cliente.from("auto_eventos").select("*").eq("owner", owner).order("criado_em", { ascending: false }).limit(200),
      ]);
      const erro: Erro = contas.error ?? automacoes.error ?? eventos.error;
      if (semTabela(erro)) return { tipo: "sem-tabela" };
      if (erro) return { tipo: "erro", mensagem: erro.message ?? "Não foi possível ler as automações." };
      return {
        tipo: "ok",
        contas: (contas.data ?? []).map(contaDe),
        automacoes: (automacoes.data ?? []).map(automacaoDe),
        eventos: (eventos.data ?? []).map(eventoDe),
      };
    },
    async criar(rascunho) {
      const { data, error } = await cliente.from("auto_automacoes").insert({ ...linhaDe(rascunho), owner }).select().single();
      if (error || !data) return { tipo: "erro", mensagem: error?.message ?? "Não foi possível criar." };
      return { tipo: "ok", valor: automacaoDe(data) };
    },
    salvar: (id, versao, rascunho) => atualizar(id, versao, linhaDe(rascunho)),
    ligar: (id, versao, ativa) => atualizar(id, versao, { ativa }),
    async excluir(id) {
      const { error } = await cliente.from("auto_automacoes").delete().eq("id", id).eq("owner", owner);
      return error ? { tipo: "erro", mensagem: error.message ?? "Não foi possível excluir." } : { tipo: "ok", valor: undefined };
    },
    async ligarConta(id, ativa) {
      const { error } = await cliente.from("auto_contas").update({ ativa }).eq("id", id).eq("owner", owner);
      return error ? { tipo: "erro", mensagem: error.message ?? "Não foi possível alterar a conta." } : { tipo: "ok", valor: undefined };
    },
    async sincronizarContas() {
      const r = await painel<Extract<RespostaPainel, { acao: "sincronizar-contas" }>>({ acao: "sincronizar-contas" });
      return r.tipo === "ok" ? { tipo: "ok", valor: r.valor.contas } : r;
    },
    async publicacoes(contaId) {
      const r = await painel<Extract<RespostaPainel, { acao: "publicacoes" }>>({ acao: "publicacoes", contaId });
      return r.tipo === "ok" ? { tipo: "ok", valor: r.valor.publicacoes } : r;
    },
    async situacao() {
      const r = await painel<Extract<RespostaPainel, { situacao: SituacaoZernio }>>({ acao: "situacao" });
      return r.tipo === "ok" ? { tipo: "ok", valor: r.valor.situacao } : r;
    },
    async registrarWebhook() {
      const r = await painel<Extract<RespostaPainel, { situacao: SituacaoZernio }>>({ acao: "registrar-webhook" });
      return r.tipo === "ok" ? { tipo: "ok", valor: r.valor.situacao } : r;
    },
  };
}
