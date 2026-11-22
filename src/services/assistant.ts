import type { Card, ChatMessage, Goal, Insight, Transaction } from "../types";
import { getInsight } from "../lib/prototype.ts";

export type AssistantContext = {
  transactions: Transaction[];
  goals: Goal[];
  cards: (Card & { currentBill: number })[];
  budget: number;
  balance: number;
};
export type AssistantRequest = {
  question: string;
  history: ChatMessage[];
  context: AssistantContext;
};
export interface AssistantGateway {
  reply(request: AssistantRequest, signal: AbortSignal): Promise<Insight>;
}

// Replace this adapter with a request to your own backend, never directly to OpenAI.
export const demoAssistantGateway: AssistantGateway = {
  reply({ question, context }, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        try {
          resolve(
            getInsight(
              question,
              context.transactions,
              context.goals,
              context.budget,
              false,
              context.balance,
            ),
          );
        } catch (error) {
          reject(error);
        }
      }, 850);
      signal.addEventListener("abort", abort, { once: true });
    });
  },
};
