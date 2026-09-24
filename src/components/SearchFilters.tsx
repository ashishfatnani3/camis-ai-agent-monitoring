import { useState, type FormEvent } from "react";
import type { ContactSearchFilters } from "../types/contact";

interface SearchFiltersProps {
  filters: ContactSearchFilters;
  outcomeOptions: string[];
  onApply: (filters: ContactSearchFilters) => void;
  onReset: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

/**
 * Uncontrolled draft state seeded from `filters`. The parent forces a remount
 * (via a changing `key`) whenever it resets filters externally, so the draft
 * re-syncs without needing an effect.
 */
export function SearchFilters({ filters, outcomeOptions, onApply, onReset }: SearchFiltersProps) {
  const [draft, setDraft] = useState<ContactSearchFilters>(filters);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onApply(draft);
  }

  function handleReset() {
    onReset();
  }

  return (
    <form className="search-filters" onSubmit={handleSubmit}>
      <div className="search-filters__row">
        <label className="field">
          <span className="field__label">From</span>
          <input
            type="date"
            value={draft.startDate}
            max={draft.endDate}
            onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
          />
        </label>

        <label className="field">
          <span className="field__label">To</span>
          <input
            type="date"
            value={draft.endDate}
            min={draft.startDate}
            onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
          />
        </label>

        <label className="field field--grow">
          <span className="field__label">Contact ID</span>
          <input
            type="text"
            placeholder="Exact contact ID"
            value={draft.contactId}
            onChange={(e) => setDraft({ ...draft, contactId: e.target.value })}
          />
          <span className="field__hint">Exact match — ignores date range and other filters</span>
        </label>

        <label className="field field--grow">
          <span className="field__label">Phone number</span>
          <input
            type="text"
            placeholder="Search by phone number"
            value={draft.phoneNumber}
            onChange={(e) => setDraft({ ...draft, phoneNumber: e.target.value })}
          />
        </label>

        <label className="field">
          <span className="field__label">Outcome</span>
          <select value={draft.outcome} onChange={(e) => setDraft({ ...draft, outcome: e.target.value })}>
            <option value="">All outcomes</option>
            {outcomeOptions.map((outcome) => (
              <option key={outcome} value={outcome}>
                {outcome}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Page size</span>
          <select
            value={draft.pageSize}
            onChange={(e) => setDraft({ ...draft, pageSize: Number(e.target.value) })}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="search-filters__actions">
        <button type="submit" className="btn btn--primary">
          Search
        </button>
        <button type="button" className="btn btn--secondary" onClick={handleReset}>
          Reset
        </button>
      </div>
    </form>
  );
}
