interface OutcomeBadgeProps {
  outcome: string;
}

const OUTCOME_STYLES: Record<string, string> = {
  DEFLECTED: "outcome-badge--deflected",
  RESOLVED: "outcome-badge--resolved",
  ESCALATED: "outcome-badge--escalated",
  TRANSFERRED: "outcome-badge--escalated",
  ABANDONED: "outcome-badge--abandoned",
};

export function OutcomeBadge({ outcome }: OutcomeBadgeProps) {
  const styleClass = OUTCOME_STYLES[outcome] ?? "outcome-badge--default";
  return <span className={`outcome-badge ${styleClass}`}>{outcome}</span>;
}
