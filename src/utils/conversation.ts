import type { ConversationTurn } from "../types/contact";

export type ParsedTurn =
  | { speaker: "customer"; text: string }
  | { speaker: "agent"; text: string; sources: string[] };

export function parseTurn(turn: ConversationTurn): ParsedTurn | null {
  if (typeof turn.Customer === "string") {
    return { speaker: "customer", text: turn.Customer };
  }
  const agentText = turn["AI Agent"];
  if (typeof agentText === "string") {
    return { speaker: "agent", text: agentText, sources: turn.Sources ?? [] };
  }
  return null;
}

/** First customer utterance, used as a row preview before a contact is expanded. */
export function previewMessage(conversation: ConversationTurn[]): string {
  const firstCustomerTurn = conversation.find((turn) => typeof turn.Customer === "string");
  return firstCustomerTurn?.Customer ?? "";
}
