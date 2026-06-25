"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  STATUSES,
  STATUS_META,
  memberName,
  type Status,
  type TeamMember,
  type WorkRecord,
} from "@/lib/types";
import { formatDate, isOverdue } from "@/lib/dates";
import { useActor, useToast } from "../providers";
import { PriorityBadge, TypeBadge } from "../components/badges";
import { RecordForm, type RecordFormValues } from "./record-form";
import { createRecord, updateRecordStatus } from "./actions";

interface Props {
  initialRecords: WorkRecord[];
  members: TeamMember[];
}

export function RecordsView({ initialRecords, members }: Props) {
  const [records, setRecords] = useState<WorkRecord[]>(initialRecords);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { actorName, members: ctxMembers } = useActor();
  const roster = ctxMembers.length > 0 ? ctxMembers : members;
  const toast = useToast();
  const supabaseRef = useRef(createClient());

  // Pull the authoritative list from the DB. Called on a timer and on every
  // Realtime event so all open tabs converge on the same state.
  const reload = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from("work_records")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRecords(data as WorkRecord[]);
  }, []);

  // Live updates: Realtime push (instant, once the publication is enabled) +
  // a polling fallback so two tabs stay in sync even without it.
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("work_records_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_records" },
        () => reload(),
      )
      .subscribe();

    const interval = setInterval(reload, 2000);
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [reload]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (assigneeFilter !== "all") {
        if (assigneeFilter === "unassigned" && r.assignee_id) return false;
        if (
          assigneeFilter !== "unassigned" &&
          r.assignee_id !== assigneeFilter
        )
          return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${r.title} ${r.notes ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, statusFilter, assigneeFilter, search]);

  async function handleCreate(values: RecordFormValues) {
    const res = await createRecord({ ...values, actorName });
    if (res.ok && res.data) {
      setRecords((prev) => [res.data as WorkRecord, ...prev]);
      setShowCreate(false);
      toast("Record created");
    } else {
      toast(res.error ?? "Failed to create record", "error");
    }
    return res;
  }

  async function handleStatusChange(rec: WorkRecord, next: Status) {
    if (rec.status === next) return;
    const prevStatus = rec.status;
    // Optimistic: reflect immediately, reconcile on reload.
    setRecords((prev) =>
      prev.map((r) => (r.id === rec.id ? { ...r, status: next } : r)),
    );
    const res = await updateRecordStatus(rec.id, next, actorName);
    if (res.ok) {
      toast(`"${rec.title}" → ${STATUS_META[next].label}`);
      reload();
    } else {
      setRecords((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, status: prevStatus } : r)),
      );
      toast(res.error ?? "Status update failed", "error");
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of records) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [records]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Records</h1>
          <p className="text-sm text-neutral-500">
            {records.length} record{records.length === 1 ? "" : "s"} ·{" "}
            {counts["open"] ?? 0} open · {counts["in_progress"] ?? 0} in progress
            · {counts["blocked"] ?? 0} blocked
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-700"
        >
          + New Record
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or notes…"
          className="w-56 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-neutral-900 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {roster.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {(statusFilter !== "all" ||
          assigneeFilter !== "all" ||
          search.trim()) && (
          <button
            onClick={() => {
              setStatusFilter("all");
              setAssigneeFilter("all");
              setSearch("");
            }}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Clear
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="hidden grid-cols-12 gap-3 border-b border-neutral-100 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-400 sm:grid">
          <div className="col-span-5">Record</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-2">Due</div>
          <div className="col-span-1 text-right">Priority</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState hasRecords={records.length > 0} />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-1 gap-2 px-4 py-3 transition hover:bg-neutral-50 sm:grid-cols-12 sm:items-center sm:gap-3"
              >
                <div className="col-span-5 min-w-0">
                  <Link
                    href={`/records/${r.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {r.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <TypeBadge type={r.record_type} />
                    {isOverdue(r.due_date, r.status) && (
                      <span className="text-xs font-medium text-red-600">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <StatusSelect
                    value={r.status}
                    onChange={(s) => handleStatusChange(r, s)}
                  />
                </div>
                <div className="col-span-2 text-sm text-neutral-600">
                  {memberName(roster, r.assignee_id)}
                </div>
                <div
                  className={`col-span-2 text-sm ${
                    isOverdue(r.due_date, r.status)
                      ? "font-medium text-red-600"
                      : "text-neutral-600"
                  }`}
                >
                  {formatDate(r.due_date)}
                </div>
                <div className="col-span-1 sm:text-right">
                  <PriorityBadge priority={r.priority} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCreate && (
        <Modal title="New Record" onClose={() => setShowCreate(false)}>
          <RecordForm
            members={roster}
            submitLabel="Create record"
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: Status;
  onChange: (s: Status) => void;
}) {
  const m = STATUS_META[value];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset focus:outline-none ${m.badge}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-neutral-900">
          {STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}

function EmptyState({ hasRecords }: { hasRecords: boolean }) {
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-sm font-medium text-neutral-700">
        {hasRecords ? "No records match your filters." : "No records yet."}
      </p>
      <p className="mt-1 text-sm text-neutral-400">
        {hasRecords
          ? "Try clearing the filters above."
          : "Click “New Record” to log the first piece of work."}
      </p>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="mt-8 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
