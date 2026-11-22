export type Transaction = {
  id: string;
  name: string;
  amount: number;
  category: string;
  card: string;
  date: string;
};
export type Card = {
  id: string;
  name: string;
  last: string;
  limit: number;
  bill: number;
  due: number;
  color: string;
};
export type Goal = { id: string; name: string; saved: number; target: number; date: string };
export type Profile = { name: string; email: string };
export type InvoiceItem = {
  id: string;
  name: string;
  amount: number;
  category: string;
  subscription?: boolean;
};
export type Insight = { label: string; value: string; title: string; body: string };
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  insight?: Insight;
};
