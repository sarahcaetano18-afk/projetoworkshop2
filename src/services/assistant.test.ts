import { test } from "node:test";
import assert from "node:assert/strict";
import { demoAssistantGateway, type AssistantContext } from "./assistant.ts";
import { money } from "../lib/prototype.ts";

const context: AssistantContext = {
  transactions: [],
  goals: [],
  cards: [],
  budget: 3200,
  balance: 1000,
};
test("gateway local responde com o contexto tipado, sem rede", async () => {
  const response = await demoAssistantGateway.reply(
    { question: "Como está meu orçamento?", history: [], context },
    new AbortController().signal,
  );
  assert.equal(response.value, money(0));
  assert.ok(response.title.includes(money(3200)));
});
test("gateway rejeita uma solicitação já cancelada", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    demoAssistantGateway.reply({ question: "delivery", history: [], context }, controller.signal),
    { name: "AbortError" },
  );
});
test("gateway cancela o timer e não conclui uma resposta interrompida", async () => {
  const controller = new AbortController();
  const result = demoAssistantGateway.reply(
    { question: "delivery", history: [], context },
    controller.signal,
  );
  controller.abort();
  await assert.rejects(result, { name: "AbortError" });
});
