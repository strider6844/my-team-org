"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  STATUS_META,
  STATUSES,
  TYPE_META,
  PRIORITY_META,
  memberName,
  type RecordActivity,
  type Status,
  type TeamMember,
  type WorkRecord,
} from "@/lib/types";
import { formatDate, formatDateTime, isOverdue, isStale } from "@/lib/dates";
import { useActor, useToast } from "../../providers";
import { StatusBadge, PriorityBadge, TypeBadge } from "../../components/badges";
import { Modal } from "../records-view";
import { RecordForm, type RecordFormValues } from "../record-form";
import { deleteRecord, updateRecord, updateRecordStatus } from "../actions";

interface Props {
  record: WorkRecord;
  members: TeamMember[];
  initialActivities: RecordActivity[];
}

export function RecordDetail({ record: initial, members, initialActivities }: Props) {
  const [record, setRecord] = useState<WorkRecord>(initial);
  const [activities, setActivities] = useState<RecordActivity[]>(initialActivities);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const router = useRouter();
  const { actorName, members: ctxMembers } = useActor();
  const roster = ctxMembers.length > 0 ? ctxMembers : members;
  const toast = useToast();
  const supabase = createClient();

  const reload = useCallback(async () => {
    const [rec, acts] = await Promise.all([
      supabase.from("work_records").select("*").eq("id", initial.id).maybeSingle(),
      supabase
        .from("record_activities")
        .select("*")
        .eq("record_id", initial.id)
        .order("created_at", { ascending: false }),
    ]);
    if (rec.data) setRecord(rec.data as WorkRecord);
    if (acts.data) setActivities(acts.data as RecordActivity[]);
  }, [initial.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(reload, 3000);
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [reload]);

  async function handleStatus(next: Status) {
    if (next === record.status) return;
    const prev = record.status;
    setRecord((r) => ({ ...r, status: next }));
    const res = await updateRecordStatus(record.id, next, actorName);
    if (res.ok) {
      toast(`Status → ${STATUS_META[next].label}`);
      reload();
    } else {
      setRecord((r) => ({ ...r, status: prev }));
      toast(res.error ?? "Update failed", "error");
    }
  }

  async function handleEdit(values: RecordFormValues) {
    const res = await updateRecord(record.id, { ...values, actorName });
    if (res.ok) {
      setEditing(false);
      toast("Record updated");
      reload();
    } else {
      toast(res.error ?? "Update failed", "error");
    }
    return res;
  }

  async function handleDelete() {
    const res = await deleteRecord(record.id, actorName);
    if (res.ok) {
      toast("Record deleted");
      router.push("/records");
    } else {
      toast(res.error ?? "Delete failed", "error");
      setConfirmDelete(false);
    }
  }

  const overdue = isOverdue(record.due_date, record.status);
  const stale = isStale(record.due_date, record.status);

  return (
    <div className="space-y-6">
      <Link
        href="/records"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← All records
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main card */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">{record.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <TypeBadge type={record.record_type} />
                  <StatusBadge status={record.status} />
                  <PriorityBadge priority={record.priority} />
                  {overdue && (
                    <span className="text-xs font-semibold text-red-600">
                      {stale ? "Stale · overdue >5d" : "Overdue"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              <Field label="Type">{TYPE_META[record.record_type].label}</Field>
              <Field label="Priority">{PRIORITY_META[record.priority].label}</Field>
              <Field label="Assignee">{memberName(roster, record.assignee_id)}</Field>
              <Field label="Due date">
                <span className={overdue ? "font-medium text-red-600" : ""}>
                  {formatDate(record.due_date)}
                </span>
              </Field>
              <Field label="Created">{formatDate(record.created_at.slice(0, 10))}</Field>
              <Field label="Change status">
                <select
                  value={record.status}
                  onChange={(e) => handleStatus(e.target.value as Status)}
                  className="mt-0.5 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </Field>
            </dl>

            <div className="mt-5">
              <p className="text-xs font-medium text-neutral-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
                {record.notes?.trim() || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-700">
              Activity ({activities.length})
            </h2>
            <ol className="mt-4 space-y-4">
              {activities.length === 0 && (
                <li className="text-sm text-neutral-400">No activity yet.</li>
              )}
              {activities.map((a) => (
                <li key={a.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-neutral-300" />
                  <p className="text-sm text-neutral-800">
                    <span className="font-medium">{a.actor_name}</span>{" "}
                    {describeActivity(a, roster)}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {formatDateTime(a.created_at)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {editing && (
        <Modal title="Edit Record" onClose={() => setEditing(false)}>
          <RecordForm
            members={roster}
            submitLabel="Save changes"
            onCancel={() => setEditing(false)}
            initial={{
              title: record.title,
              record_type: record.record_type,
              status: record.status,
              assignee_id: record.assignee_id,
              notes: record.notes ?? "",
              due_date: record.due_date,
              priority: record.priority,
            }}
            onSubmit={handleEdit}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete record?" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm text-neutral-600">
            This permanently deletes{" "}
            <span className="font-medium text-neutral-900">{record.title}</span>{" "}
            and its activity history. The deletion is recorded in the audit log.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Delete record
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-neutral-900">{children}</dd>
    </div>
  );
}

function describeActivity(a: RecordActivity, members: TeamMember[]): string {
  const val = (field: string | null, raw: string | null) => {
    if (raw == null || raw === "") return "—";
    if (field === "status") return STATUS_META[raw as Status]?.label ?? raw;
    if (field === "assignee_id") return memberName(members, raw);
    if (field === "priority")
      return PRIORITY_META[raw as keyof typeof PRIORITY_META]?.label ?? raw;
    if (field === "record_type")
      return TYPE_META[raw as keyof typeof TYPE_META]?.label ?? raw;
    return raw;
  };

  if (a.action === "create") return "created this record";
  if (a.action === "status_change")
    return `changed status from ${val("status", a.old_value)} to ${val("status", a.new_value)}`;
  if (a.action === "edit" && a.field_changed) {
    const label = FIELD_LABELS[a.field_changed] ?? a.field_changed;
    return `updated ${label} from “${val(a.field_changed, a.old_value)}” to “${val(a.field_changed, a.new_value)}”`;
  }
  return a.action;
}

const FIELD_LABELS: Record<string, string> = {
  title: "title",
  record_type: "type",
  status: "status",
  assignee_id: "assignee",
  notes: "notes",
  due_date: "due date",
  priority: "priority",
};
