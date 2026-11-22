import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage, Goal, Transaction } from "../types";
import { money, today } from "../lib/prototype";
import Icon from "./Icon";

type Props = {
  transactions: Transaction[];
  goals: Goal[];
  budget: number;
  hidden: boolean;
  messages: ChatMessage[];
  status: "idle" | "loading" | "error" | "cancelled";
  error: string;
  onSend: (text: string) => void;
  onCancel: () => void;
  onRetry: () => void;
  onClear: () => void;
  onBack: () => void;
  onGoals: () => void;
};
const suggestions = [
  "Quanto gastei com delivery?",
  "Como guardar mais para a viagem?",
  "Quais são minhas assinaturas?",
  "Como está meu orçamento?",
];
export default function AssistantScreen({
  transactions,
  goals,
  budget,
  hidden,
  messages,
  status,
  error,
  onSend,
  onCancel,
  onRetry,
  onClear,
  onBack,
  onGoals,
}: Props) {
  const [draft, setDraft] = useState("");
  const waiting = status === "loading";
  const bottom = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const monthly = transactions.filter((t) => t.date.startsWith(today().slice(0, 7)));
  const spent = monthly.reduce((s, t) => s + t.amount, 0);
  const fmt = (n: number) => (hidden ? "R$ •••••" : money(n));
  useEffect(() => {
    if (!waiting && messages.length) field.current?.focus({ preventScroll: true });
  }, [waiting]);
  useEffect(() => {
    if (messages.length) bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, waiting]);
  function ask(text: string) {
    if (!text.trim() || waiting) return;
    onSend(text.trim());
    setDraft("");
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    ask(draft);
  }
  return (
    <div className="assistant-page">
      <div className="page-heading">
        <div>
          <button className="back-link" onClick={onBack}>
            <Icon name="back" size={17} />
            Metas
          </button>
          <div className="screen-eyebrow">
            <span className="kicker">ASSISTENTE ESKGO</span>
            <span className="plus-badge">PLUS · PRÉVIA</span>
          </div>
          <h1>
            Seu dinheiro faz mais sentido aqui<span className="lime-text">.</span>
          </h1>
          <p>Uma pergunta. Seus números. Um próximo passo.</p>
        </div>
      </div>
      <div className="assistant-layout">
        <section className="chat-panel">
          <div className="chat-panel-header">
            <span className="assistant-avatar">
              <Icon name="sparkle" size={23} />
            </span>
            <span>
              <strong>Assistente Eskgo</strong>
              <small>
                <span className="status-dot lilac-dot" />
                Prévia local · sem IA conectada
              </small>
            </span>
            {messages.length > 0 && (
              <button className="text-link" onClick={onClear}>
                Nova conversa
              </button>
            )}
          </div>
          <div
            className="chat-messages"
            role="log"
            aria-label="Conversa demonstrativa"
            aria-live="polite"
            aria-busy={waiting}
          >
            {!messages.length && (
              <div className="chat-welcome">
                <span className="welcome-sparkle">
                  <Icon name="sparkle" size={34} />
                </span>
                <span className="kicker">MENOS ACHISMO. MAIS CLAREZA.</span>
                <h2>
                  Pergunte sobre
                  <br />
                  seu dinheiro<span>.</span>
                </h2>
                <p>
                  Vamos olhar para o que você já registrou e encontrar espaço para os seus planos.
                </p>
                <div className="chat-suggestions">
                  {suggestions.map((s, i) => (
                    <button key={s} onClick={() => ask(s)}>
                      <Icon name={["wallet", "target", "file", "chat"][i]} size={18} />
                      <span>{s}</span>
                      <Icon name="arrow" size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) =>
              message.role === "user" ? (
                <div className="chat-user" key={message.id}>
                  <span>VOCÊ</span>
                  <p>{message.text}</p>
                </div>
              ) : (
                <div className="chat-answer" key={message.id}>
                  <span className="chat-author">
                    <Icon name="sparkle" size={14} />
                    ESKGO · RESPOSTA LOCAL
                  </span>
                  {message.insight && (
                    <div className="chat-insight">
                      <span className="kicker">{message.insight.label}</span>
                      <strong>{hidden ? "•••••" : message.insight.value}</strong>
                      <h3>
                        {hidden
                          ? "Mostre os valores para consultar este resumo."
                          : message.insight.title}
                      </h3>
                      <p>
                        {hidden
                          ? "Seus números estão ocultos. Altere a visibilidade na Home ou na folha de conta."
                          : message.insight.body}
                      </p>
                    </div>
                  )}
                  <span className="chat-answer-foot">
                    Baseado nos registros da demonstração. Não é recomendação financeira.
                  </span>
                </div>
              ),
            )}
            {waiting && (
              <div className="chat-waiting" role="status">
                <span className="typing-dots">
                  <i />
                  <i />
                  <i />
                </span>
                Conferindo seus registros locais…
                <button className="text-link chat-stop" onClick={onCancel}>
                  Parar resposta
                </button>
              </div>
            )}
            <div ref={bottom} />
          </div>
          {error && (
            <div
              className={`chat-feedback ${status}`}
              role={status === "error" ? "alert" : "status"}
            >
              <Icon name={status === "error" ? "chat" : "close"} size={18} />
              <span>{error}</span>
              <button onClick={onRetry}>
                Tentar novamente
                <Icon name="arrow" size={14} />
              </button>
            </div>
          )}
          {messages.length > 0 && (
            <div className="chat-followups">
              {suggestions.slice(0, 2).map((s) => (
                <button key={s} disabled={waiting} onClick={() => ask(s)}>
                  {s}
                  <Icon name="plus" size={13} />
                </button>
              ))}
            </div>
          )}
          <form className="chat-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="assistant-message">
              Pergunte sobre seu dinheiro
            </label>
            <input
              id="assistant-message"
              ref={field}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Pergunte sobre seu dinheiro…"
              maxLength={500}
              disabled={waiting}
              autoComplete="off"
            />
            <button type="submit" disabled={!draft.trim() || waiting} aria-label="Enviar pergunta">
              <Icon name="send" size={20} />
            </button>
          </form>
          <p className="chat-disclaimer">
            Respostas por regras locais. A OpenAI não está conectada nesta prévia.
          </p>
        </section>
        <aside className="assistant-context">
          <div className="panel">
            <div className="section-top">
              <span className="kicker">O SEU CONTEXTO</span>
              <span className="status-dot" />
            </div>
            <h2>
              Números reais
              <br />
              da sua demonstração.
            </h2>
            <div className="context-stat">
              <span>Registrado neste mês</span>
              <strong>{fmt(spent)}</strong>
            </div>
            <div className="context-stat">
              <span>Ainda no orçamento</span>
              <strong>{fmt(budget - spent)}</strong>
            </div>
            <div className="context-stat">
              <span>Registros no mês</span>
              <strong>{monthly.length}</strong>
            </div>
            <p className="context-note">
              <Icon name="lock" size={14} />
              Só os dados locais deste navegador. Nenhuma mensagem ou arquivo é enviado.
            </p>
          </div>
          {goals[0] && (
            <button className="context-goal" onClick={onGoals}>
              <Icon name="target" size={24} />
              <span>
                <small>SUA PRÓXIMA CONQUISTA</small>
                <strong>{goals[0].name}</strong>
                <span>{Math.round((goals[0].saved / goals[0].target) * 100)}% do caminho</span>
              </span>
              <Icon name="arrow" size={20} />
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
