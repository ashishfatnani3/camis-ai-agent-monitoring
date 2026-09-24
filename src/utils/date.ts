export function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoDateInputValue(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function startOfDayIso(dateInputValue: string): string {
  return `${dateInputValue}T00:00:00.000Z`;
}

export function endOfDayIso(dateInputValue: string): string {
  return `${dateInputValue}T23:59:59.999Z`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
