import type { ChatMessage, Goal, Insight, InvoiceItem, Transaction } from "../types";

export const categories = ["Alimentação", "Moradia", "Transporte", "Lazer", "Serviços", "Outros"];
export const roundMoney = (value: number) =>
  (Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100)) / 100;
export const isValidMoney = (value: number, allowZero = false) =>
  Number.isFinite(value) &&
  value >= (allowZero ? 0 : 0.01) &&
  value <= 99999999 &&
  Math.abs(value - roundMoney(value)) < 0.000001;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const money = (n: number, cents = false) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents || Math.abs(n - Math.round(n)) > 0.001 ? 2 : 0,
    maximumFractionDigits: cents || Math.abs(n - Math.round(n)) > 0.001 ? 2 : 0,
  });
export const invoiceSample: InvoiceItem[] = [
  { id: "1", name: "Mercado da Vila", amount: 286.9, category: "Alimentação" },
  { id: "2", name: "iFood", amount: 84.9, category: "Alimentação" },
  { id: "3", name: "Uber", amount: 28.5, category: "Transporte" },
  { id: "4", name: "Netflix", amount: 39.9, category: "Serviços", subscription: true },
  { id: "5", name: "Spotify", amount: 21.9, category: "Serviços", subscription: true },
  { id: "6", name: "Amazon Prime", amount: 19.9, category: "Serviços", subscription: true },
  { id: "7", name: "Restaurante", amount: 112, category: "Alimentação" },
  { id: "8", name: "Farmácia", amount: 89.9, category: "Outros" },
  { id: "9", name: "Combustível", amount: 200, category: "Transporte" },
  { id: "10", name: "Loja online", amount: 400.1, category: "Outros" },
];
export function validateFile(file: { size: number; type: string; name: string }) {
  if (file.size === 0) return "Esse arquivo está vazio. Escolha outro arquivo.";
  if (file.size > 10 * 1024 * 1024) return "O arquivo precisa ter até 10 MB.";
  const supported = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (
    !supported.includes(file.type) &&
    !(file.type === "" && /\.(pdf|jpe?g|png|webp)$/i.test(file.name))
  )
    return "Escolha um PDF ou uma foto JPG, PNG ou WebP.";
  return "";
}
export function validateAuth(
  mode: "login" | "signup" | "recovery",
  values: { email: string; password: string; name: string; confirm: string },
) {
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Digite um e-mail válido.";
  if (mode !== "recovery" && values.password.length < 8)
    errors.password = "Use uma senha com pelo menos 8 caracteres.";
  if (mode === "signup") {
    if (values.name.trim().length < 2) errors.name = "Como podemos chamar você?";
    if (values.password !== values.confirm) errors.confirm = "As senhas precisam ser iguais.";
  }
  return errors;
}
export function makeInvoiceTransactions(
  items: InvoiceItem[],
  key: string,
  card: string,
): Transaction[] {
  return items.map((item) => ({
    id: `invoice:${key}:${item.id}`,
    name: item.name,
    amount: item.amount,
    category: item.category,
    card,
    date: today(),
  }));
}
export function mergeInvoice(current: Transaction[], incoming: Transaction[]) {
  const ids = new Set(current.map((t) => t.id));
  return [
    ...incoming.filter((t) => {
      if (ids.has(t.id)) return false;
      ids.add(t.id);
      return true;
    }),
    ...current,
  ];
}
export function getInsight(
  question: string,
  transactions: Transaction[],
  goals: Goal[],
  budget: number,
  hidden = false,
  balance = Number.POSITIVE_INFINITY,
): Insight {
  const q = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const month = transactions.filter((t) => t.date.startsWith(today().slice(0, 7)));
  const spent = month.reduce((s, t) => s + t.amount, 0);
  const fmt = (n: number) => (hidden ? "R$ •••••" : money(n));
  if (/delivery|ifood|rappi/.test(q)) {
    const delivery = month
      .filter((t) => /delivery|ifood|rappi/i.test(t.name))
      .reduce((s, t) => s + t.amount, 0);
    return {
      label: "DELIVERY NESTE MÊS",
      value: fmt(delivery),
      title: delivery ? "Pequenas escolhas abrem espaço." : "Nenhum delivery identificado.",
      body: delivery
        ? `Reduzir esse gasto em 25% libera ${fmt(delivery * 0.25)} no mês. Esse valor pode ir para ${goals[0]?.name || "uma nova meta"}.`
        : "Não há registros com os nomes delivery, iFood ou Rappi neste mês. Adicione uma compra para incluí-la nesta conta.",
    };
  }
  if (/assinatura|netflix|spotify/.test(q)) {
    const subscriptions = month.filter((t) => /assinatura|netflix|spotify|prime/i.test(t.name));
    const total = subscriptions.reduce((s, t) => s + t.amount, 0);
    return {
      label: "ASSINATURAS IDENTIFICADAS PELO NOME",
      value: fmt(total),
      title: `${subscriptions.length} ${subscriptions.length === 1 ? "registro para revisar" : "registros para revisar"}.`,
      body: total
        ? `Se esse total se repetir por 12 meses, serão ${fmt(total * 12)}. Revise o que ainda faz sentido antes de decidir cancelar.`
        : "Não encontrei assinaturas nos nomes dos seus registros deste mês. Nenhum serviço foi cancelado ou alterado.",
    };
  }
  if (/viagem|meta|guardar|objetivo/.test(q)) {
    const goal = goals[0];
    if (!goal)
      return {
        label: "SUA PRÓXIMA CONQUISTA",
        value: fmt(0),
        title: "Comece dando um nome ao seu objetivo.",
        body: "Crie uma meta com valor alvo. Assim, consigo mostrar quanto falta usando seus registros.",
      };
    const missing = Math.max(0, goal.target - goal.saved);
    const monthly = Math.max(0, Math.min(500, budget - spent, balance));
    return {
      label: goal.name.toLocaleUpperCase("pt-BR"),
      value: fmt(missing),
      title: missing ? "É o que falta para chegar lá." : "Você chegou ao valor da sua meta.",
      body:
        missing && monthly
          ? `Com aportes de ${fmt(monthly)} por mês, você completa esse valor em aproximadamente ${Math.ceil(missing / monthly)} meses, sem considerar rendimentos. O aporte só acontece quando você confirma em Metas.`
          : missing
            ? balance <= 0
              ? "Seu saldo disponível não permite um novo aporte agora. Registre ou revise seu dinheiro antes de guardar mais."
              : "Seu orçamento do mês não tem espaço disponível. Revise os gastos ou ajuste o teto antes de planejar um novo aporte."
            : "Seu valor guardado já alcançou o alvo. Você pode escolher seu próximo objetivo em Metas.",
    };
  }
  if (/cartao|cartoes|fatura/.test(q)) {
    const credit = month.filter((t) => t.card !== "Dinheiro / Pix");
    return {
      label: "COMPRAS REGISTRADAS EM CARTÕES",
      value: fmt(credit.reduce((s, t) => s + t.amount, 0)),
      title: `${credit.length} registros neste mês.`,
      body: "Este total considera as compras digitadas ou confirmadas na demonstração. A fatura manual inicial pode ter outros valores; consulte a carteira para ver o limite de cada cartão.",
    };
  }
  const remaining = budget - spent;
  return {
    label: "SEU MÊS EM NÚMEROS",
    value: fmt(spent),
    title:
      remaining >= 0
        ? `${fmt(remaining)} ainda disponíveis no orçamento.`
        : `${fmt(-remaining)} acima do teto planejado.`,
    body: `Seu teto é de ${fmt(budget)}. Este resumo usa ${month.length} registros do mês atual. Você pode perguntar sobre delivery, assinaturas, cartões ou sua próxima meta.`,
  };
}
export function newUserMessage(text: string): ChatMessage {
  return { id: crypto.randomUUID(), role: "user", text };
}
