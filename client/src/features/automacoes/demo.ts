import type { Automacao, Conta, Evento, Publicacao } from "@shared/automacoes/tipos";
import type { Loja } from "./nuvem";

/**
 * Loja de demonstração, em memória: só para a prévia em /dev/automacoes.
 * Nomes genéricos de propósito (o repositório é público).
 */
const agora = Date.now();
const ha = (minutos: number) => new Date(agora - minutos * 60_000).toISOString();

export function lojaDemo(): Loja {
  let contas: Conta[] = [
    { id: "c1", usuario: "loja.exemplo", nome: "Loja Exemplo", foto: null, ativa: true, sincronizadaEm: ha(3) },
    { id: "c2", usuario: "estudio.demo", nome: "Estúdio Demo", foto: null, ativa: true, sincronizadaEm: ha(3) },
    { id: "c3", usuario: "garagem.teste", nome: "Garagem Teste", foto: null, ativa: false, sincronizadaEm: ha(3) },
  ];
  let automacoes: Automacao[] = [
    {
      id: "a1", nome: "Link do catálogo", ativa: true, contas: ["c1", "c2"], gatilhos: ["comentario", "story"], posts: [],
      palavras: ["link", "catálogo", "quero"], correspondencia: "palavra",
      respostasPublicas: ["Te mandei no Direct!", "Olha o Direct, acabei de enviar."],
      mensagem: "Oi {usuario}! Aqui está o catálogo completo, com preço e tamanho de cada peça.",
      botoes: [{ titulo: "Ver catálogo", url: "https://exemplo.com/catalogo" }, { titulo: "Falar no WhatsApp", url: "https://wa.me/5500000000000" }],
      criadaEm: ha(9000), atualizadaEm: ha(120), versao: 4,
    },
    {
      id: "a2", nome: "Preço no Direct", ativa: true, contas: ["c1"], gatilhos: ["direct"], posts: [],
      palavras: ["preço", "valor", "quanto"], correspondencia: "contem", respostasPublicas: [],
      mensagem: "Oi {usuario}, tudo bem? A tabela atualizada está no link abaixo.",
      botoes: [{ titulo: "Ver tabela", url: "https://exemplo.com/precos" }],
      criadaEm: ha(20000), atualizadaEm: ha(4000), versao: 2,
    },
    {
      id: "a3", nome: "Lista de espera do lançamento", ativa: false, contas: ["c2"], gatilhos: ["comentario"], posts: ["p2"],
      palavras: ["eu quero"], correspondencia: "contem", respostasPublicas: ["Anotado! Confere o Direct."],
      mensagem: "Você entrou na lista, {usuario}. Aviso por aqui assim que abrir.", botoes: [],
      criadaEm: ha(600), atualizadaEm: ha(600), versao: 1,
    },
  ];
  const nomes = ["ana.souza", "pedro_lima", "carol.m", "joaovitor", "bia.ferraz", "lucas.dev", "mari_costa", "rafa.n"];
  const eventos: Evento[] = Array.from({ length: 26 }, (_, i) => {
    const tipo = (["comentario", "comentario", "story", "direct"] as const)[i % 4];
    const situacao = i === 4 ? "falhou" : i === 9 ? "incerto" : i % 6 === 5 ? "ignorado" : "enviado";
    return {
      id: `e${i}`, contaId: i % 3 === 0 ? "c2" : "c1", automacaoId: situacao === "ignorado" ? null : tipo === "direct" ? "a2" : "a1", tipo,
      usuario: nomes[i % nomes.length], texto: situacao === "ignorado" ? "que lindo!" : tipo === "direct" ? "qual o valor?" : "LINK",
      postId: tipo === "comentario" ? "p1" : null, situacao, erro: situacao === "falhou" ? "private_reply_consumed" : null, criadoEm: ha(i * 47 + 6),
    };
  });
  const posts: Publicacao[] = Array.from({ length: 8 }, (_, i) => ({
    id: `p${i + 1}`, legenda: ["Coleção nova chegou", "Bastidores do ensaio", "Promo de sexta", "Antes e depois", "Novidade da semana", "Depoimento de cliente", "Como escolher o tamanho", "Últimas unidades"][i],
    miniatura: null, link: null, tipo: (["imagem", "video", "carrossel"] as const)[i % 3], criadaEm: ha(i * 1500 + 300),
  }));
  const espera = <T,>(valor: T) => new Promise<T>((ok) => setTimeout(() => ok(valor), 220));

  return {
    ler: () => espera({ tipo: "ok" as const, contas, automacoes, eventos }),
    async criar(r) {
      const nova: Automacao = { ...r, id: `a${Date.now()}`, criadaEm: new Date().toISOString(), atualizadaEm: new Date().toISOString(), versao: 1 };
      automacoes = [nova, ...automacoes];
      return espera({ tipo: "ok" as const, valor: nova });
    },
    async salvar(id, versao, r) {
      const atual = automacoes.find((a) => a.id === id);
      if (!atual || atual.versao !== versao) return { tipo: "conflito" as const };
      const nova = { ...atual, ...r, versao: versao + 1, atualizadaEm: new Date().toISOString() };
      automacoes = automacoes.map((a) => (a.id === id ? nova : a));
      return espera({ tipo: "ok" as const, valor: nova });
    },
    async ligar(id, versao, ativa) {
      const atual = automacoes.find((a) => a.id === id);
      if (!atual || atual.versao !== versao) return { tipo: "conflito" as const };
      const nova = { ...atual, ativa, versao: versao + 1 };
      automacoes = automacoes.map((a) => (a.id === id ? nova : a));
      return { tipo: "ok" as const, valor: nova };
    },
    async excluir(id) {
      automacoes = automacoes.filter((a) => a.id !== id);
      return { tipo: "ok" as const, valor: undefined };
    },
    async ligarConta(id, ativa) {
      contas = contas.map((c) => (c.id === id ? { ...c, ativa } : c));
      return { tipo: "ok" as const, valor: undefined };
    },
    sincronizarContas: () => espera({ tipo: "ok" as const, valor: contas }),
    publicacoes: () => espera({ tipo: "ok" as const, valor: posts }),
    situacao: () => espera({ tipo: "ok" as const, valor: { chaveConfigurada: true, segredoConfigurado: true, webhookRegistrado: true, webhookUrl: "https://exemplo.com/api/automacoes/webhook" } }),
    registrarWebhook: () => espera({ tipo: "ok" as const, valor: { chaveConfigurada: true, segredoConfigurado: true, webhookRegistrado: true, webhookUrl: "https://exemplo.com/api/automacoes/webhook" } }),
  };
}
