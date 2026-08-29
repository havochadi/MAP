// Session/progress dates are stored as "YYYY-MM-DD" strings, never DateTime —
// this sidesteps timezone bugs entirely since we only ever need "which calendar
// day," never a time-of-day. Singapore is a fixed UTC+8 with no DST.

export function getSingaporeTodayString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date());
}

// Date.UTC + toISOString is used purely as date-only arithmetic on the Y/M/D
// components (never as a real instant), so this stays correct regardless of
// the machine's local timezone.
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDateForDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function isPastOrToday(dateStr: string): boolean {
  return dateStr <= getSingaporeTodayString();
}
