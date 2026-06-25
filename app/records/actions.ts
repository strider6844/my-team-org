"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Priority, RecordType, Status, WorkRecord } from "@/lib/types";

// Every write goes through these server actions so that the three side effects
// of any change — the row itself, the human-readable activity trail, and the
// system audit log — always happen together. The UI never writes directly.

export interface ActionResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

interface CreateInput {
  title: string;
  record_type: RecordType;
  status: Status;
  assignee_id: string | null;
  notes: string;
  due_date: string | null;
  priority: Priority;
  actorName: string;
}

async function writeAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorName: string,
  action: string,
  targetId: string | null,
  payload: unknown,
) {
  await supabase.from("audit_logs").insert({
    actor_name: actorName,
    action,
    target_table: "work_records",
    target_id: targetId,
    payload,
  });
}

export async function createRecord(input: CreateInput): Promise<ActionResult<WorkRecord>> {
  const supabase = await createClient();
  const actor = input.actorName?.trim() || "Someone";

  if (!input.title.trim()) {
    return { ok: false, error: "Title is required." };
  }

  const { data: record, error } = await supabase
    .from("work_records")
    .insert({
      title: input.title.trim(),
      record_type: input.record_type,
      status: input.status,
      assignee_id: input.assignee_id,
      notes: input.notes.trim() || null,
      due_date: input.due_date || null,
      priority: input.priority,
    })
    .select()
    .single();

  if (error || !record) {
    return { ok: false, error: error?.message ?? "Failed to create record." };
  }

  await supabase.from("record_activities").insert({
    record_id: record.id,
    actor_name: actor,
    action: "create",
    field_changed: null,
    old_value: null,
    new_value: record.title,
  });

  await writeAudit(supabase, actor, "create", record.id, record);

  revalidatePath("/records");
  revalidatePath("/dashboard");
  return { ok: true, data: record as WorkRecord };
}

export async function updateRecordStatus(
  id: string,
  newStatus: Status,
  actorName: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const actor = actorName?.trim() || "Someone";

  const { data: current, error: readErr } = await supabase
    .from("work_records")
    .select("status")
    .eq("id", id)
    .single();

  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? "Record not found." };
  }
  if (current.status === newStatus) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("work_records")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await supabase.from("record_activities").insert({
    record_id: id,
    actor_name: actor,
    action: "status_change",
    field_changed: "status",
    old_value: current.status,
    new_value: newStatus,
  });

  await writeAudit(supabase, actor, "status_change", id, {
    from: current.status,
    to: newStatus,
  });

  revalidatePath("/records");
  revalidatePath(`/records/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

interface UpdateInput {
  title: string;
  record_type: RecordType;
  status: Status;
  assignee_id: string | null;
  notes: string;
  due_date: string | null;
  priority: Priority;
  actorName: string;
}

export async function updateRecord(
  id: string,
  input: UpdateInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const actor = input.actorName?.trim() || "Someone";

  if (!input.title.trim()) {
    return { ok: false, error: "Title is required." };
  }

  const { data: current, error: readErr } = await supabase
    .from("work_records")
    .select("*")
    .eq("id", id)
    .single();

  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? "Record not found." };
  }

  const next = {
    title: input.title.trim(),
    record_type: input.record_type,
    status: input.status,
    assignee_id: input.assignee_id,
    notes: input.notes.trim() || null,
    due_date: input.due_date || null,
    priority: input.priority,
  };

  const { error } = await supabase
    .from("work_records")
    .update(next)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // One activity row per field that actually changed.
  const fields: (keyof typeof next)[] = [
    "title",
    "record_type",
    "status",
    "assignee_id",
    "notes",
    "due_date",
    "priority",
  ];
  const activities = fields
    .filter((f) => String(current[f] ?? "") !== String(next[f] ?? ""))
    .map((f) => ({
      record_id: id,
      actor_name: actor,
      action: f === "status" ? "status_change" : "edit",
      field_changed: f,
      old_value: current[f] == null ? null : String(current[f]),
      new_value: next[f] == null ? null : String(next[f]),
    }));

  if (activities.length > 0) {
    await supabase.from("record_activities").insert(activities);
    await writeAudit(supabase, actor, "edit", id, { before: current, after: next });
  }

  revalidatePath("/records");
  revalidatePath(`/records/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteRecord(
  id: string,
  actorName: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const actor = actorName?.trim() || "Someone";

  const { data: current } = await supabase
    .from("work_records")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("work_records").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  // record_activities cascade-delete with the record; the audit log is the
  // durable trail of the deletion itself.
  await writeAudit(supabase, actor, "delete", id, current ?? { id });

  revalidatePath("/records");
  revalidatePath("/dashboard");
  return { ok: true };
}
