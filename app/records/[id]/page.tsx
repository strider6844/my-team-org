import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RecordActivity, TeamMember, WorkRecord } from "@/lib/types";
import { RecordDetail } from "./record-detail";

export const dynamic = "force-dynamic";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [recordRes, membersRes, activitiesRes] = await Promise.all([
    supabase.from("work_records").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("record_activities")
      .select("*")
      .eq("record_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!recordRes.data) notFound();

  return (
    <RecordDetail
      record={recordRes.data as WorkRecord}
      members={(membersRes.data ?? []) as TeamMember[]}
      initialActivities={(activitiesRes.data ?? []) as RecordActivity[]}
    />
  );
}
