export interface CouplePlan {
  goal: number; // valor total a juntar (ex.: 10000)
  saved: number; // quanto já está guardado
  monthly: number; // aporte combinado por mês (ex.: 500)
  startMonth: string; // "AAAA-MM"
  deadline: string; // "AAAA-MM" mês limite (inclusive)
}

export const COUPLE_PLAN_KEY = "frtcash-couple-goal-v1";

export const DEFAULT_PLAN: CouplePlan = {
  goal: 10000,
  saved: 0,
  monthly: 500,
  startMonth: "2026-06",
  deadline: "2026-12",
};

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return `${MONTH_LABELS[month - 1]}/${String(year).slice(2)}`;
}

function monthIndex(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  return year * 12 + (month - 1);
}

function indexToMonthKey(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

export interface ScheduleRow {
  monthKey: string;
  contribution: number;
  accumulated: number;
  percent: number;
  reached: boolean;
}

export interface PlanSummary {
  monthsRemaining: number;
  schedule: ScheduleRow[];
  requiredMonthly: number; // aporte/mês necessário para bater a meta no prazo
  projectedEnd: number; // quanto teremos no prazo mantendo o aporte atual
  gap: number; // quanto falta (positivo) ou sobra (negativo) no prazo
  shortfallPerMonth: number; // quanto a mais por mês é preciso aportar
  onTrack: boolean;
  reachedMonthKey: string | null; // mês em que a meta é atingida, se for
}

export function buildPlanSummary(plan: CouplePlan): PlanSummary {
  const startIdx = monthIndex(plan.startMonth);
  const endIdx = monthIndex(plan.deadline);
  const monthsRemaining = Math.max(0, endIdx - startIdx + 1);

  const remainingToGoal = Math.max(0, plan.goal - plan.saved);
  const requiredMonthly = monthsRemaining > 0 ? remainingToGoal / monthsRemaining : Infinity;

  const schedule: ScheduleRow[] = [];
  let accumulated = plan.saved;
  let reachedMonthKey: string | null = plan.saved >= plan.goal ? plan.startMonth : null;

  for (let i = 0; i < monthsRemaining; i += 1) {
    accumulated += plan.monthly;
    const monthKey = indexToMonthKey(startIdx + i);
    const reached = accumulated >= plan.goal;
    if (reached && !reachedMonthKey) reachedMonthKey = monthKey;
    schedule.push({
      monthKey,
      contribution: plan.monthly,
      accumulated,
      percent: plan.goal > 0 ? Math.min(100, (accumulated / plan.goal) * 100) : 100,
      reached,
    });
  }

  const projectedEnd = plan.saved + plan.monthly * monthsRemaining;
  const gap = plan.goal - projectedEnd;
  const onTrack = projectedEnd >= plan.goal;
  const shortfallPerMonth = onTrack ? 0 : Math.max(0, requiredMonthly - plan.monthly);

  return {
    monthsRemaining,
    schedule,
    requiredMonthly,
    projectedEnd,
    gap,
    shortfallPerMonth,
    onTrack,
    reachedMonthKey,
  };
}

export interface Suggestion {
  title: string;
  detail: string;
  estimate: number; // ganho/economia mensal estimado em R$
}

/**
 * Sugestões práticas para fechar a diferença mensal (shortfallPerMonth).
 * As estimativas são escaladas pelo tamanho do buraco para fazer sentido.
 */
export function buildSuggestions(shortfallPerMonth: number): Suggestion[] {
  const gap = Math.max(0, shortfallPerMonth);

  const base: Suggestion[] = [
    {
      title: "Renda extra no fim de semana",
      detail: "Freelas, venda de doces, diárias ou bicos somando algumas horas por semana.",
      estimate: Math.max(150, Math.round((gap * 0.5) / 10) * 10),
    },
    {
      title: "Vender o que está parado",
      detail: "Roupas, eletrônicos e móveis sem uso viram aporte único para acelerar o começo.",
      estimate: Math.max(100, Math.round((gap * 0.3) / 10) * 10),
    },
    {
      title: "Cortar delivery e comer mais em casa",
      detail: "Marmita e compras planejadas costumam liberar uma boa folga todo mês.",
      estimate: Math.max(80, Math.round((gap * 0.35) / 10) * 10),
    },
    {
      title: "Revisar assinaturas e contas",
      detail: "Cancele streamings sem uso e renegocie internet, celular e energia.",
      estimate: Math.max(40, Math.round((gap * 0.2) / 10) * 10),
    },
    {
      title: "Render o que já está guardado",
      detail: "Deixe a reserva num CDB/Tesouro Selic em vez de parada na conta.",
      estimate: Math.max(30, Math.round((gap * 0.15) / 10) * 10),
    },
  ];

  return base.sort((a, b) => b.estimate - a.estimate);
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
