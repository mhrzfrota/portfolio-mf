import assert from "node:assert/strict";
import { test } from "vitest";
import { cleanMerchant, formatCaptureMessage, parseAmount } from "./captura.ts";
import { suggestDefaultCategory } from "./categorize.ts";

test("lê valores em reais nos formatos da Carteira e do Atalhos", () => {
  const examples: [unknown, number][] = [
    [12.5, 12.5], ["R$ 1.234,56", 1234.56], ["1.234,56", 1234.56],
    ["1234,56", 1234.56], ["12,5", 12.5], ["1234.56", 1234.56],
    ["$12.50", 12.5], ["R$ 12", 12], ["  R$\u00a012,50  ", 12.5],
    ["1 234,56", 1234.56], ["12\u202f345,67", 12345.67],
  ];
  for (const [input, expected] of examples) assert.equal(parseAmount(input), expected, String(input));
});

test("converte um sinal negativo em saída positiva", () => {
  for (const input of [-12.5, "-12,5", "-R$ 12,50", "R$ -12,50", "−$12.50"]) {
    assert.equal(parseAmount(input), 12.5, String(input));
  }
});

test("aceita um centavo e o limite exato de cem mil reais", () => {
  for (const amount of [0.01, 1.01, 100000]) assert.equal(parseAmount(amount), amount);
  assert.equal(parseAmount("R$ 100.000,00"), 100000);
});

test("recusa zero, excesso de valor ou de precisão e formatos inválidos", () => {
  for (const input of [
    null, undefined, false, {}, [], NaN, Infinity, -Infinity, "", "  ", "R$", 0, -0, "R$ 0,00",
    100000.01, -100000.01, "100.000,01", 1.001, "12,345", "1.234", "1.000,123",
    "12teste", "13,5reais", "1e3", "1..234,56", "1 2", "1.2,34", "--12", "-R$ -12",
  ]) assert.equal(parseAmount(input), null, String(input));
});

test("limpa espaços sem descaracterizar o nome do estabelecimento", () => {
  assert.equal(cleanMerchant(" \tCafé\u00a0\u00a0da\nPraça  "), "Café da Praça");
  assert.equal(cleanMerchant("99App #123"), "99App #123");
});

test("limita a 120 caracteres sem partir um emoji", () => {
  const name = "a".repeat(119) + "🍰";
  assert.equal(cleanMerchant(name + "b"), name);
  assert.equal(cleanMerchant("a".repeat(119) + " b"), "a".repeat(119));
});

test("recusa estabelecimento vazio ou incompatível com texto no Postgres", () => {
  for (const value of [null, undefined, 42, [], "", "\t\u00a0", "Mercado\0A", "\ud800"]) {
    assert.equal(cleanMerchant(value), null);
  }
});

test("formata a notificação de compra e de repetição", () => {
  const item = { amount: 12.5, title: "iFood", category: "Alimentação" };
  assert.equal(formatCaptureMessage({ ...item, duplicate: false }), "R$ 12,50 · iFood · Alimentação");
  assert.equal(formatCaptureMessage({ ...item, duplicate: true }), "Já registrado: R$ 12,50 · iFood · Alimentação");
});

test("consulta as regras padrão existentes e deixa o desconhecido para a RPC", () => {
  assert.equal(suggestDefaultCategory("PADARIA São José"), "Alimentação");
  assert.equal(suggestDefaultCategory("Farmácia da Praça"), "Saúde");
  assert.equal(suggestDefaultCategory("Loja XZ"), null);
});
