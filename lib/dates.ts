// Date helpers shared by list, detail, and dashboard.

export function formatDate(d: string | null): string {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(d: string): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate) return false;
  if (status === "done" || status === "cancelled") return false;
  const due = new Date(dueDate + "T00:00:00");
  return due < startOfToday();
}

// Stale: past due by more than `days` and still active. Used to flag records
// that have likely slipped (Sprint 2).
export function isStale(
  dueDate: string | null,
  status: string,
  days = 5,
): boolean {
  if (!dueDate) return false;
  if (status === "done" || status === "cancelled") return false;
  const due = new Date(dueDate + "T00:00:00");
  const cutoff = startOfToday();
  cutoff.setDate(cutoff.getDate() - days);
  return due < cutoff;
}

export function relativeFromNow(d: string): string {
  const date = new Date(d);
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(d.slice(0, 10));
}
