import { apiGet, CONTACT_SEARCH_PATH } from "./client";
import type { ContactSearchParams, ContactSearchResponse } from "../types/contact";

export function fetchContactSearch(params: ContactSearchParams): Promise<ContactSearchResponse> {
  return apiGet<ContactSearchResponse>(CONTACT_SEARCH_PATH, {
    start: params.start,
    end: params.end,
    page: params.page,
    pageSize: params.pageSize,
    contactId: params.contactId,
    phoneNumber: params.phoneNumber,
    outcome: params.outcome,
  });
}
