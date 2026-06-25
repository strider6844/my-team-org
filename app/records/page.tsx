import { createClient } from "@/lib/supabase/server";
import type { TeamMember, WorkRecord } from "@/lib/types";
import { RecordsView } from "./records-view";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const supabase = await createClient();

  const [recordsRes, membersRes] = await Promise.all([
    supabase
      .from("work_records")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  const records = (recordsRes.data ?? []) as WorkRecord[];
  const members = (membersRes.data ?? []) as TeamMember[];

  return <RecordsView initialRecords={records} members={members} />;
}
