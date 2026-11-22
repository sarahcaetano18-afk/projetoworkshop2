import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import { newUserMessage } from "../lib/prototype";
import {
  demoAssistantGateway,
  type AssistantContext,
  type AssistantGateway,
} from "../services/assistant";

export function useAssistant(
  context: AssistantContext,
  gateway: AssistantGateway = demoAssistantGateway,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "cancelled">("idle");
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const question = useRef("");
  const contextRef = useRef(context);
  const messagesRef = useRef(messages);
  contextRef.current = context;
  messagesRef.current = messages;
  useEffect(() => () => controller.current?.abort(), []);

  async function send(text: string, retry = false) {
    const trimmed = text.trim();
    if (!trimmed || controller.current) return;
    const request = new AbortController();
    controller.current = request;
    question.current = trimmed;
    const next = retry ? messagesRef.current : [...messagesRef.current, newUserMessage(trimmed)];
    messagesRef.current = next;
    setMessages(next);
    setStatus("loading");
    setError("");
    try {
      const insight = await gateway.reply(
        { question: trimmed, history: next, context: contextRef.current },
        request.signal,
      );
      if (controller.current !== request || request.signal.aborted) return;
      const answer: ChatMessage = { id: crypto.randomUUID(), role: "assistant", insight };
      setMessages((current) => [...current, answer]);
      setStatus("idle");
    } catch (cause) {
      if (controller.current !== request || request.signal.aborted) return;
      setStatus("error");
      setError(
        cause instanceof Error && cause.name === "TimeoutError"
          ? "A resposta demorou mais que o esperado. Tente novamente."
          : "Não foi possível preparar a resposta. Sua pergunta está salva; tente novamente.",
      );
    } finally {
      if (controller.current === request) controller.current = null;
    }
  }
  function cancel() {
    controller.current?.abort();
    controller.current = null;
    setStatus("cancelled");
    setError("Resposta interrompida. Você pode tentar novamente ou fazer outra pergunta.");
  }
  function clear() {
    controller.current?.abort();
    controller.current = null;
    question.current = "";
    messagesRef.current = [];
    setMessages([]);
    setStatus("idle");
    setError("");
  }
  return {
    messages,
    status,
    error,
    send,
    cancel,
    clear,
    retry: () => send(question.current, true),
  };
}
