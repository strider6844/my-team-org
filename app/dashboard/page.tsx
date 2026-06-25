import { createClient } from "@/lib/supabase/server";
import type { TeamMember, WorkRecord } from "@/lib/types";
import { DashboardView, type ActivityWithRecord } from "./dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [recordsRes, membersRes, activityRes] = await Promise.all([
    supabase
      .from("work_records")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("record_activities")
      .select("*, work_records(title)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <DashboardView
      initialRecords={(recordsRes.data ?? []) as WorkRecord[]}
      members={(membersRes.data ?? []) as TeamMember[]}
      initialActivity={(activityRes.data ?? []) as unknown as ActivityWithRecord[]}
    />
  );
}
