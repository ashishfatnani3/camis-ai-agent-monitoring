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
  phoneNumber: string | null;
  startedAt: string;
  outcome: string;
  conversation: ConversationTurn[];
}

/** Day-range or phone-number search: a page of results. */
export interface PaginatedContactSearchResponse {
  start?: string;
  end?: string;
  phoneNumber?: string;
  page: number;
  pageSize: number;
  totalEntries: number;
  totalPages: number;
  calls: Contact[];
}

/** Exact contactId lookup: at most one result, no pagination. */
export interface ContactLookupResponse {
  contactId: string;
  callCount: number;
  calls: Contact[];
}

export type ContactSearchResponse = PaginatedContactSearchResponse | ContactLookupResponse;

export function isPaginatedResponse(
  response: ContactSearchResponse,
): response is PaginatedContactSearchResponse {
  return "totalPages" in response;
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
