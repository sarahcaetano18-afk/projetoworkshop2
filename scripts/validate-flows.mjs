import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(
  process.env.ESKGO_TEST_TOOLS
    ? resolve(process.env.ESKGO_TEST_TOOLS, "package.json")
    : import.meta.url,
);
const { chromium } = require("playwright");
const base = process.env.ESKGO_TEST_URL || "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const results = [];
const errors = [];
const amount = (text) => Number(text.replace(/[^\d,-]/g, "").replace(",", "."));
const closeTo = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 0.011, `${actual} != ${expected}`);
const check = (name, fn) => async () => {
  await fn();
  results.push(name);
  console.log(`PASS ${name}`);
};
function observe(page) {
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(12000);
}
async function number(page, selector) {
  return amount(await page.locator(selector).innerText());
}
async function navigation(page, view, mobile) {
  const names = { home: "Início", invoice: "Fatura", cards: "Cartões", goals: "Metas" };
  if (mobile)
    await page
      .locator(".mobile-nav")
      .getByRole("button", { name: names[view], exact: true })
      .click();
  else
    await page
      .locator(".desktop-nav")
      .getByRole("button", { name: view === "home" ? "Visão geral" : names[view], exact: true })
      .click();
}

try {
  for (const width of process.env.ESKGO_LAYOUT_ONLY ? [] : [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, locale: "pt-BR" });
    const page = await context.newPage();
    observe(page);
    const mobile = width < 800;
    const nav = (view) => navigation(page, view, mobile);
    await check(`${width}px: login/cadastro livres e saída`, async () => {
      await page.goto(`${base}/#login`);
      await page.getByRole("button", { name: "Entrar na demonstração", exact: true }).click();
      await page.locator(".balance-number").waitFor();
      await page.getByRole("button", { name: "Abrir conta de Lucas" }).click();
      await page.getByRole("button", { name: "Conhecer o cadastro" }).click();
      await page.getByRole("button", { name: "Criar conta de demonstração" }).click();
      closeTo(await number(page, ".balance-number"), 14500);
      await page.getByRole("button", { name: "Abrir conta de Lucas" }).click();
      await page.getByRole("button", { name: "Sair da demonstração" }).click();
      await page.getByRole("button", { name: "Sim, sair", exact: true }).click();
      await page.getByRole("button", { name: "Esqueci minha senha" }).click();
      await page.getByLabel("E-mail", { exact: true }).fill("teste@exemplo.com");
      await page.getByRole("button", { name: "Validar recuperação" }).click();
      await page.getByRole("heading", { name: "Fluxo de recuperação validado." }).waitFor();
      await page.getByRole("button", { name: "Voltar para entrar", exact: true }).click();
      await page.getByRole("button", { name: "Entrar na demonstração", exact: true }).click();
    })();
    await check(`${width}px: gasto com centavos, edição, exclusão e foco`, async () => {
      await page.locator(".quick-action.add").click();
      await page.getByRole("button", { name: "Salvar gasto", exact: true }).click();
      assert.ok(await page.getByRole("dialog").isVisible());
      await page.getByLabel("Valor da compra").fill("50.25");
      await page.getByLabel("Nome do registro").fill("Café de validação");
      await page.getByRole("button", { name: "Salvar gasto", exact: true }).click();
      closeTo(await number(page, ".balance-number"), 14449.75);
      closeTo(await number(page, ".month-total"), 2390.25);
      closeTo(await number(page, ".home-wallet .wallet-card.front .wallet-bottom strong"), 1334.25);
      await page.locator(".transaction").filter({ hasText: "Café de validação" }).click();
      await page.getByLabel("Valor da compra").fill("75.50");
      await page.getByRole("button", { name: "Salvar alterações" }).click();
      closeTo(await number(page, ".balance-number"), 14424.5);
      closeTo(await number(page, ".home-wallet .wallet-card.front .wallet-bottom strong"), 1359.5);
      await page.locator(".transaction").filter({ hasText: "Café de validação" }).click();
      await page.getByRole("button", { name: "Apagar registro" }).click();
      closeTo(await number(page, ".balance-number"), 14500);
      closeTo(await number(page, ".home-wallet .wallet-card.front .wallet-bottom strong"), 1284);
      await page.locator(".quick-action.add").click();
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").count(), 0);
      assert.ok(
        await page.locator(".quick-action.add").evaluate((el) => el === document.activeElement),
      );
    })();
    await check(`${width}px: cartão novo, nome duplicado, edição e troca na pilha`, async () => {
      await nav("cards");
      await page.getByRole("button", { name: "Novo cartão", exact: true }).click();
      await page.getByLabel("Apelido", { exact: true }).fill("Principal");
      await page.getByLabel("Últimos 4 dígitos").fill("9001");
      await page.getByLabel("Vence em (dias)").fill("12");
      await page.getByLabel("Limite total (R$)").fill("2000");
      await page.getByLabel("Fatura atual registrada (R$)").fill("120");
      await page.getByRole("button", { name: "Salvar cartão", exact: true }).click();
      await page.getByRole("alert").filter({ hasText: "apelido único" }).waitFor();
      await page.getByLabel("Apelido", { exact: true }).fill("Validação");
      await page.getByRole("button", { name: "Salvar cartão", exact: true }).click();
      assert.equal(await page.locator(".invoice-row").count(), 4);
      await page.getByRole("button", { name: "Selecionar Validação", exact: true }).click();
      await page.getByRole("button", { name: "Editar cartão", exact: true }).click();
      await page.getByLabel("Apelido", { exact: true }).fill("Reserva viagem");
      await page.getByLabel("Fatura atual registrada (R$)").fill("130");
      await page.getByRole("button", { name: "Salvar cartão", exact: true }).click();
      assert.equal(await page.locator(".card-info h2").innerText(), "Reserva viagem");
      closeTo(await number(page, ".wallet-card.front .wallet-bottom strong"), 130);
      closeTo(amount(await page.locator(".info-row strong").first().innerText()), 1870);
      await page.locator(".wallet-card.front").click();
      assert.notEqual(await page.locator(".card-info h2").innerText(), "Reserva viagem");
      await page.getByRole("button", { name: "Selecionar Principal", exact: true }).click();
      await page.getByRole("button", { name: "Editar cartão", exact: true }).click();
      await page.getByLabel("Apelido", { exact: true }).fill("Principal teste");
      await page.getByRole("button", { name: "Salvar cartão", exact: true }).click();
      closeTo(await number(page, ".wallet-card.front .wallet-bottom strong"), 1284);
      await nav("home");
      await page.locator(".quick-action.add").click();
      await page.getByLabel("Valor da compra").fill("10.10");
      await page.getByLabel("Nome do registro").fill("Compra no cartão renomeado");
      await page.getByRole("button", { name: "Salvar gasto", exact: true }).click();
      await nav("cards");
      closeTo(await number(page, ".wallet-card.front .wallet-bottom strong"), 1294.1);
      await nav("home");
      await page.locator(".transaction").filter({ hasText: "Compra no cartão renomeado" }).click();
      await page.getByRole("button", { name: "Apagar registro" }).click();
      await nav("cards");
      closeTo(await number(page, ".wallet-card.front .wallet-bottom strong"), 1284);
    })();
    await check(
      `${width}px: fatura inválida, cancelar, revisar, confirmar e não duplicar`,
      async () => {
        await page.getByRole("button", { name: "Revisar fatura", exact: true }).click();
        const input = page.getByLabel("Selecionar fatura PDF ou foto");
        await input.setInputFiles({
          name: "invalido.exe",
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("x"),
        });
        await page.getByRole("alert").filter({ hasText: "Escolha um PDF" }).waitFor();
        await input.setInputFiles({
          name: "vazio.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.alloc(0),
        });
        await page.getByRole("alert").filter({ hasText: "vazio" }).waitFor();
        await input.setInputFiles({
          name: "grande.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
        });
        await page.getByRole("alert").filter({ hasText: "10 MB" }).waitFor();
        await page.getByRole("button", { name: /Usar fatura de exemplo/ }).click();
        await page.getByLabel("Vincular ao cartão").selectOption("1");
        await page.getByRole("button", { name: "Revisar exemplo com este arquivo" }).click();
        await page.getByRole("button", { name: "Cancelar e voltar" }).click();
        await page.getByRole("button", { name: "Revisar exemplo com este arquivo" }).click();
        await page.getByRole("heading", { name: "Confira antes de adicionar." }).waitFor();
        await page.getByLabel("Valor de Mercado da Vila em reais").fill("300");
        await page
          .getByLabel("Categoria de Mercado da Vila", { exact: true })
          .selectOption("Moradia");
        await page
          .locator(".review-item")
          .filter({ hasText: "Netflix" })
          .locator('input[type="checkbox"]')
          .uncheck();
        await page.getByRole("button", { name: "Confirmar 9 compras" }).click();
        await page.getByRole("heading", { name: /Mais clareza/ }).waitFor();
        await page.getByRole("button", { name: "Ver meus registros" }).click();
        closeTo(await number(page, ".balance-number"), 13242.8);
        closeTo(await number(page, ".month-total"), 3597.2);
        closeTo(
          await number(page, ".home-wallet .wallet-card.front .wallet-bottom strong"),
          2541.2,
        );
        assert.equal(await page.locator(".transaction").count(), 15);
        await nav("invoice");
        await page.getByRole("button", { name: /Usar fatura de exemplo/ }).click();
        await page.getByLabel("Vincular ao cartão").selectOption("1");
        await page.getByRole("button", { name: "Revisar exemplo com este arquivo" }).click();
        await page.getByRole("alert").filter({ hasText: "já foi adicionada" }).waitFor();
        assert.ok(await page.getByRole("button", { name: "Confirmar 10 compras" }).isDisabled());
      },
    )();
    await check(`${width}px: orçamento, categoria, nova meta e guardar valor`, async () => {
      await nav("goals");
      await page.getByRole("button", { name: "Ajustar teto", exact: true }).click();
      await page.getByLabel("Quanto pode gastar?").fill("5000");
      await page.getByRole("button", { name: "Salvar teto", exact: true }).click();
      closeTo(await number(page, ".budget-number"), 1402.8);
      await page.locator(".budget-categories>button").filter({ hasText: "Alimentação" }).click();
      await page.getByLabel("Quanto pode gastar?").fill("1500");
      await page.getByRole("button", { name: "Salvar teto", exact: true }).click();
      assert.ok(
        (
          await page
            .locator(".budget-categories>button")
            .filter({ hasText: "Alimentação" })
            .innerText()
        ).includes("1.500"),
      );
      await page.getByRole("button", { name: "Nova meta", exact: true }).click();
      await page.getByLabel("Nome da meta").fill("Notebook teste");
      await page.getByLabel("Quanto quer guardar? (R$)").fill("4000");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Criar meta", exact: true })
        .click();
      assert.equal(
        await page.locator(".saving-card").filter({ hasText: "Notebook teste" }).count(),
        1,
      );
      await page.getByRole("button", { name: "Guardar R$ 500", exact: true }).click();
      await page.getByRole("button", { name: "Guardar valor", exact: true }).last().click();
      closeTo(await number(page, ".saving-card.featured .saving-amount strong"), 14100);
      await page.getByRole("button", { name: "Guardar R$ 500", exact: true }).click();
      await page.getByLabel("Quanto você quer guardar?").fill("99999999");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Guardar valor", exact: true })
        .click();
      assert.ok(await page.getByRole("dialog").isVisible());
      assert.ok(
        await page.getByLabel("Quanto você quer guardar?").evaluate((el) => !el.validity.valid),
      );
      await page.keyboard.press("Escape");
      await nav("home");
      closeTo(await number(page, ".balance-number"), 12742.8);
      await nav("goals");
    })();
    await check(
      `${width}px: acessar chat, enviar, parar, tentar novamente e preservar conversa`,
      async () => {
        await page.locator(".assistant-entry").click();
        await page
          .getByRole("button", { name: "Quanto gastei com delivery?", exact: true })
          .click();
        await page.locator(".chat-waiting").waitFor();
        await page.locator(".chat-answer").first().waitFor();
        assert.ok(
          (await page.locator(".chat-insight strong").first().innerText()).includes("84,90"),
        );
        await page
          .getByLabel("Pergunte sobre seu dinheiro", { exact: true })
          .fill("Quais são minhas assinaturas?");
        await page.getByLabel("Pergunte sobre seu dinheiro", { exact: true }).press("Enter");
        await page.locator(".chat-answer").nth(1).waitFor();
        await page
          .getByLabel("Pergunte sobre seu dinheiro", { exact: true })
          .fill("Como está meu orçamento?");
        await page.getByRole("button", { name: "Enviar pergunta", exact: true }).click();
        await page.getByRole("button", { name: "Parar resposta", exact: true }).click();
        await page.locator(".chat-feedback.cancelled").waitFor();
        await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
        await page.locator(".chat-answer").nth(2).waitFor();
        assert.equal(await page.locator(".chat-user").count(), 3);
        await page
          .getByLabel("Pergunte sobre seu dinheiro", { exact: true })
          .fill("Como guardar mais para a viagem?");
        await page.getByRole("button", { name: "Enviar pergunta", exact: true }).click();
        await page
          .getByRole("button", { name: "Metas", exact: true })
          .filter({ has: page.locator("svg") })
          .first()
          .click();
        await page.locator(".assistant-entry").click();
        await page.locator(".chat-answer").nth(3).waitFor();
        assert.equal(await page.locator(".chat-user").count(), 4);
        await page
          .getByLabel("Pergunte sobre seu dinheiro", { exact: true })
          .fill("Como está meu orçamento?");
        await page.getByRole("button", { name: "Enviar pergunta", exact: true }).click();
        await page.getByRole("button", { name: "Nova conversa", exact: true }).click();
        await page
          .getByRole("button", { name: "Quanto gastei com delivery?", exact: true })
          .click();
        await page.locator(".chat-answer").first().waitFor();
        assert.equal(await page.locator(".chat-answer").count(), 1);
        assert.equal(await page.locator(".chat-user").count(), 1);
        await nav("home");
        await page.getByRole("button", { name: "Ocultar saldo", exact: true }).click();
        await nav("goals");
        await page.locator(".assistant-entry").click();
        assert.equal(await page.locator(".chat-insight strong").innerText(), "•••••");
        await nav("home");
        await page.getByRole("button", { name: "Mostrar saldo", exact: true }).click();
        await page.reload();
        await page.locator(".balance-number").waitFor();
        closeTo(await number(page, ".balance-number"), 12742.8);
      },
    )();
    await context.close();
  }
  const context = await browser.newContext({ locale: "pt-BR" });
  const page = await context.newPage();
  observe(page);
  const widths = process.env.ESKGO_TEST_WIDTHS
    ? process.env.ESKGO_TEST_WIDTHS.split(",").map(Number)
    : [360, 390, 440, 768, 800, 1100, 1920, 3840];
  for (const width of widths) {
    await page.setViewportSize({
      width,
      height: width >= 3840 ? 2160 : width >= 1920 ? 1080 : 950,
    });
    for (const route of ["home", "cards", "goals", "invoice", "assistant", "login", "signup"]) {
      await check(`layout ${width}px / ${route}`, async () => {
        await page.goto(`${base}/#${route}`);
        await page
          .locator(
            route === "login" || route === "signup"
              ? ".auth-form-card"
              : route === "home"
                ? ".balance-card"
                : route === "cards"
                  ? ".cards-grid"
                  : route === "goals"
                    ? ".goals-grid"
                    : route === "invoice"
                      ? ".invoice-main"
                      : ".chat-panel",
          )
          .waitFor();
        const dimensions = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        assert.ok(
          dimensions.scroll <= dimensions.width + 1,
          `Overflow: ${JSON.stringify(dimensions)}`,
        );
        if (!["login", "signup"].includes(route)) {
          assert.equal(await page.locator(".mobile-nav").isVisible(), width < 800);
          if (width < 800) {
            const buttons = await page.locator(".mobile-nav-button").evaluateAll((els) =>
              els.map((el) => {
                const r = el.getBoundingClientRect();
                return { width: r.width, height: r.height };
              }),
            );
            assert.ok(buttons.every((r) => Math.abs(r.width - r.height) < 1));
          }
        }
      })();
    }
  }
  await check("movimento reduzido respeitado", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${base}/#home`);
    await page.locator(".balance-card").waitFor();
    assert.equal(
      await page.locator(".screen-stage").evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    assert.equal(
      await page.locator(".screen-stage").evaluate((el) => getComputedStyle(el).animationName),
      "esk-screen-in",
    );
  })();
  assert.deepEqual(errors, [], `Erros de runtime: ${errors.join("\n")}`);
  console.log(
    JSON.stringify({
      passed: results.length,
      runtimeErrors: errors.length,
      widths,
    }),
  );
} finally {
  await browser.close();
}
