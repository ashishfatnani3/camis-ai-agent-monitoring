interface PaginationProps {
  page: number;
  totalPages: number;
  totalEntries: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalEntries, pageSize, onPageChange }: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const rangeStart = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalEntries);

  return (
    <div className="pagination">
      <span className="pagination__summary">
        {totalEntries === 0
          ? "No contacts"
          : `Showing ${rangeStart}–${rangeEnd} of ${totalEntries} contacts`}
      </span>
      <div className="pagination__controls">
        <button
          type="button"
          className="btn btn--secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="pagination__page">
          Page {page} of {safeTotalPages}
        </span>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
