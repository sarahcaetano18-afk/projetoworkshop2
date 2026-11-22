import type { CSSProperties } from "react";
import type { Card } from "../types";

type Props = {
  cards: Card[];
  activeCard: number;
  large?: boolean;
  getBill: (card: Card) => number;
  format: (amount: number) => string;
  onCycle: () => void;
};
export default function Wallet({
  cards,
  activeCard,
  large = false,
  getBill,
  format,
  onCycle,
}: Props) {
  const layers = Math.min(3, cards.length);
  return (
    <div className={`wallet-stack ${large ? "large" : ""}`}>
      {cards.slice(0, 3).map((_, i) => {
        const card = cards[(activeCard + cards.length - (layers - 1 - i)) % cards.length];
        const front = i === layers - 1;
        return (
          <button
            key={card.id}
            className={`wallet-card ${card.color} ${front ? "front" : ""}`}
            style={{ "--layer": i, "--layers": layers } as CSSProperties}
            onClick={onCycle}
            tabIndex={front ? 0 : -1}
            aria-label={`${card.name}, final ${card.last}. Toque para trocar de cartão`}
          >
            <div className="wallet-top">
              <span>
                {card.name}
                <span className="card-digits">•• {card.last}</span>
              </span>
              <span>{Math.round((getBill(card) / card.limit) * 100)}% do limite</span>
            </div>
            {large && (
              <div className="card-middle">
                <span className="chip">
                  <span />
                </span>
                <span className="contactless">)))</span>
                <span className="card-brand">eskgo</span>
              </div>
            )}
            <div className="wallet-bottom">
              <div>
                <span className="small-label">Fatura atual</span>
                <strong>{format(getBill(card))}</strong>
              </div>
              <span>Vence em {card.due} dias</span>
            </div>
          </button>
        );
      })}
      {cards.length > 0 && (
        <span className="sr-only" role="status">
          Cartão {cards[activeCard]?.name || cards[0].name} selecionado.
        </span>
      )}
    </div>
  );
}
