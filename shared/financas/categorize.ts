import { EXPENSE_CATEGORIES, type ExpenseCategory, type IncomeSource } from "./wallet.ts";

export interface CategoryRule {
  keyword: string; // já normalizado (minúsculo, sem acento)
  category: ExpenseCategory;
}

/** Minúsculas, sem acentos e com espaços colapsados, base de toda comparação. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrai de uma descrição de extrato uma palavra-chave estável para virar
 * regra: remove números, datas e códigos que mudam a cada compra.
 * "IFD*IFOOD BR 12/06 3x" -> "ifd ifood br"
 */
export function keywordFromDescription(description: string): string {
  const words = normalizeText(description)
    .replace(/[*_/\\|#-]/g, " ")
    .replace(/\b\d+[.,]?\d*\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => word.length > 1);

  return words.slice(0, 3).join(" ");
}

const DEFAULT_EXPENSE_RULES: [string, ExpenseCategory][] = [
  // Transporte
  ["uber", "Transporte"],
  ["99app", "Transporte"],
  ["99 tecnologia", "Transporte"],
  ["cabify", "Transporte"],
  ["metro", "Transporte"],
  ["onibus", "Transporte"],
  ["estacionamento", "Transporte"],
  ["pedagio", "Transporte"],
  ["sem parar", "Transporte"],
  // Gasolina
  ["posto", "Gasolina"],
  ["ipiranga", "Gasolina"],
  ["shell", "Gasolina"],
  ["petrobras", "Gasolina"],
  ["combustivel", "Gasolina"],
  // Alimentação
  ["ifood", "Alimentação"],
  ["ifd", "Alimentação"],
  ["rappi", "Alimentação"],
  ["mercado", "Alimentação"],
  ["supermerc", "Alimentação"],
  ["atacad", "Alimentação"],
  ["carrefour", "Alimentação"],
  ["assai", "Alimentação"],
  ["pao de acucar", "Alimentação"],
  ["padaria", "Alimentação"],
  ["restaurante", "Alimentação"],
  ["lanchonete", "Alimentação"],
  ["pizzaria", "Alimentação"],
  ["hamburg", "Alimentação"],
  ["burger", "Alimentação"],
  ["mc donalds", "Alimentação"],
  ["mcdonalds", "Alimentação"],
  ["acai", "Alimentação"],
  ["cafeteria", "Alimentação"],
  ["hortifruti", "Alimentação"],
  ["acougue", "Alimentação"],
  // Saúde
  ["farmacia", "Saúde"],
  ["drogaria", "Saúde"],
  ["drogasil", "Saúde"],
  ["pague menos", "Saúde"],
  ["raia", "Saúde"],
  ["laboratorio", "Saúde"],
  ["clinica", "Saúde"],
  ["dentista", "Saúde"],
  // Plano saúde
  ["unimed", "Plano saúde"],
  ["hapvida", "Plano saúde"],
  ["amil", "Plano saúde"],
  ["bradesco saude", "Plano saúde"],
  ["sulamerica", "Plano saúde"],
  // Assinaturas
  ["netflix", "Assinaturas"],
  ["spotify", "Assinaturas"],
  ["amazon prime", "Assinaturas"],
  ["prime video", "Assinaturas"],
  ["disney", "Assinaturas"],
  ["hbo", "Assinaturas"],
  ["max.com", "Assinaturas"],
  ["youtube premium", "Assinaturas"],
  ["apple.com", "Assinaturas"],
  ["apple com", "Assinaturas"],
  ["icloud", "Assinaturas"],
  ["google one", "Assinaturas"],
  ["chatgpt", "Assinaturas"],
  ["openai", "Assinaturas"],
  ["anthropic", "Assinaturas"],
  ["claude", "Assinaturas"],
  ["vivo", "Assinaturas"],
  ["claro", "Assinaturas"],
  ["tim s", "Assinaturas"],
  ["oi movel", "Assinaturas"],
  ["academia", "Assinaturas"],
  ["smart fit", "Assinaturas"],
  ["smartfit", "Assinaturas"],
  // Moradia
  ["aluguel", "Moradia"],
  ["condominio", "Moradia"],
  ["imobiliaria", "Moradia"],
  ["iptu", "Moradia"],
  // Contas da casa
  ["enel", "Luz"],
  ["energia", "Luz"],
  ["equatorial", "Luz"],
  ["coelba", "Luz"],
  ["celpe", "Luz"],
  ["cemig", "Luz"],
  ["copel", "Luz"],
  ["light ", "Luz"],
  ["sabesp", "Água"],
  ["embasa", "Água"],
  ["compesa", "Água"],
  ["cagece", "Água"],
  ["caesb", "Água"],
  ["sanepar", "Água"],
  ["saneamento", "Água"],
  ["comgas", "Gás"],
  ["ultragaz", "Gás"],
  ["supergasbras", "Gás"],
  ["copagaz", "Gás"],
  // Lazer
  ["cinema", "Lazer"],
  ["cinemark", "Lazer"],
  ["ingresso", "Lazer"],
  ["steam", "Lazer"],
  ["playstation", "Lazer"],
  ["xbox", "Lazer"],
  ["nintendo", "Lazer"],
  ["show ", "Lazer"],
  ["bar ", "Lazer"],
  ["cervejaria", "Lazer"],
  ["hotel", "Lazer"],
  ["airbnb", "Lazer"],
  ["viagem", "Lazer"],
  ["booking", "Lazer"],
];

const INCOME_RULES: [string, IncomeSource][] = [
  ["salario", "Salário"],
  ["folha", "Salário"],
  ["pagamento de salario", "Salário"],
  ["remuneracao", "Salário"],
  ["pro labore", "Salário"],
  ["prolabore", "Salário"],
  ["rendimento", "Investimentos"],
  ["dividendo", "Investimentos"],
  ["juros", "Investimentos"],
  ["resgate", "Investimentos"],
  ["cashback", "Bônus"],
  ["bonus", "Bônus"],
  ["freela", "Freelancer"],
  ["nota fiscal", "Freelancer"],
];

function isExpenseCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export function toExpenseCategory(value: string): ExpenseCategory {
  return isExpenseCategory(value) ? value : "Outros";
}

/**
 * Sugere categoria de gasto: regras do usuário primeiro (mais específicas
 * ganham), depois as regras padrão. Retorna null quando não reconhece.
 */
export function suggestCategory(description: string, userRules: CategoryRule[]): ExpenseCategory | null {
  const normalized = normalizeText(description);

  const ordered = [...userRules].sort((a, b) => b.keyword.length - a.keyword.length);
  for (const rule of ordered) {
    if (rule.keyword && normalized.includes(rule.keyword)) return rule.category;
  }

  for (const [keyword, category] of DEFAULT_EXPENSE_RULES) {
    if (normalized.includes(keyword)) return category;
  }

  return null;
}

export function suggestDefaultCategory(merchant: string): ExpenseCategory | null {
  return suggestCategory(merchant, []);
}

export function suggestIncomeSource(description: string): IncomeSource {
  const normalized = normalizeText(description);
  for (const [keyword, source] of INCOME_RULES) {
    if (normalized.includes(keyword)) return source;
  }
  return "Outros";
}

/** Marcações típicas de movimentações internas (não são gasto nem renda). */
export function looksLikeInternalTransfer(description: string): boolean {
  const normalized = normalizeText(description);
  return [
    "aplicacao rdb",
    "aplicacao cdb",
    "aplicacao em fundo",
    "resgate rdb",
    "resgate cdb",
    "transferencia entre contas",
    "transf entre contas",
    "pagamento de fatura",
    "pagamento fatura",
    "pgto fatura",
  ].some((keyword) => normalized.includes(keyword));
}
