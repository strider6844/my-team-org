// Domain types + display metadata for my-team-org.
// Mirrors supabase/migrations/0001_init.sql — do not drift from the schema.

export const RECORD_TYPES = [
  "general",
  "contract",
  "compliance",
  "onboarding",
  "finance",
  "project",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const STATUSES = [
  "open",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export interface TeamMember {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface WorkRecord {
  id: string;
  user_id: string | null;
  title: string;
  record_type: RecordType;
  status: Status;
  assignee_id: string | null;
  notes: string | null;
  due_date: string | null;
  priority: Priority;
  suggested_next_status: string | null;
  suggested_next_status_source: string | null;
  suggested_next_status_confidence: number | null;
  suggested_next_status_review_status: string | null;
  created_at: string;
}

export interface RecordActivity {
  id: string;
  user_id: string | null;
  record_id: string;
  actor_name: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

// ── Display metadata ─────────────────────────────────────────────────────────

export const STATUS_META: Record<
  Status,
  { label: string; badge: string; dot: string }
> = {
  open: {
    label: "Open",
    badge: "bg-slate-100 text-slate-700 ring-slate-600/20",
    dot: "bg-slate-400",
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
  blocked: {
    label: "Blocked",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
  done: {
    label: "Done",
    badge: "bg-green-50 text-green-700 ring-green-600/20",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-neutral-100 text-neutral-500 ring-neutral-500/20",
    dot: "bg-neutral-400",
  },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; badge: string }
> = {
  low: { label: "Low", badge: "bg-neutral-100 text-neutral-600 ring-neutral-500/20" },
  medium: { label: "Medium", badge: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  high: { label: "High", badge: "bg-orange-50 text-orange-700 ring-orange-600/30" },
};

export const TYPE_META: Record<RecordType, { label: string }> = {
  general: { label: "General" },
  contract: { label: "Contract" },
  compliance: { label: "Compliance" },
  onboarding: { label: "Onboarding" },
  finance: { label: "Finance" },
  project: { label: "Project" },
};

export function memberName(
  members: TeamMember[],
  id: string | null,
): string {
  if (!id) return "Unassigned";
  return members.find((m) => m.id === id)?.name ?? "Unknown";
}
