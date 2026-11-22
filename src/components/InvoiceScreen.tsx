import { useEffect, useRef, useState, type DragEvent } from "react";
import type { Card, InvoiceItem } from "../types";
import { categories, invoiceSample, isValidMoney, money, validateFile } from "../lib/prototype";
import Icon from "./Icon";

type Props = {
  cards: Card[];
  initialCard: string;
  importedKeys: string[];
  hidden: boolean;
  onConfirm: (items: InvoiceItem[], key: string, cardId: string) => boolean;
  onBack: () => void;
  onRecords: () => void;
  onNewCard: () => void;
};
type Step = "choose" | "reading" | "review" | "success";
export default function InvoiceScreen({
  cards,
  initialCard,
  importedKeys,
  hidden,
  onConfirm,
  onBack,
  onRecords,
  onNewCard,
}: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [sample, setSample] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [cardId, setCardId] = useState(initialCard);
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>(invoiceSample.map((i) => ({ ...i })));
  const [selected, setSelected] = useState<string[]>(invoiceSample.map((i) => i.id));
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const confirmed = useRef(false);
  const fmt = (n: number) => (hidden ? "R$ •••••" : money(n, true));
  const card = cards.find((c) => c.id === cardId);
  const fileName = sample ? "fatura-exemplo.pdf" : file?.name;
  const key = `${sample ? "eskgo-example-v1" : `${file?.name}:${file?.size}:${file?.lastModified}`}:${cardId}`;
  const alreadyImported = importedKeys.includes(key);
  const chosen = items.filter((i) => selected.includes(i.id));
  const total =
    Math.round(chosen.reduce((s, i) => s + (Number.isFinite(i.amount) ? i.amount : 0), 0) * 100) /
    100;
  const invalidAmount = chosen.some((i) => !isValidMoney(i.amount));
  useEffect(() => {
    if (!cards.some((c) => c.id === cardId) && cards.length) setCardId(cards[0].id);
  }, [cards, cardId]);
  useEffect(() => {
    if (step !== "reading") return;
    setProgress(0);
    const timer = setInterval(() => setProgress((p) => Math.min(100, p + 20)), 300);
    const finish = setTimeout(() => setStep("review"), 1750);
    return () => {
      clearInterval(timer);
      clearTimeout(finish);
    };
  }, [step]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  function pick(next: File | undefined) {
    if (!next) return;
    const issue = validateFile(next);
    if (issue) {
      setError(issue);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setError("");
    setFile(next);
    setSample(false);
  }
  function drop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  }
  function reset() {
    setStep("choose");
    setFile(null);
    setSample(false);
    setError("");
    setItems(invoiceSample.map((i) => ({ ...i })));
    setSelected(invoiceSample.map((i) => i.id));
    confirmed.current = false;
    if (fileInput.current) fileInput.current.value = "";
  }
  function confirm() {
    if (confirmed.current || !card || !chosen.length || invalidAmount || alreadyImported) return;
    confirmed.current = true;
    if (!onConfirm(chosen, key, card.id)) {
      confirmed.current = false;
      setError("Essa fatura já foi adicionada. Escolha outro arquivo.");
      return;
    }
    setConfirmedTotal(total);
    setConfirmedCount(chosen.length);
    setStep("success");
  }
  return (
    <div className="invoice-page">
      <div className="page-heading">
        <div>
          <button className="back-link" onClick={onBack}>
            <Icon name="back" size={17} />
            Visão geral
          </button>
          <div className="screen-eyebrow">
            <span className="kicker">MENOS TRABALHO. MAIS CLAREZA.</span>
            <span className="plus-badge">PLUS · PRÉVIA</span>
          </div>
          <h1>
            Sua fatura, sem mistério<span className="lime-text">.</span>
          </h1>
          <p>Revise cada compra. Entenda o todo. Você confirma o que entra.</p>
        </div>
      </div>
      <div className="invoice-layout">
        <section className="invoice-main panel">
          <div className="invoice-steps" aria-label="Etapas da fatura">
            {["Escolher", "Revisar", "Confirmar"].map((label, i) => {
              const index = step === "choose" || step === "reading" ? 0 : step === "review" ? 1 : 2;
              return (
                <span
                  key={label}
                  className={i <= index ? "active" : ""}
                  aria-current={i === index ? "step" : undefined}
                >
                  <i>{i < index ? <Icon name="check" size={12} /> : `0${i + 1}`}</i>
                  {label}
                </span>
              );
            })}
          </div>
          {step === "choose" && (
            <>
              <h2 ref={heading} tabIndex={-1}>
                Tudo começa com a sua fatura.
              </h2>
              <p className="screen-description">
                Escolha um arquivo ou explore um exemplo para conhecer o fluxo.
              </p>
              <input
                className="sr-only"
                ref={fileInput}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                aria-label="Selecionar fatura PDF ou foto"
                onChange={(e) => pick(e.target.files?.[0])}
              />
              <button
                className={`upload-zone ${dragging ? "dragging" : ""} ${fileName ? "has-file" : ""}`}
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={drop}
              >
                <span className="upload-icon">
                  <Icon name={fileName ? "file" : "upload"} size={27} />
                </span>
                <strong>{fileName || "Selecione sua fatura"}</strong>
                <span>
                  {fileName
                    ? `${sample ? "Arquivo de exemplo" : `${((file?.size || 0) / 1024).toFixed(0)} KB`} · Toque para substituir`
                    : "ou arraste o arquivo até aqui"}
                </span>
                <small>PDF, JPG, PNG ou WebP · até 10 MB</small>
              </button>
              {fileName && (
                <button
                  className="remove-file"
                  onClick={() => {
                    setFile(null);
                    setSample(false);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                >
                  Remover arquivo
                  <Icon name="close" size={13} />
                </button>
              )}
              <label className="standalone-label">
                Vincular ao cartão
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  disabled={!cards.length}
                >
                  {cards.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name} · final {c.last}
                    </option>
                  ))}
                </select>
              </label>
              {!cards.length && (
                <div className="inline-error">
                  Cadastre um cartão antes de continuar.{" "}
                  <button onClick={onNewCard}>Criar cartão</button>
                </div>
              )}
              <div className="demo-notice">
                <Icon name="sparkle" size={18} />
                <p>
                  <strong>Uma prévia, não uma leitura real.</strong> O arquivo não é enviado nem
                  interpretado. A próxima etapa mostra compras fictícias para validar a experiência.
                </p>
              </div>
              {error && (
                <p className="inline-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="primary-button invoice-continue"
                disabled={!fileName || !card}
                onClick={() => {
                  setError("");
                  setStep("reading");
                }}
              >
                Revisar exemplo com este arquivo
                <Icon name="arrow" size={18} />
              </button>
              {!fileName && (
                <button
                  className="sample-link"
                  onClick={() => {
                    setSample(true);
                    setFile(null);
                    setError("");
                  }}
                >
                  Prefere explorar? Usar fatura de exemplo <Icon name="right" size={14} />
                </button>
              )}
            </>
          )}
          {step === "reading" && (
            <div className="invoice-reading" role="status" aria-live="polite">
              <span className="reading-orbit">
                <Icon name="file" size={40} />
                <span>
                  <Icon name="sparkle" size={18} />
                </span>
              </span>
              <span className="kicker">SIMULAÇÃO LOCAL</span>
              <h2 ref={heading} tabIndex={-1}>
                Preparando sua revisão…
              </h2>
              <p>{fileName}</p>
              <div
                className="invoice-progress"
                role="progressbar"
                aria-label="Progresso da simulação"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
              <span className="reading-status">
                {progress < 40
                  ? "Preparando o exemplo"
                  : progress < 80
                    ? "Organizando compras fictícias"
                    : "Pronto para você conferir"}
              </span>
              <p className="reading-disclaimer">Nenhum dado está sendo extraído do arquivo.</p>
              <button className="text-link" onClick={() => setStep("choose")}>
                Cancelar e voltar
              </button>
            </div>
          )}
          {step === "review" && (
            <>
              <div className="review-heading">
                <div>
                  <h2 ref={heading} tabIndex={-1}>
                    Confira antes de adicionar.
                  </h2>
                  <p className="screen-description">
                    Compras de exemplo. Ajuste os valores e categorias.
                  </p>
                </div>
                <span className="demo-badge">DEMO</span>
              </div>
              <div className="review-summary">
                <div>
                  <span>Selecionadas</span>
                  <strong>{chosen.length} compras</strong>
                </div>
                <div>
                  <span>Assinaturas</span>
                  <strong>{chosen.filter((i) => i.subscription).length}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{fmt(total)}</strong>
                </div>
              </div>
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={selected.length === items.length}
                  onChange={(e) => setSelected(e.target.checked ? items.map((i) => i.id) : [])}
                />
                Selecionar todas
                <span>
                  {card?.name} · •• {card?.last}
                </span>
              </label>
              <div className="review-items">
                {items.map((item) => (
                  <div
                    className={`review-item ${selected.includes(item.id) ? "" : "unselected"}`}
                    key={item.id}
                  >
                    <label className="review-item-name">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={(e) =>
                          setSelected((s) =>
                            e.target.checked ? [...s, item.id] : s.filter((id) => id !== item.id),
                          )
                        }
                      />
                      <span>
                        <strong>{item.name}</strong>
                        {item.subscription && (
                          <small>
                            <Icon name="check" size={10} />
                            Assinatura de exemplo
                          </small>
                        )}
                      </span>
                    </label>
                    <select
                      aria-label={`Categoria de ${item.name}`}
                      value={item.category}
                      onChange={(e) =>
                        setItems((all) =>
                          all.map((i) =>
                            i.id === item.id ? { ...i, category: e.target.value } : i,
                          ),
                        )
                      }
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <label className="review-item-amount">
                      <span className="sr-only">Valor de {item.name} em reais</span>
                      <span aria-hidden="true">R$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min=".01"
                        max="99999999"
                        step=".01"
                        value={Number.isFinite(item.amount) ? item.amount : ""}
                        onChange={(e) =>
                          setItems((all) =>
                            all.map((i) =>
                              i.id === item.id
                                ? {
                                    ...i,
                                    amount: e.target.value === "" ? NaN : Number(e.target.value),
                                  }
                                : i,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
              <div className="review-warning">
                <Icon name="lock" size={15} />
                Somente as compras selecionadas entram nos seus registros locais.
              </div>
              {(error || alreadyImported || invalidAmount) && (
                <p className="inline-error" role="alert">
                  {alreadyImported
                    ? "Esta fatura já foi adicionada a esse cartão. Nenhum registro será duplicado."
                    : invalidAmount
                      ? "Preencha os valores selecionados com um número maior que zero."
                      : error}
                </p>
              )}
              <button
                className="primary-button invoice-continue"
                disabled={!chosen.length || invalidAmount || alreadyImported}
                onClick={confirm}
              >
                Confirmar {chosen.length} {chosen.length === 1 ? "compra" : "compras"}
                <Icon name="check" size={18} />
              </button>
              <button className="sample-link" onClick={reset}>
                Escolher outra fatura
              </button>
            </>
          )}
          {step === "success" && (
            <div className="invoice-success">
              <span className="success-mark">
                <Icon name="check" size={32} />
              </span>
              <span className="kicker">TUDO CONFERIDO POR VOCÊ</span>
              <h2 ref={heading} tabIndex={-1}>
                Mais clareza.
                <br />
                Menos trabalho.
              </h2>
              <p>
                {confirmedCount} compras de exemplo foram adicionadas ao cartão {card?.name}.
              </p>
              <strong>{fmt(confirmedTotal)}</strong>
              <span>Seu saldo, mês e cartão já foram atualizados.</span>
              <button className="primary-button" onClick={onRecords}>
                Ver meus registros
                <Icon name="arrow" size={18} />
              </button>
              <button className="sample-link" onClick={reset}>
                Revisar outra fatura
              </button>
            </div>
          )}
        </section>
        <aside className="invoice-aside">
          <div className="invoice-explainer">
            <span className="lilac-icon">
              <Icon name="sparkle" size={23} />
            </span>
            <span className="kicker">CLAREZA EM CADA ETAPA</span>
            <h2>
              O controle
              <br />
              continua seu<span>.</span>
            </h2>
            <p>Sem compras entrando sozinhas. Sem surpresas no seu mês.</p>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Escolha uma fatura</strong>
                  <p>PDF ou foto. Do jeito mais fácil.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Confira cada registro</strong>
                  <p>Ajuste categorias e valores.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Só entra com seu OK</strong>
                  <p>Tudo junto dos gastos manuais.</p>
                </div>
              </li>
            </ol>
            <div className="aside-foot">
              <Icon name="lock" size={14} />
              Nesta prévia, tudo fica no navegador.
            </div>
          </div>
          <div className="invoice-tip">
            <span className="kicker">BOM SABER</span>
            <p>
              Já digitou uma compra? Desmarque-a na revisão para não contar o mesmo gasto duas
              vezes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
