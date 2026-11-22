import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getInsight,
  invoiceSample,
  makeInvoiceTransactions,
  mergeInvoice,
  money,
  today,
  validateAuth,
  validateFile,
  isValidMoney,
  roundMoney,
} from "./prototype.ts";
import type { Goal, Transaction } from "../types";

test("o exemplo de fatura fecha em R$ 1.284 com 10 compras e 3 assinaturas", () => {
  assert.equal(Math.round(invoiceSample.reduce((s, i) => s + i.amount, 0) * 100), 128400);
  assert.equal(invoiceSample.length, 10);
  assert.equal(invoiceSample.filter((i) => i.subscription).length, 3);
});
test("validar arquivo: aceita PDF e fotos suportadas", () => {
  for (const type of ["application/pdf", "image/jpeg", "image/png", "image/webp"])
    assert.equal(validateFile({ type, name: "arquivo", size: 200 }), "");
  assert.equal(validateFile({ type: "", name: "FATURA.PDF", size: 200 }), "");
});
test("validar arquivo: rejeita vazio, maior que 10 MB e executável", () => {
  assert.notEqual(validateFile({ type: "application/pdf", name: "x.pdf", size: 0 }), "");
  assert.notEqual(
    validateFile({ type: "application/pdf", name: "x.pdf", size: 10 * 1024 * 1024 + 1 }),
    "",
  );
  assert.notEqual(validateFile({ type: "application/x-msdownload", name: "x.pdf", size: 100 }), "");
});
test("confirmar fatura cria lançamentos na data atual e no cartão escolhido", () => {
  const result = makeInvoiceTransactions(invoiceSample.slice(0, 2), "example:1", "Viagem");
  assert.equal(result.length, 2);
  assert.equal(result[0].card, "Viagem");
  assert.equal(result[0].date, today());
  assert.equal(result[0].amount, invoiceSample[0].amount);
});
test("reconfirmar a mesma fatura não duplica os lançamentos", () => {
  const incoming = makeInvoiceTransactions(invoiceSample, "example:1", "Principal");
  const first = mergeInvoice([], incoming);
  const second = mergeInvoice(first, incoming);
  assert.deepEqual(first, second);
});
test("a confirmação mantém os registros manuais e só inclui compras selecionadas", () => {
  const manual: Transaction = {
    id: "manual",
    name: "Café",
    amount: 9.5,
    category: "Alimentação",
    card: "Principal",
    date: today(),
  };
  const incoming = makeInvoiceTransactions(invoiceSample.slice(0, 1), "example:1", "Principal");
  const result = mergeInvoice([manual], incoming);
  assert.equal(result.length, 2);
  assert.equal(result[1].id, "manual");
});
test("assistente calcula delivery com os dados locais, sem inventar um valor", () => {
  const entries = makeInvoiceTransactions(invoiceSample, "example:1", "Principal");
  const answer = getInsight("Quanto gastei com delivery?", entries, [], 3200);
  assert.equal(answer.value, money(84.9));
  assert.ok(answer.body.includes(money(84.9 * 0.25)));
});
test("assistente não inclui compras de outro mês no delivery", () => {
  const entries = makeInvoiceTransactions(invoiceSample, "example:1", "Principal").map((t) => ({
    ...t,
    date: "2000-01-01",
  }));
  assert.equal(getInsight("delivery", entries, [], 3200).value, money(0));
});
test("assistente calcula o restante real da meta", () => {
  const goal: Goal = { id: "1", name: "Viagem ao Japão", saved: 13600, target: 20000, date: "" };
  assert.equal(getInsight("Como guardar para a viagem?", [], [goal], 3200).value, money(6400));
});
test("assistente usa o orçamento e funciona sem lançamentos", () => {
  const answer = getInsight("Como está meu orçamento?", [], [], 3200);
  assert.equal(answer.value, money(0));
  assert.ok(answer.title.includes(money(3200)));
});
test("assistente respeita valores ocultos", () => {
  const answer = getInsight(
    "delivery",
    makeInvoiceTransactions(invoiceSample, "x", "Principal"),
    [],
    3200,
    true,
  );
  assert.equal(answer.value, "R$ •••••");
  assert.ok(!answer.body.includes("84,90"));
});
test("validador futuro de cadastro valida nome, e-mail, senha e confirmação", () => {
  const errors = validateAuth("signup", {
    name: "",
    email: "invalido",
    password: "123",
    confirm: "321",
  });
  assert.equal(Object.keys(errors).length, 4);
  assert.deepEqual(
    validateAuth("signup", {
      name: "Lucas",
      email: "lucas@exemplo.com",
      password: "exemplo123",
      confirm: "exemplo123",
    }),
    {},
  );
});
test("validador de credenciais futuro e recuperação exigem e-mail válido", () => {
  assert.equal(
    Object.keys(validateAuth("login", { name: "", email: "", password: "", confirm: "" })).length,
    2,
  );
  assert.deepEqual(
    validateAuth("recovery", { name: "", email: "lucas@exemplo.com", password: "", confirm: "" }),
    {},
  );
});
test("formatação financeira preserva os centavos", () => {
  assert.ok(money(14500.5).endsWith("14.500,50"));
  assert.ok(money(14500).endsWith("14.500"));
});
test("valores financeiros rejeitam NaN, infinito, negativos e mais de duas casas", () => {
  for (const n of [NaN, Infinity, -1, 0, 0.001, 1.234, 100000000])
    assert.equal(isValidMoney(n), false);
  assert.equal(isValidMoney(0, true), true);
  assert.equal(isValidMoney(50.25), true);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
  assert.equal(roundMoney(-1.005), -1.01);
});
test("IDs repetidos dentro do mesmo lote não duplicam compras", () => {
  const list = makeInvoiceTransactions(invoiceSample.slice(0, 1), "same", "Principal");
  assert.equal(mergeInvoice([], [...list, ...list]).length, 1);
});
test("assistente não sugere aporte acima do saldo disponível", () => {
  const goal: Goal = { id: "1", name: "Viagem", target: 20000, saved: 13600, date: "" };
  const answer = getInsight("guardar para a viagem", [], [goal], 3200, false, 100);
  assert.ok(answer.body.includes(money(100)));
  assert.ok(answer.body.includes("64 meses"));
  assert.ok(getInsight("guardar", [], [goal], 3200, false, 0).body.includes("saldo disponível"));
});
test("assistente calcula assinaturas a partir dos nomes locais", () => {
  const list = makeInvoiceTransactions(invoiceSample, "subscriptions", "Principal");
  const answer = getInsight("Quais são minhas assinaturas?", list, [], 3200);
  assert.equal(answer.value, money(81.7));
  assert.ok(answer.title.includes("3 registros"));
});
test("assistente calcula compras de cartão sem contar dinheiro ou pix", () => {
  const list = makeInvoiceTransactions(invoiceSample, "cards", "Principal");
  list.push({
    id: "pix",
    name: "Café",
    amount: 10,
    category: "Alimentação",
    card: "Dinheiro / Pix",
    date: today(),
  });
  assert.equal(getInsight("cartões", list, [], 3200).value, money(1284));
});
