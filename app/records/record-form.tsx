"use client";

import { useState } from "react";
import {
  PRIORITIES,
  RECORD_TYPES,
  STATUSES,
  STATUS_META,
  PRIORITY_META,
  TYPE_META,
  type Priority,
  type RecordType,
  type Status,
  type TeamMember,
} from "@/lib/types";

export interface RecordFormValues {
  title: string;
  record_type: RecordType;
  status: Status;
  assignee_id: string | null;
  notes: string;
  due_date: string | null;
  priority: Priority;
}

interface Props {
  members: TeamMember[];
  initial?: Partial<RecordFormValues>;
  submitLabel: string;
  onSubmit: (values: RecordFormValues) => Promise<{ ok: boolean; error?: string }>;
  onCancel?: () => void;
}

const inputCls =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900";
const labelCls = "block text-xs font-medium text-neutral-500 mb-1";

export function RecordForm({
  members,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [recordType, setRecordType] = useState<RecordType>(
    initial?.record_type ?? "general",
  );
  const [status, setStatus] = useState<Status>(initial?.status ?? "open");
  const [assigneeId, setAssigneeId] = useState<string>(
    initial?.assignee_id ?? "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? "medium",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await onSubmit({
      title,
      record_type: recordType,
      status,
      assignee_id: assigneeId || null,
      notes,
      due_date: dueDate || null,
      priority,
    });
    setSubmitting(false);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls} htmlFor="f-title">Title</label>
        <input
          id="f-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q3 Vendor Renewal"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="f-type">Type</label>
          <select
            id="f-type"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as RecordType)}
            className={inputCls}
          >
            {RECORD_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="f-status">Status</label>
          <select
            id="f-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="f-assignee">Assignee</label>
          <select
            id="f-assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className={inputCls}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="f-priority">Priority</label>
          <select
            id="f-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={inputCls}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="f-due">Due date</label>
        <input
          id="f-due"
          type="date"
          value={dueDate ?? ""}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="f-notes">Notes</label>
        <textarea
          id="f-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Context, links, next steps…"
          className={inputCls}
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
