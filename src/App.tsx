import { lazy, Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Card, Goal, InvoiceItem, Profile, Transaction } from "./types";
import {
  categories,
  isValidMoney,
  makeInvoiceTransactions,
  mergeInvoice,
  money,
  roundMoney,
  today,
} from "./lib/prototype";
import Icon from "./components/Icon";
import { useAssistant } from "./hooks/useAssistant";
import Wallet from "./components/Wallet";
const AuthScreen = lazy(() => import("./components/AuthScreen"));
const InvoiceScreen = lazy(() => import("./components/InvoiceScreen"));
const AssistantScreen = lazy(() => import("./components/AssistantScreen"));

function ScreenLoading() {
  return (
    <div className="screen-loading" role="status">
      <span className="button-spinner" />
      Preparando sua tela…
    </div>
  );
}

type View = "home" | "cards" | "goals" | "invoice" | "assistant" | "login" | "signup";
type Sheet =
  | { type: "expense"; item?: Transaction }
  | { type: "card"; item?: Card }
  | { type: "goal" }
  | { type: "save"; goal: Goal }
  | { type: "budget"; category?: string }
  | { type: "account" }
  | { type: "logout" };
type Data = {
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  budget: number;
  categoryLimits: Record<string, number>;
  hidden: boolean;
  importedStatements?: string[];
};
const seed: Data = {
  transactions: [
    {
      id: "1",
      name: "Mercado",
      amount: 186.9,
      category: "Alimentação",
      card: "Principal",
      date: today(),
    },
    {
      id: "2",
      name: "Assinaturas",
      amount: 39.9,
      category: "Serviços",
      card: "Principal",
      date: today(),
    },
    {
      id: "3",
      name: "Transporte",
      amount: 24,
      category: "Transporte",
      card: "Salário",
      date: today(),
    },
    {
      id: "4",
      name: "Aluguel",
      amount: 1200,
      category: "Moradia",
      card: "Dinheiro / Pix",
      date: today(),
    },
    {
      id: "5",
      name: "Alimentação do mês",
      amount: 513.2,
      category: "Alimentação",
      card: "Principal",
      date: today(),
    },
    {
      id: "6",
      name: "Transporte do mês",
      amount: 376,
      category: "Transporte",
      card: "Salário",
      date: today(),
    },
  ],
  cards: [
    { id: "1", name: "Principal", last: "4552", limit: 3000, bill: 1284, due: 8, color: "lilac" },
    { id: "2", name: "Salário", last: "6917", limit: 5000, bill: 640, due: 12, color: "lime" },
    { id: "3", name: "Viagem", last: "1180", limit: 4000, bill: 98, due: 27, color: "white" },
  ],
  goals: [
    { id: "1", name: "Viagem ao Japão", saved: 13600, target: 20000, date: "2027-12-01" },
    { id: "2", name: "Reserva", saved: 7200, target: 10000, date: "" },
    { id: "3", name: "Curso", saved: 2700, target: 3000, date: "" },
    { id: "4", name: "Carro novo", saved: 9600, target: 40000, date: "" },
  ],
  budget: 3200,
  categoryLimits: { Alimentação: 1200, Moradia: 1200, Transporte: 1000, Lazer: 500 },
  hidden: false,
};
function load(): Data {
  try {
    const saved = localStorage.getItem("eskgo-v1");
    return saved ? JSON.parse(saved) : seed;
  } catch {
    return seed;
  }
}
const asset = (name: string) => `/assets/${name}.svg`;
function DesignIcon({
  name,
}: {
  name: "eye" | "plus" | "card" | "goal" | "bag" | "repeat" | "car";
}) {
  const files = {
    eye: "6daf4",
    plus: "c6246",
    card: "c716b",
    goal: "62a9e",
    bag: "2527c",
    repeat: "a902d",
    car: "c2bd8",
  };
  return <img className="design-icon" src={asset(files[name])} alt="" />;
}
function Avatar() {
  return (
    <span className="avatar" aria-hidden="true">
      <img className="avatar-bg" src={asset("152ef")} alt="" />
      <span className="avatar-portrait">
        <img className="avatar-shirt" src={asset("00a68")} alt="" />
        <img className="avatar-neck" src={asset("96344")} alt="" />
        <img className="avatar-head" src={asset("4565e")} alt="" />
        <img className="avatar-hair" src={asset("89ce5")} alt="" />
        <img className="avatar-expression" src={asset("53de9")} alt="" />
      </span>
    </span>
  );
}
function Progress({ value, lilac = false }: { value: number; lilac?: boolean }) {
  return (
    <div
      className={`progress ${lilac ? "lilac" : ""}`}
      role="progressbar"
      aria-label="Progresso"
      aria-valuenow={Math.round(Math.min(100, value))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const initialFocus =
      ref.current?.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled])") ||
      ref.current?.querySelector<HTMLElement>("button:not([disabled])");
    initialFocus?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const elements = ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <span className="sheet-handle" />
        <div className="sheet-heading">
          <h2 id="sheet-title">{title}</h2>
          <button className="icon-button" onClick={close} aria-label="Fechar">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export default function App() {
  const [data, setData] = useState<Data>(load);
  const [view, setView] = useState<View>("home");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [formError, setFormError] = useState("");
  useEffect(() => setFormError(""), [sheet]);
  const [toast, setToast] = useState("");
  const [allTransactions, setAllTransactions] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [profile, setProfile] = useState<Profile>({ name: "Lucas", email: "lucas@exemplo.com" });
  const [storageError, setStorageError] = useState(false);
  const [recordsRequested, setRecordsRequested] = useState(false);
  const transactionsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (view === "home" && recordsRequested) {
      transactionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setRecordsRequested(false);
    }
  }, [view, recordsRequested]);
  useEffect(() => {
    try {
      localStorage.setItem("eskgo-v1", JSON.stringify(data));
    } catch {
      setStorageError(true);
    }
  }, [data]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const onBack = () => {
      setSheet(null);
      const hash = location.hash.slice(1);
      const views: View[] = ["home", "cards", "goals", "invoice", "assistant", "login", "signup"];
      setView(views.includes(hash as View) ? (hash as View) : "home");
    };
    onBack();
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);
  function navigate(next: View) {
    setSheet(null);
    setView(next);
    history.pushState(null, "", next === "home" ? location.pathname : `#${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const notify = (text: string) => {
    setSheet(null);
    setToast(text);
  };
  const month = today().slice(0, 7);
  const monthly = data.transactions.filter((t) => t.date.startsWith(month));
  const spent = Math.round(monthly.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
  const savedExtra =
    data.goals.reduce((sum, g) => sum + g.saved, 0) -
    seed.goals.reduce((sum, g) => sum + g.saved, 0);
  const balance = roundMoney(
    14500 - (data.transactions.reduce((s, t) => s + t.amount, 0) - 2340) - savedExtra,
  );
  const shown = (n: number, cents = false) => (data.hidden ? "R$ •••••" : money(n, cents));
  const card = data.cards[activeCard] || data.cards[0];
  const cardBill = (c: Card) =>
    roundMoney(
      c.bill +
        data.transactions.filter((t) => t.card === c.name).reduce((s, t) => s + t.amount, 0) -
        seed.transactions
          .filter((t) => t.card === seed.cards.find((original) => original.id === c.id)?.name)
          .reduce((s, t) => s + t.amount, 0),
    );
  const categoryAmount = (category: string) =>
    monthly.filter((t) => t.category === category).reduce((s, t) => s + t.amount, 0);
  const remaining = data.budget - spent;
  const assistant = useAssistant({
    transactions: data.transactions,
    goals: data.goals,
    budget: data.budget,
    balance,
    cards: data.cards.map((c) => ({ ...c, currentBill: cardBill(c) })),
  });
  const close = () => setSheet(null);
  function confirmInvoice(items: InvoiceItem[], key: string, cardId: string) {
    const targetCard = data.cards.find((c) => c.id === cardId);
    if (
      !targetCard ||
      !items.length ||
      items.some(
        (i) => !isValidMoney(i.amount) || !i.name.trim() || !categories.includes(i.category),
      ) ||
      data.importedStatements?.includes(key)
    )
      return false;
    const incoming = makeInvoiceTransactions(items, key, targetCard.name);
    setData((d) =>
      d.importedStatements?.includes(key)
        ? d
        : {
            ...d,
            transactions: mergeInvoice(d.transactions, incoming),
            importedStatements: [...(d.importedStatements || []), key],
          },
    );
    setToast("Fatura de exemplo confirmada. Registros atualizados.");
    return true;
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sheet) return;
    const form = new FormData(e.currentTarget);
    const text = (key: string) => String(form.get(key) || "").trim();
    const amount = Number(text("amount").replace(",", "."));
    if (!isValidMoney(amount)) {
      setFormError("Informe um valor positivo válido, com no máximo duas casas decimais.");
      return;
    }
    if (sheet.type === "expense") {
      const item = {
        id: sheet.item?.id || crypto.randomUUID(),
        name: text("name"),
        amount,
        category: text("category"),
        card: text("card"),
        date: text("date"),
      };
      if (!item.name) {
        setFormError("Dê um nome ao registro.");
        return;
      }
      setData((d) => ({
        ...d,
        transactions: sheet.item
          ? d.transactions.map((t) => (t.id === item.id ? item : t))
          : [item, ...d.transactions],
      }));
      notify(sheet.item ? "Registro atualizado." : "Gasto registrado. Tudo em dia.");
    } else if (sheet.type === "card") {
      const item: Card = {
        id: sheet.item?.id || crypto.randomUUID(),
        name: text("name"),
        last: text("last"),
        limit: amount,
        bill: Number(text("bill")),
        due: Number(text("due")),
        color: sheet.item?.color || ["lilac", "lime", "white"][data.cards.length % 3],
      };
      if (
        !isValidMoney(item.bill, true) ||
        !/^\d{4}$/.test(item.last) ||
        !Number.isInteger(item.due) ||
        item.due < 1 ||
        item.due > 31
      ) {
        setFormError("Confira a fatura, os quatro dígitos e o vencimento de 1 a 31 dias.");
        return;
      }
      if (
        !item.name ||
        data.cards.some(
          (c) =>
            c.name.localeCompare(item.name, "pt-BR", { sensitivity: "base" }) === 0 &&
            c.id !== item.id,
        )
      ) {
        setFormError("Escolha um apelido único para o cartão.");
        return;
      }
      if (sheet.item) {
        const old = sheet.item.name;
        const delta =
          data.transactions.filter((t) => t.card === old).reduce((s, t) => s + t.amount, 0) -
          seed.transactions
            .filter(
              (t) => t.card === seed.cards.find((original) => original.id === sheet.item?.id)?.name,
            )
            .reduce((s, t) => s + t.amount, 0);
        item.bill = roundMoney(item.bill - delta);
        setData((d) => ({
          ...d,
          cards: d.cards.map((c) => (c.id === item.id ? item : c)),
          transactions: d.transactions.map((t) => (t.card === old ? { ...t, card: item.name } : t)),
        }));
      } else setData((d) => ({ ...d, cards: [...d.cards, item] }));
      notify(sheet.item ? "Cartão atualizado." : "Cartão adicionado à carteira.");
    } else if (sheet.type === "goal") {
      if (!text("name")) {
        setFormError("Dê um nome à sua meta.");
        return;
      }
      setData((d) => ({
        ...d,
        goals: [
          ...d.goals,
          {
            id: crypto.randomUUID(),
            name: text("name"),
            target: amount,
            saved: 0,
            date: text("date"),
          },
        ],
      }));
      notify("Uma nova conquista começa aqui.");
    } else if (sheet.type === "save") {
      if (amount > balance) {
        setFormError("O valor é maior que o seu saldo disponível.");
        return;
      }
      setData((d) => ({
        ...d,
        goals: d.goals.map((g) =>
          g.id === sheet.goal.id ? { ...g, saved: roundMoney(g.saved + amount) } : g,
        ),
      }));
      notify(`${money(amount)} guardados. Mais perto da sua meta.`);
    } else if (sheet.type === "budget") {
      setData((d) =>
        sheet.category
          ? { ...d, categoryLimits: { ...d.categoryLimits, [sheet.category]: amount } }
          : { ...d, budget: amount },
      );
      notify("Teto do mês atualizado.");
    }
  }
  function MonthSummary() {
    const legend = [
      { name: "Moradia", color: "var(--eg-lilac)" },
      { name: "Alimentação", color: "var(--eg-lime)" },
      { name: "Transporte", color: "var(--eg-white)" },
    ];
    const comparison = Math.round((1 - spent / (2340 / 0.88)) * 100);
    return (
      <section className="month-panel panel">
        <div className="section-top">
          <span className="kicker">ESTE MÊS</span>
          <span className="month-name">
            {new Date().toLocaleDateString("pt-BR", { month: "long" })}
            <span className="desktop-inline"> · {new Date().getFullYear()}</span>
          </span>
        </div>
        <div className="month-total">{shown(spent)}</div>
        <p className="comparison">
          <span className="comparison-arrow">↘</span> {Math.abs(comparison)}%{" "}
          {comparison >= 0 ? "menos" : "mais"} que no mês anterior
        </p>
        <div
          className="category-chart"
          aria-label="Distribuição dos principais gastos por categoria"
        >
          {legend.map((l) => (
            <span
              key={l.name}
              style={{ flex: categoryAmount(l.name) || 0.01, background: l.color }}
            />
          ))}
        </div>
        <div className="category-legend">
          {legend.map((l) => (
            <div key={l.name}>
              <span className="legend-label">
                <i style={{ background: l.color }} />
                {l.name}
              </span>
              <strong>{shown(categoryAmount(l.name))}</strong>
            </div>
          ))}
        </div>
        <div className="month-bottom desktop-flex">
          <span>Seu mês, sem surpresas.</span>
          <button onClick={() => navigate("goals")} className="text-link">
            Ver metas <Icon name="right" size={14} />
          </button>
        </div>
      </section>
    );
  }
  const primaryGoal = data.goals[0];
  if (view === "login" || view === "signup")
    return (
      <Suspense fallback={<ScreenLoading />}>
        <AuthScreen
          mode={view}
          onMode={navigate}
          onDemo={() => navigate("home")}
          onEnter={(next) => {
            setProfile(next);
            assistant.clear();
            navigate("home");
            setToast("Bem-vindo à demonstração. Seus dados são exemplos locais.");
          }}
        />
      </Suspense>
    );
  return (
    <div className="app-shell">
      <header className="header">
        <button
          className="greeting"
          onClick={() => setSheet({ type: "account" })}
          aria-label={`Abrir conta de ${profile.name}`}
        >
          <Avatar />
          <span>
            <strong>Olá, {profile.name.split(" ")[0]}</strong>
            <small>Seu dinheiro, com clareza.</small>
          </span>
          <span className="greeting-chevron">
            <Icon name="right" size={14} />
          </span>
        </button>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {(
            [
              ["home", "Visão geral"],
              ["invoice", "Fatura"],
              ["cards", "Cartões"],
              ["goals", "Metas"],
            ] as [View, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              className={view === key ? "active" : ""}
              aria-current={view === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="wordmark" onClick={() => navigate("home")} aria-label="Eskgo, início">
          eskgo<span>®</span>
        </button>
      </header>
      <main className="screen-stage" key={view}>
        <Suspense fallback={<ScreenLoading />}>
          {view === "invoice" ? (
            <InvoiceScreen
              cards={data.cards}
              initialCard={card?.id || ""}
              importedKeys={data.importedStatements || []}
              hidden={data.hidden}
              onConfirm={confirmInvoice}
              onBack={() => navigate("home")}
              onRecords={() => {
                navigate("home");
                setAllTransactions(true);
                setRecordsRequested(true);
              }}
              onNewCard={() => setSheet({ type: "card" })}
            />
          ) : view === "assistant" ? (
            <AssistantScreen
              transactions={data.transactions}
              goals={data.goals}
              budget={data.budget}
              hidden={data.hidden}
              messages={assistant.messages}
              status={assistant.status}
              error={assistant.error}
              onSend={assistant.send}
              onCancel={assistant.cancel}
              onRetry={assistant.retry}
              onClear={assistant.clear}
              onBack={() => navigate("goals")}
              onGoals={() => navigate("goals")}
            />
          ) : view === "home" ? (
            <>
              <div className="page-heading home-heading">
                <div>
                  <div className="kicker">MENOS DÚVIDAS. MAIS CONQUISTAS.</div>
                  <h1>
                    Seu dinheiro, no seu controle<span className="lime-text">.</span>
                  </h1>
                </div>
                <span className="date-label">
                  <span className="status-dot" />
                  Tudo começa com um registro.
                </span>
              </div>
              <div className="home-grid">
                <section className="balance-area">
                  <div className="balance-card">
                    <div className="balance-top">
                      <span className="hero-logo">eskgo</span>
                      <button
                        className="eye-button"
                        aria-label={data.hidden ? "Mostrar saldo" : "Ocultar saldo"}
                        onClick={() => setData((d) => ({ ...d, hidden: !d.hidden }))}
                      >
                        {data.hidden ? <Icon name="hide" size={22} /> : <DesignIcon name="eye" />}
                      </button>
                    </div>
                    <div className="balance-label">Seu saldo</div>
                    <div className="balance-number">{shown(balance)}</div>
                    <div className="balance-bottom">
                      <span>Tudo em um só lugar. </span>
                      <span className="hero-stamp">
                        <Icon name="check" size={12} /> DO SEU JEITO
                      </span>
                    </div>
                  </div>
                  <div className="quick-actions is-plus">
                    <button
                      className="quick-action add"
                      onClick={() => setSheet({ type: "expense" })}
                    >
                      <DesignIcon name="plus" />
                      <span>Adicionar</span>
                      <span className="quick-arrow">
                        <Icon name="arrow" size={19} />
                      </span>
                    </button>
                    <button className="quick-action" onClick={() => navigate("invoice")}>
                      <Icon name="file" size={24} />
                      <span>Fatura</span>
                    </button>
                    <button className="quick-action" onClick={() => navigate("cards")}>
                      <DesignIcon name="card" />
                      <span>Cartões</span>
                      <span className="quick-arrow">
                        <Icon name="arrow" size={19} />
                      </span>
                    </button>
                    <button className="quick-action" onClick={() => navigate("goals")}>
                      <DesignIcon name="goal" />
                      <span>Metas</span>
                      <span className="quick-arrow">
                        <Icon name="arrow" size={19} />
                      </span>
                    </button>
                  </div>
                </section>
                <MonthSummary />
                <section className="home-wallet">
                  <div className="section-heading">
                    <h2>Sua carteira</h2>
                    <button className="text-link" onClick={() => navigate("cards")}>
                      Ver cartões{" "}
                      <span className="desktop-inline">
                        <Icon name="arrow" size={15} />
                      </span>
                    </button>
                  </div>
                  <Wallet
                    cards={data.cards}
                    activeCard={activeCard}
                    getBill={cardBill}
                    format={shown}
                    onCycle={() => setActiveCard((activeCard + 1) % data.cards.length)}
                  />
                  {!data.cards.length && (
                    <div className="empty-state">
                      <p>Sua carteira está esperando o primeiro cartão.</p>
                      <button className="text-link" onClick={() => setSheet({ type: "card" })}>
                        Adicionar cartão
                        <Icon name="plus" size={15} />
                      </button>
                    </div>
                  )}
                  <div className="wallet-foot desktop-flex">
                    <span>
                      <span className="status-dot lilac-dot" />
                      {data.cards.length} cartões. Tudo em um só lugar.
                    </span>
                    <span className="card-pagination">
                      {data.cards.map((c, i) => (
                        <button
                          aria-label={`Mostrar cartão ${c.name}`}
                          key={c.id}
                          className={i === activeCard ? "active" : ""}
                          onClick={() => setActiveCard(i)}
                        />
                      ))}
                    </span>
                  </div>
                </section>
                <section className="transactions" ref={transactionsRef}>
                  <div className="section-heading">
                    <h2>Últimos registros</h2>
                    <span className="muted">Hoje</span>
                  </div>
                  <div className="transaction-list">
                    {(allTransactions ? data.transactions : data.transactions.slice(0, 3)).map(
                      (t) => (
                        <button
                          className="transaction"
                          key={t.id}
                          onClick={() => setSheet({ type: "expense", item: t })}
                        >
                          <span className="transaction-icon">
                            <DesignIcon
                              name={
                                t.category === "Transporte"
                                  ? "car"
                                  : t.category === "Serviços"
                                    ? "repeat"
                                    : "bag"
                              }
                            />
                          </span>
                          <span className="transaction-info">
                            <strong>{t.name}</strong>
                            <small>
                              {t.category} · {t.card}
                            </small>
                          </span>
                          <span className="transaction-date desktop-inline">
                            {t.date === today()
                              ? "Hoje"
                              : new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                          </span>
                          <span className="transaction-value">−{shown(t.amount, true)}</span>
                          <span className="transaction-arrow desktop-inline">
                            <Icon name="right" size={16} />
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                  {data.transactions.length === 0 && (
                    <div className="empty-state">
                      <Icon name="wallet" size={28} />
                      <h3>Seu primeiro registro começa aqui.</h3>
                      <p>Fez uma compra? Adicione o valor e acompanhe seu mês.</p>
                      <button className="text-link" onClick={() => setSheet({ type: "expense" })}>
                        Adicionar gasto <Icon name="plus" size={16} />
                      </button>
                    </div>
                  )}
                  <div className="transactions-foot">
                    <span>Você pode editar qualquer registro.</span>
                    {data.transactions.length > 3 && (
                      <button
                        className="text-link"
                        onClick={() => setAllTransactions(!allTransactions)}
                      >
                        {allTransactions ? "Ver menos" : "Ver todos"}{" "}
                        <Icon name="right" size={13} />
                      </button>
                    )}
                  </div>
                </section>
                {primaryGoal && (
                  <button className="home-goal" onClick={() => navigate("goals")}>
                    <span className="goal-mini-icon">
                      <Icon name="target" size={23} />
                    </span>
                    <span>
                      <span className="kicker">A PRÓXIMA CONQUISTA</span>
                      <strong>{primaryGoal.name}</strong>
                      <span className="goal-mini-detail">
                        {Math.round((primaryGoal.saved / primaryGoal.target) * 100)}% do caminho.
                        Continue assim.
                      </span>
                    </span>
                    <span
                      className="mini-ring"
                      style={
                        {
                          "--progress": `${Math.min(100, (primaryGoal.saved / primaryGoal.target) * 100)}%`,
                        } as React.CSSProperties
                      }
                    >
                      <Icon name="arrow" size={18} />
                    </span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <button className="back-link" onClick={() => navigate("home")}>
                    <Icon name="back" size={17} />
                    Visão geral
                  </button>
                  <h1>
                    {view === "cards" ? "Sua carteira" : "Pequenos passos. Grandes conquistas."}
                    <span className="lime-text">.</span>
                  </h1>
                  <p>
                    {view === "cards"
                      ? "Seus cartões, sem perder nada de vista."
                      : "Um plano para o mês. Um espaço para os seus sonhos."}
                  </p>
                </div>
                <button
                  className="primary-button heading-cta"
                  onClick={() => setSheet({ type: view === "cards" ? "card" : "goal" })}
                >
                  <Icon name="plus" size={20} />
                  {view === "cards" ? "Novo cartão" : "Nova meta"}
                </button>
              </div>
              {view === "cards" && !data.cards.length ? (
                <section className="empty-state panel">
                  <Icon name="wallet" size={36} />
                  <h3>Uma carteira do seu jeito.</h3>
                  <p>Adicione seu primeiro cartão para acompanhar faturas e limites à mão.</p>
                  <button className="primary-button" onClick={() => setSheet({ type: "card" })}>
                    Adicionar meu primeiro cartão
                    <Icon name="plus" size={17} />
                  </button>
                </section>
              ) : view === "cards" ? (
                <div className="cards-grid">
                  <section className="wallet-detail">
                    <Wallet
                      large
                      cards={data.cards}
                      activeCard={activeCard}
                      getBill={cardBill}
                      format={shown}
                      onCycle={() => setActiveCard((activeCard + 1) % data.cards.length)}
                    />
                    <p className="wallet-hint">Toque na pilha para trocar de cartão</p>
                    <div className="card-pagination">
                      {data.cards.map((c, i) => (
                        <button
                          aria-label={`Selecionar ${c.name}`}
                          key={c.id}
                          className={i === activeCard ? "active" : ""}
                          onClick={() => setActiveCard(i)}
                        />
                      ))}
                    </div>
                  </section>
                  <section className="panel card-info">
                    <div className="section-heading">
                      <h2>{card.name}</h2>
                      <button
                        className="text-link"
                        onClick={() => setSheet({ type: "card", item: card })}
                      >
                        Editar cartão
                      </button>
                    </div>
                    <div className="limit-value">
                      <span className="muted">Limite usado</span>
                      <strong>
                        {Math.round((cardBill(card) / card.limit) * 100)}
                        <small>%</small>
                      </strong>
                    </div>
                    <Progress value={(cardBill(card) / card.limit) * 100} lilac />
                    <div className="limit-caption">
                      <span>{shown(cardBill(card))} utilizados</span>
                      <span>de {shown(card.limit)}</span>
                    </div>
                    <div className="info-row">
                      <span>Limite disponível</span>
                      <strong>{shown(Math.max(0, card.limit - cardBill(card)))}</strong>
                    </div>
                    <div className="info-row">
                      <span>Vencimento</span>
                      <strong>Em {card.due} dias</strong>
                    </div>
                    <button
                      className="primary-button card-invoice-cta"
                      onClick={() => navigate("invoice")}
                    >
                      <Icon name="file" size={17} />
                      Revisar fatura
                      <Icon name="arrow" size={17} />
                    </button>
                    <div className="note">
                      <Icon name="lock" size={15} />
                      Valores registrados por você. Não conectamos ao seu banco.
                    </div>
                  </section>
                  <section className="upcoming">
                    <div className="section-heading">
                      <h2>Próximas faturas</h2>
                      <span className="muted">Registradas à mão</span>
                    </div>
                    {data.cards.map((c, i) => (
                      <button
                        key={c.id}
                        className="invoice-row"
                        onClick={() => {
                          setActiveCard(i);
                          navigate("invoice");
                        }}
                      >
                        <span className={`mini-card ${c.color}`}>
                          <Icon name="wallet" />
                        </span>
                        <span>
                          <strong>
                            {c.name} <small>•• {c.last}</small>
                          </strong>
                          <small>Vence em {c.due} dias</small>
                        </span>
                        <strong>{shown(cardBill(c))}</strong>
                        <Icon name="right" size={16} />
                      </button>
                    ))}
                  </section>
                </div>
              ) : (
                <div className="goals-grid">
                  <section className="budget-panel panel">
                    <div className="section-top">
                      <span className="kicker">ESTE MÊS</span>
                      <button className="text-link" onClick={() => setSheet({ type: "budget" })}>
                        Ajustar teto <Icon name="arrow" size={14} />
                      </button>
                    </div>
                    <p className="budget-label">
                      {remaining >= 0 ? "Ainda pode gastar" : "Acima do teto"}
                    </p>
                    <div className="budget-number">{shown(Math.abs(remaining))}</div>
                    <p className="muted">de {shown(data.budget)} planejados para o mês</p>
                    <Progress value={(spent / data.budget) * 100} />
                    <div className="budget-caption">
                      <span>{shown(spent)} registrados</span>
                      <span>
                        {Math.max(
                          0,
                          new Date(
                            new Date().getFullYear(),
                            new Date().getMonth() + 1,
                            0,
                          ).getDate() - new Date().getDate(),
                        )}{" "}
                        dias pela frente
                      </span>
                    </div>
                    <div className="budget-categories">
                      {Object.entries(data.categoryLimits).map(([category, limit]) => {
                        const percent = Math.round((categoryAmount(category) / limit) * 100);
                        return (
                          <button
                            key={category}
                            onClick={() => setSheet({ type: "budget", category })}
                          >
                            <div>
                              <span>{category}</span>
                              <strong>{percent}%</strong>
                            </div>
                            <Progress
                              value={percent}
                              lilac={category === "Moradia" || category === "Lazer"}
                            />
                            <small>
                              {shown(categoryAmount(category))} de {shown(limit)}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <section className="savings-section">
                    <div className="section-heading">
                      <h2>O que você está guardando</h2>
                      <button
                        className="icon-button"
                        onClick={() => setSheet({ type: "goal" })}
                        aria-label="Criar meta"
                      >
                        <Icon name="plus" />
                      </button>
                    </div>
                    {data.goals.map((g, i) => (
                      <div className={`saving-card ${i === 0 ? "featured" : ""}`} key={g.id}>
                        <div className="saving-top">
                          <span className="saving-icon">
                            <Icon name={i === 0 ? "arrow" : "target"} size={22} />
                          </span>
                          <span>
                            <h3>{g.name}</h3>
                            <small>
                              {g.saved >= g.target
                                ? "Meta conquistada"
                                : g.date
                                  ? new Date(g.date + "T12:00:00").toLocaleDateString("pt-BR", {
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "No seu tempo"}
                            </small>
                          </span>
                          <strong>
                            {Math.round((g.saved / g.target) * 100)}
                            <small>%</small>
                          </strong>
                        </div>
                        <div className="saving-amount">
                          <strong>{shown(g.saved)}</strong>
                          <span>de {shown(g.target)}</span>
                        </div>
                        <Progress value={(g.saved / g.target) * 100} lilac={i !== 0} />
                        <button
                          className={i === 0 ? "primary-button" : "text-link"}
                          onClick={() => setSheet({ type: "save", goal: g })}
                        >
                          <Icon name="plus" size={17} />
                          {i === 0 ? "Guardar R$ 500" : "Guardar valor"}
                          {i === 0 && <Icon name="arrow" size={17} />}
                        </button>
                      </div>
                    ))}
                    {!data.goals.length && (
                      <div className="empty-state">
                        <Icon name="target" size={32} />
                        <h3>O primeiro passo é dar um nome.</h3>
                        <p>Crie uma meta e comece a guardar no seu ritmo.</p>
                        <button
                          className="primary-button"
                          onClick={() => setSheet({ type: "goal" })}
                        >
                          Criar minha primeira meta
                        </button>
                      </div>
                    )}
                    <button className="assistant-entry" onClick={() => navigate("assistant")}>
                      <span className="assistant-entry-top">
                        <Icon name="sparkle" size={24} />
                        <span>ASSISTENTE ESKGO</span>
                        <span className="assistant-entry-badge">PRÉVIA</span>
                      </span>
                      <strong>
                        Seus números.
                        <br />
                        Um próximo passo.
                      </strong>
                      <p>Explore seus gastos e descubra espaço para a próxima conquista.</p>
                      <span className="assistant-entry-link">
                        Conversar sobre meu dinheiro
                        <Icon name="arrow" size={19} />
                      </span>
                      <small>Demonstração local · sem IA conectada</small>
                    </button>
                  </section>
                </div>
              )}
            </>
          )}
        </Suspense>
      </main>
      <footer className="footer">
        <span className="footer-brand">
          eskgo<span> / </span>
          <span>Seu assistente financeiro para grandes conquistas.</span>
        </span>
        <span className="footer-note">
          <Icon name="lock" size={12} />
          Seus números. Seu ritmo.
        </span>
      </footer>
      <nav className="mobile-nav" aria-label="Navegação mobile">
        <button
          className={`mobile-nav-button ${view === "home" ? "active" : ""}`}
          aria-label="Início"
          title="Início"
          aria-current={view === "home" ? "page" : undefined}
          onClick={() => navigate("home")}
        >
          <img src={asset("17dde")} alt="" />
        </button>
        <button
          className={`mobile-nav-button ${view === "invoice" ? "active" : ""}`}
          aria-label="Fatura"
          title="Fatura"
          aria-current={view === "invoice" ? "page" : undefined}
          onClick={() => navigate("invoice")}
        >
          <img src={asset("9d73c")} alt="" />
        </button>
        <button
          className="mobile-nav-button mobile-nav-action"
          aria-label="Adicionar gasto"
          title="Adicionar gasto"
          onClick={() => setSheet({ type: "expense" })}
        >
          <img className="mobile-nav-gradient" src={asset("bded0")} alt="" />
          <img className="mobile-nav-sparkles" src={asset("daf9b")} alt="" />
        </button>
        <button
          className={`mobile-nav-button ${view === "cards" ? "active" : ""}`}
          aria-label="Cartões"
          title="Cartões"
          aria-current={view === "cards" ? "page" : undefined}
          onClick={() => navigate("cards")}
        >
          <img src={asset("d20a1")} alt="" />
        </button>
        <button
          className={`mobile-nav-button ${view === "goals" ? "active" : ""}`}
          aria-label="Metas"
          title="Metas"
          aria-current={view === "goals" ? "page" : undefined}
          onClick={() => navigate("goals")}
        >
          <img src={asset("f9650")} alt="" />
        </button>
      </nav>
      {storageError && (
        <div className="storage-warning" role="alert">
          Não foi possível salvar neste navegador. Seus registros durarão apenas nesta sessão.
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={16} />
          </span>
          {toast}
          <button
            className="toast-dismiss"
            aria-label="Dispensar aviso"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {sheet && (
        <Modal
          close={close}
          title={
            sheet.type === "expense"
              ? sheet.item
                ? "Detalhe do registro"
                : "Adicionar gasto"
              : sheet.type === "card"
                ? sheet.item
                  ? "Editar cartão"
                  : "Novo cartão"
                : sheet.type === "goal"
                  ? "Uma nova conquista"
                  : sheet.type === "save"
                    ? "Mais perto da sua meta"
                    : sheet.type === "budget"
                      ? `Teto ${sheet.category ? `· ${sheet.category}` : "do mês"}`
                      : sheet.type === "logout"
                        ? "Deseja sair?"
                        : "Sua conta"
          }
        >
          {sheet.type === "account" ? (
            <div className="account-content">
              <div className="account-person">
                <Avatar />
                <div>
                  <h3>{profile.name}</h3>
                  <p>{profile.email}</p>
                </div>
                <span className="demo-badge">DEMO</span>
              </div>
              <button className="secondary-button logout-button" onClick={() => navigate("signup")}>
                <Icon name="plus" size={18} />
                Conhecer o cadastro
              </button>
              <button
                className="account-toggle"
                onClick={() => setData((d) => ({ ...d, hidden: !d.hidden }))}
              >
                <span>Ocultar valores</span>
                <span
                  className={`toggle ${data.hidden ? "on" : ""}`}
                  role="switch"
                  aria-checked={data.hidden}
                  aria-label="Ocultar valores"
                >
                  <i />
                </span>
              </button>
              <div className="note">
                <Icon name="lock" size={17} />
                Esta é uma demonstração. Seus registros ficam somente neste navegador, sem conta ou
                conexão bancária.
              </div>
              <button
                className="secondary-button logout-button"
                onClick={() => setSheet({ type: "logout" })}
              >
                <Icon name="logout" size={18} />
                Sair da demonstração
              </button>
            </div>
          ) : sheet.type === "logout" ? (
            <div className="logout-content">
              <p>
                Seus registros continuam guardados neste navegador. Você pode voltar quando quiser.
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  close();
                  assistant.clear();
                  setProfile({ name: "Lucas", email: "lucas@exemplo.com" });
                  navigate("login");
                }}
              >
                Sim, sair
              </button>
              <button className="secondary-button" onClick={close}>
                Continuar por aqui
              </button>
            </div>
          ) : (
            <form onSubmit={submit} onInput={() => setFormError("")}>
              {formError && (
                <p className="inline-error" role="alert">
                  {formError}
                </p>
              )}
              {sheet.type === "expense" && (
                <>
                  <label className="amount-field">
                    Valor da compra
                    <div>
                      <span>R$</span>
                      <input
                        name="amount"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max="99999999"
                        step="0.01"
                        placeholder="0,00"
                        required
                        defaultValue={sheet.item?.amount}
                      />
                    </div>
                  </label>
                  <label>
                    Nome do registro
                    <input
                      name="name"
                      placeholder="Ex.: Mercado"
                      maxLength={60}
                      required
                      defaultValue={sheet.item?.name}
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Categoria
                      <select name="category" defaultValue={sheet.item?.category || "Alimentação"}>
                        {categories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Forma de pagamento
                      <select name="card" defaultValue={sheet.item?.card || data.cards[0]?.name}>
                        {data.cards.map((c) => (
                          <option key={c.id}>{c.name}</option>
                        ))}
                        <option>Dinheiro / Pix</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Data
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={sheet.item?.date || today()}
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    {sheet.item ? "Salvar alterações" : "Salvar gasto"}
                    <Icon name="check" size={18} />
                  </button>
                  {sheet.item && (
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => {
                        const id = sheet.item!.id;
                        setData((d) => ({
                          ...d,
                          transactions: d.transactions.filter((t) => t.id !== id),
                        }));
                        notify("Registro apagado. Valores atualizados.");
                      }}
                    >
                      Apagar registro
                    </button>
                  )}
                </>
              )}
              {sheet.type === "card" && (
                <>
                  <p className="form-intro">
                    Um apelido e os números que importam. Sem dados sensíveis.
                  </p>
                  <label>
                    Apelido
                    <input
                      name="name"
                      required
                      maxLength={25}
                      placeholder="Ex.: Principal"
                      defaultValue={sheet.item?.name}
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Últimos 4 dígitos
                      <input
                        name="last"
                        inputMode="numeric"
                        pattern="[0-9]{4}"
                        maxLength={4}
                        required
                        placeholder="0000"
                        defaultValue={sheet.item?.last}
                      />
                    </label>
                    <label>
                      Vence em (dias)
                      <input
                        name="due"
                        type="number"
                        min="1"
                        max="31"
                        required
                        defaultValue={sheet.item?.due || 8}
                      />
                    </label>
                  </div>
                  <label>
                    Limite total (R$)
                    <input
                      name="amount"
                      type="number"
                      inputMode="decimal"
                      min=".01"
                      max="99999999"
                      step=".01"
                      required
                      placeholder="3.000"
                      defaultValue={sheet.item?.limit}
                    />
                  </label>
                  <label>
                    Fatura atual registrada (R$)
                    <input
                      name="bill"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="99999999"
                      step=".01"
                      required
                      defaultValue={sheet.item ? cardBill(sheet.item) : 0}
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    Salvar cartão
                    <Icon name="check" size={18} />
                  </button>
                </>
              )}
              {sheet.type === "goal" && (
                <>
                  <p className="form-intro">Dê um nome ao seu próximo passo.</p>
                  <label>
                    Nome da meta
                    <input
                      name="name"
                      placeholder="Ex.: Minha próxima viagem"
                      maxLength={45}
                      required
                    />
                  </label>
                  <label>
                    Quanto quer guardar? (R$)
                    <input
                      name="amount"
                      inputMode="decimal"
                      type="number"
                      min=".01"
                      max="99999999"
                      step=".01"
                      placeholder="20.000"
                      required
                    />
                  </label>
                  <label>
                    Até quando? <span className="muted">(opcional)</span>
                    <input name="date" type="date" min={today()} />
                  </label>
                  <button className="primary-button" type="submit">
                    Criar meta
                    <Icon name="arrow" size={18} />
                  </button>
                </>
              )}
              {sheet.type === "save" && (
                <>
                  <p className="form-intro">
                    {sheet.goal.name} · {shown(sheet.goal.saved)} já guardados
                  </p>
                  <label className="amount-field">
                    Quanto você quer guardar?
                    <div>
                      <span>R$</span>
                      <input
                        name="amount"
                        type="number"
                        inputMode="decimal"
                        min=".01"
                        max={Math.max(0.01, balance)}
                        step=".01"
                        defaultValue={Math.min(500, Math.max(0, balance)) || ""}
                        required
                      />
                    </div>
                  </label>
                  <p className="muted form-intro">
                    O valor sai do seu saldo e entra na sua meta. Disponível: {shown(balance)}.
                  </p>
                  <button className="primary-button" type="submit">
                    Guardar valor
                    <Icon name="check" size={18} />
                  </button>
                </>
              )}
              {sheet.type === "budget" && (
                <>
                  <p className="form-intro">Defina um limite que faça sentido para o seu mês.</p>
                  <label className="amount-field">
                    Quanto pode gastar?
                    <div>
                      <span>R$</span>
                      <input
                        name="amount"
                        type="number"
                        inputMode="decimal"
                        min=".01"
                        max="99999999"
                        step=".01"
                        required
                        defaultValue={
                          sheet.category ? data.categoryLimits[sheet.category] : data.budget
                        }
                      />
                    </div>
                  </label>
                  <button className="primary-button" type="submit">
                    Salvar teto
                    <Icon name="check" size={18} />
                  </button>
                </>
              )}
              <p className="form-footnote">Manual, simples e no seu controle.</p>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
