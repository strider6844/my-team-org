# Architecture — my-team-org

## Stack
- **Frontend:** Next.js (App Router) on Vercel
- **Database + Auth:** Supabase (Postgres + Row-Level Security + Realtime)
- **Styling:** Tailwind CSS

## Build Sequence
**Now:** DB schema → record CRUD → shared list + status actions → activity log → dashboard counts
**Next:** Auth + role-scoped RLS → team membership management → filters/search
**Later:** AI next-status suggestions → stale-record alerts → scheduled summaries

## Key User Action — Step-by-Step
1. Team member opens `/records` (no login required in v1)
2. Clicks **New Record**, fills form (title, type, status, assignee, notes, due date, priority)
3. Form `POST` hits Next.js route → validates → inserts row into `work_records` via Supabase client
4. Insert triggers Supabase Realtime broadcast → all open clients update list instantly
5. `record_activities` row appended; `audit_logs` row written
6. Shared list re-renders with new record; status badge reflects current state

## Layer Plan
1. **Data first** — tables, RLS policies, seed rows (runs without any UI)
2. **App logic** — CRUD routes, status machine, activity append, audit writes
3. **Smart features** — AI suggestions, stale detection, reminders (added on top; core works without them)

## Why the Core Runs Without AI
All record creation, status transitions, and activity logging are plain Postgres writes. The AI suggestion field is nullable; the app never blocks on it.
