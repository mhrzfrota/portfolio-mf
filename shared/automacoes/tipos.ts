/**
 * Automações do Instagram (aba /automacoes do sistema interno).
 * Contrato único entre a tela (client/), as funções do servidor (server/automacoes)
 * e o banco (supabase/migrations/0008_automacoes.sql). Mudou aqui, muda nos três.
 *
 * O envio passa pelo Zernio. A chave do Zernio só existe no servidor.
 */

/** O que dispara a automação. "story" é a resposta em texto a um story (chega como Direct). */
export type Gatilho = "comentario" | "direct" | "story";

/** Como a palavra-chave é comparada com o texto recebido (sem acento, sem maiúscula). */
export type Correspondencia = "contem" | "palavra" | "exata";

export type Botao = { titulo: string; url: string };

/** Conta do Instagram vinda do Zernio. `ativa` diz se esta plataforma responde por ela. */
export type Conta = {
  /** `_id` da conta no Zernio. */
  id: string;
  usuario: string;
  nome: string | null;
  foto: string | null;
  ativa: boolean;
  sincronizadaEm: string;
};

export type Automacao = {
  id: string;
  nome: string;
  ativa: boolean;
  /** Ids de Conta em que ela vale. Vazio = nenhuma (não dispara). */
  contas: string[];
  gatilhos: Gatilho[];
  /** Só para o gatilho "comentario": vazio = qualquer publicação da conta. */
  posts: string[];
  /** Vazio = qualquer texto dispara. */
  palavras: string[];
  correspondencia: Correspondencia;
  /** Variações da resposta pública no comentário; uma é sorteada. Vazio = não responde em público. */
  respostasPublicas: string[];
  /** Mensagem do Direct. Aceita {usuario}. */
  mensagem: string;
  /** Até 2 botões de link no Direct. */
  botoes: Botao[];
  criadaEm: string;
  atualizadaEm: string;
  versao: number;
};

/** Campos que a tela envia ao criar ou editar. */
export type AutomacaoRascunho = Omit<Automacao, "id" | "criadaEm" | "atualizadaEm" | "versao">;

export type SituacaoEvento =
  /** Mensagem entregue ao Zernio. */
  | "enviado"
  /** Chegou, mas nenhuma automação ativa combinou. */
  | "ignorado"
  /** O Zernio recusou. `erro` diz o motivo. */
  | "falhou"
  /** Tempo esgotado ou resposta ambígua: não reenviar sozinho. */
  | "incerto";

export type Evento = {
  /** Chave do comentário ou da mensagem: impede resposta dupla em reentrega do webhook. */
  id: string;
  contaId: string;
  automacaoId: string | null;
  tipo: Gatilho;
  usuario: string | null;
  texto: string | null;
  postId: string | null;
  situacao: SituacaoEvento;
  erro: string | null;
  criadoEm: string;
};

/** Publicação recente de uma conta, para o seletor de posts. */
export type Publicacao = {
  id: string;
  legenda: string | null;
  miniatura: string | null;
  link: string | null;
  tipo: "imagem" | "video" | "carrossel";
  criadaEm: string | null;
};

export const LIMITES = {
  nome: 80,
  palavras: 20,
  palavra: 40,
  respostasPublicas: 5,
  respostaPublica: 300,
  mensagem: 1000,
  botoes: 2,
  botaoTitulo: 20,
  posts: 25,
} as const;

/* ---------- /api/automacoes/painel (POST, JWT do Supabase, só o dono) ---------- */

export type PedidoPainel =
  /** Lê as contas do Zernio, grava em auto_contas (sem mexer em `ativa`) e devolve. */
  | { acao: "sincronizar-contas" }
  /** Últimas publicações da conta, para o seletor. */
  | { acao: "publicacoes"; contaId: string }
  /** Situação da ligação com o Zernio: chave presente, webhook registrado e para onde aponta. */
  | { acao: "situacao" }
  /** Registra (ou atualiza) o webhook desta plataforma no Zernio, sem tocar nos de outros sistemas. */
  | { acao: "registrar-webhook" };

export type RespostaPainel =
  | { ok: true; acao: "sincronizar-contas"; contas: Conta[] }
  | { ok: true; acao: "publicacoes"; publicacoes: Publicacao[] }
  | { ok: true; acao: "situacao" | "registrar-webhook"; situacao: SituacaoZernio }
  | { ok: false; erro: string; codigo?: string };

export type SituacaoZernio = {
  chaveConfigurada: boolean;
  segredoConfigurado: boolean;
  webhookRegistrado: boolean;
  /** Endereço que o Zernio chama (sem segredo). */
  webhookUrl: string | null;
};
