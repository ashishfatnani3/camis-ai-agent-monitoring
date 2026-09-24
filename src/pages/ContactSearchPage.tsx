import { useMemo, useState } from "react";
import { SearchFilters } from "../components/SearchFilters";
import { ContactTable } from "../components/ContactTable";
import { Pagination } from "../components/Pagination";
import { StatusBanner } from "../components/StatusBanner";
import { useContactSearch } from "../hooks/useContactSearch";
import { daysAgoDateInputValue, endOfDayIso, startOfDayIso, todayDateInputValue } from "../utils/date";
import type { Contact, ContactSearchFilters, ContactSearchParams } from "../types/contact";

const DEFAULT_OUTCOMES = ["DEFLECTED", "RESOLVED", "ESCALATED", "TRANSFERRED", "ABANDONED"];

function defaultFilters(): ContactSearchFilters {
  return {
    startDate: daysAgoDateInputValue(7),
    endDate: todayDateInputValue(),
    contactId: "",
    phoneNumber: "",
    outcome: "",
    pageSize: 10,
  };
}

function matchesClientFilters(contact: Contact, filters: ContactSearchFilters): boolean {
  const contactIdMatch =
    !filters.contactId || contact.contactId.toLowerCase().includes(filters.contactId.toLowerCase());
  const phoneMatch =
    !filters.phoneNumber || contact.phoneNumber.toLowerCase().includes(filters.phoneNumber.toLowerCase());
  const outcomeMatch = !filters.outcome || contact.outcome === filters.outcome;
  return contactIdMatch && phoneMatch && outcomeMatch;
}

export function ContactSearchPage() {
  const [filters, setFilters] = useState<ContactSearchFilters>(defaultFilters);
  const [filterFormKey, setFilterFormKey] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [knownOutcomes, setKnownOutcomes] = useState<Set<string>>(new Set(DEFAULT_OUTCOMES));

  const apiParams: ContactSearchParams = useMemo(
    () => ({
      start: startOfDayIso(filters.startDate),
      end: endOfDayIso(filters.endDate),
      page,
      pageSize: filters.pageSize,
      contactId: filters.contactId || undefined,
      phoneNumber: filters.phoneNumber || undefined,
      outcome: filters.outcome || undefined,
    }),
    [filters, page],
  );

  const { data, loading, error, refetch } = useContactSearch(apiParams);

  // Accumulate outcomes seen across fetches (not just the current page) so the
  // filter dropdown doesn't shrink once a narrower result set comes back.
  const [lastSeenData, setLastSeenData] = useState(data);
  if (data && data !== lastSeenData) {
    setLastSeenData(data);
    const next = new Set(knownOutcomes);
    data.calls.forEach((call) => next.add(call.outcome));
    if (next.size !== knownOutcomes.size) {
      setKnownOutcomes(next);
    }
  }

  // The API is queried with these filters too; this guards against a backend
  // that ignores unsupported query params and returns the page unfiltered.
  const visibleContacts = useMemo(
    () => (data ? data.calls.filter((contact) => matchesClientFilters(contact, filters)) : []),
    [data, filters],
  );

  function handleApplyFilters(next: ContactSearchFilters) {
    setFilters(next);
    setPage(1);
  }

  function handleResetFilters() {
    setFilters(defaultFilters());
    setFilterFormKey((key) => key + 1);
    setPage(1);
  }

  function handleToggleContact(contactId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>Contact Search</h1>
        <p className="page__subtitle">
          Monitor self-service conversations between the AI Agent and customers.
        </p>
      </header>

      <SearchFilters
        key={filterFormKey}
        filters={filters}
        outcomeOptions={Array.from(knownOutcomes).sort()}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {error && <StatusBanner kind="error" message={error} onRetry={refetch} />}
      {loading && !error && <StatusBanner kind="loading" message="Loading contacts…" />}

      {!error && (
        <>
          <ContactTable contacts={visibleContacts} expandedIds={expandedIds} onToggle={handleToggleContact} />

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalEntries={data.totalEntries}
              pageSize={data.pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
