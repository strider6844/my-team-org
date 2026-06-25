"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  STATUS_META,
  memberName,
  type RecordActivity,
  type Status,
  type TeamMember,
  type WorkRecord,
} from "@/lib/types";
import { formatDate, isOverdue, isStale, relativeFromNow } from "@/lib/dates";
import { StatusBadge, PriorityBadge } from "../components/badges";

export interface ActivityWithRecord extends RecordActivity {
  work_records: { title: string } | null;
}

interface Props {
  initialRecords: WorkRecord[];
  members: TeamMember[];
  initialActivity: ActivityWithRecord[];
}

const COUNT_CARDS: { status: Status; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

export function DashboardView({
  initialRecords,
  members,
  initialActivity,
}: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [activity, setActivity] = useState(initialActivity);
  const supabase = createClient();

  const reload = useCallback(async () => {
    const [rec, act] = await Promise.all([
      supabase
        .from("work_records")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("record_activities")
        .select("*, work_records(title)")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (rec.data) setRecords(rec.data as WorkRecord[]);
    if (act.data) setActivity(act.data as unknown as ActivityWithRecord[]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(reload, 3000);
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [reload]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of records) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [records]);

  const overdue = useMemo(
    () =>
      records
        .filter((r) => isOverdue(r.due_date, r.status))
        .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")),
    [records],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-neutral-500">
          {records.length} total records · {overdue.length} overdue
        </p>
      </div>

      {/* Count cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COUNT_CARDS.map((c) => (
          <Link
            key={c.status}
            href="/records"
            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${STATUS_META[c.status].dot}`}
              />
              <span className="text-xs font-medium text-neutral-500">
                {c.label}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {counts[c.status] ?? 0}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-700">
            Overdue & stale
          </h2>
          <ul className="mt-3 divide-y divide-neutral-100">
            {overdue.length === 0 && (
              <li className="py-3 text-sm text-neutral-400">
                Nothing overdue. 🎉
              </li>
            )}
            {overdue.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    href={`/records/${r.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {r.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                    <span>{memberName(members, r.assignee_id)}</span>
                    <span className="font-medium text-red-600">
                      due {formatDate(r.due_date)}
                    </span>
                    {isStale(r.due_date, r.status) && (
                      <span className="rounded bg-red-50 px-1.5 py-0.5 font-medium text-red-700">
                        stale
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-700">
            Recent activity
          </h2>
          <ol className="mt-3 space-y-3">
            {activity.length === 0 && (
              <li className="text-sm text-neutral-400">No activity yet.</li>
            )}
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
                <div className="min-w-0">
                  <p className="text-neutral-800">
                    <span className="font-medium">{a.actor_name}</span>{" "}
                    {shortAction(a)}{" "}
                    {a.record_id && a.work_records?.title && (
                      <Link
                        href={`/records/${a.record_id}`}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {a.work_records.title}
                      </Link>
                    )}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {relativeFromNow(a.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function shortAction(a: ActivityWithRecord): string {
  if (a.action === "create") return "created";
  if (a.action === "status_change") {
    const to = STATUS_META[a.new_value as Status]?.label ?? a.new_value;
    return `moved to ${to} on`;
  }
  if (a.action === "edit") return `edited ${a.field_changed ?? ""} on`;
  if (a.action === "delete") return "deleted";
  return `${a.action} on`;
}
