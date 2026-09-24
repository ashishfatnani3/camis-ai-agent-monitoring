/**
 * Shapes returned by the /contact-search Lambda-backed API Gateway endpoint.
 * Each conversation turn is either a customer message or an AI Agent
 * message (optionally carrying the knowledge-base Sources it answered from).
 */
export interface ConversationTurn {
  Customer?: string;
  "AI Agent"?: string;
  Sources?: string[];
}

export interface Contact {
  contactId: string;
  phoneNumber: string;
  startedAt: string;
  outcome: string;
  conversation: ConversationTurn[];
}

export interface ContactSearchResponse {
  start: string;
  end: string;
  page: number;
  pageSize: number;
  totalEntries: number;
  totalPages: number;
  calls: Contact[];
}

export interface ContactSearchParams {
  start?: string;
  end?: string;
  page?: number;
  pageSize?: number;
  contactId?: string;
  phoneNumber?: string;
  outcome?: string;
}

/** Draft filter state held by the search form, in UI-friendly types. */
export interface ContactSearchFilters {
  startDate: string;
  endDate: string;
  contactId: string;
  phoneNumber: string;
  outcome: string;
  pageSize: number;
}
