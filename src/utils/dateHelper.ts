export function toISODate(date: Date): string {
  return date.toISOString();
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getPreviousMonth(date: Date): { start: Date; end: Date } {
  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) };
}

export function formatReadable(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toISOStartOfDay(date: Date): string {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.toISOString();
}

export function toISOEndOfDay(date: Date): string {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized.toISOString();
}

