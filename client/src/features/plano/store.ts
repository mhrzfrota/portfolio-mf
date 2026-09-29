/**
 * Plano: lista simples de anotações em três etapas.
 *
 *   ideia  → algo que já pensei e ainda não decidi fazer
 *   fazer  → decidido, na fila
 *   feito  → executado (o checkbox marcado)
 *
 * Mesmo padrão de Hábitos e Financeiro: estado puro aqui, salvo no
 * localStorage por conta pela página.
 */

export type Etapa = "ideia" | "fazer" | "feito";

export type Item = {
  id: string;
  texto: string;
  etapa: Etapa;
  /** YYYY-MM-DD */
  criadoEm: string;
  /** YYYY-MM-DD, só quando feito */
  feitoEm?: string;
};

export type PlanoState = { itens: Item[] };

export const storageKey = (userId: string) => `mf-plano:v1:${userId}`;

function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

/** Data local em YYYY-MM-DD (toISOString viraria o dia às 21h em Fortaleza). */
export function hojeISO(agora: Date = new Date()): string {
  const m = String(agora.getMonth() + 1).padStart(2, "0");
  const d = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${m}-${d}`;
}

export function adicionar(state: PlanoState, texto: string, etapa: Etapa, hoje = hojeISO()): PlanoState {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return state;
  const item: Item = { id: novoId(), texto: limpo, etapa, criadoEm: hoje, ...(etapa === "feito" ? { feitoEm: hoje } : {}) };
  return { itens: [item, ...state.itens] };
}

/** O checkbox: marca como feito; desmarcar devolve para "vou fazer". */
export function alternarFeito(state: PlanoState, id: string, hoje = hojeISO()): PlanoState {
  return {
    itens: state.itens.map((item) => {
      if (item.id !== id) return item;
      if (item.etapa === "feito") {
        const { feitoEm: _, ...resto } = item;
        return { ...resto, etapa: "fazer" };
      }
      return { ...item, etapa: "feito", feitoEm: hoje };
    }),
  };
}

export function mover(state: PlanoState, id: string, etapa: Exclude<Etapa, "feito">): PlanoState {
  return {
    itens: state.itens.map((item) => {
      if (item.id !== id) return item;
      const { feitoEm: _, ...resto } = item;
      return { ...resto, etapa };
    }),
  };
}

export function remover(state: PlanoState, id: string): PlanoState {
  return { itens: state.itens.filter((item) => item.id !== id) };
}

export function isPlanoState(valor: unknown): valor is PlanoState {
  if (!valor || typeof valor !== "object" || !Array.isArray((valor as PlanoState).itens)) return false;
  return (valor as PlanoState).itens.every(
    (i) =>
      i && typeof i.id === "string" && typeof i.texto === "string" && typeof i.criadoEm === "string" &&
      (i.etapa === "ideia" || i.etapa === "fazer" || i.etapa === "feito"),
  );
}

/**
 * Primeira abertura: o que estava no vault (Foco da semana e notas de projeto)
 * em 28/09/2026, para a lista não nascer vazia.
 */
export function semear(hoje = hojeISO()): PlanoState {
  const item = (texto: string, etapa: Etapa, feitoEm?: string): Item => ({
    id: novoId(), texto, etapa, criadoEm: hoje, ...(feitoEm ? { feitoEm } : {}),
  });
  return {
    itens: [
      item("TS Kite Center: deploy na Vercel para ter link de prévia", "fazer"),
      item("TS Kite Center: pedir fotos, vídeo, produtos, preços e confirmação da logo", "fazer"),
      item("TS Kite Center: versão em inglês", "fazer"),
      item("Gravar reel da TS na praia (só depois da aprovação deles)", "fazer"),
      item("Aplicar a bio nova do Instagram", "fazer"),
      item("Sistema LV: preencher a SUPABASE_SERVICE_ROLE_KEY", "fazer"),
      item("Sistema LV: commitar ou reverter a integração Meta Ads", "fazer"),
      item("Car Store: rodar supabase/04-marcas.sql", "fazer"),
      item("Graniq: marcar data de merge ou declarar pausado", "fazer"),
      item("Bot de IA para responder os leads do tráfego pago da Lopes Veículos (valores e informações do veículo)", "ideia"),
      item("MCP no Claude para subir anúncios no Gerenciador de Anúncios (testar antes)", "ideia"),
      item("Barbershop: dados reais e Supabase (em standby)", "ideia"),
      item("Patrício Lima: ler o perfil e preencher o portfólio (em standby)", "ideia"),
      item("TS Kite Center: permuta fechada por aulas de kite", "feito", "2026-09-28"),
      item("TS Kite Center: base do site no GitHub", "feito", "2026-09-27"),
      item("Lyre Store no ar com pagamento", "feito", "2026-09-23"),
    ],
  };
}
