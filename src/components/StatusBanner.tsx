interface StatusBannerProps {
  kind: "error" | "loading";
  message: string;
  onRetry?: () => void;
}

export function StatusBanner({ kind, message, onRetry }: StatusBannerProps) {
  return (
    <div className={`status-banner status-banner--${kind}`}>
      <span>{message}</span>
      {kind === "error" && onRetry && (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
