# Tasks — my-team-org

## Sprint 1 — DB + Core Record Engine ✦ v1 functional milestone
**Goal:** Any team member can create a record, update its status, and see the shared list — all persisted to the database, no login required.

- [ ] Run migration SQL; confirm all tables exist with seed data in Supabase
- [ ] `/records` page: fetch and display all `work_records` with status badge, assignee, priority, due date
- [ ] Loading skeleton and empty state on `/records`
- [ ] "New Record" button → modal/drawer form: title, type, status, assignee (dropdown from team_members), notes, due date, priority
- [ ] Form submit → insert to `work_records` + append to `record_activities` + write `audit_logs` row
- [ ] Inline status change dropdown on each row → updates `work_records.status`, appends activity, writes audit
- [ ] Supabase Realtime subscription on `work_records` → list updates without page refresh
- [ ] Error toast on any failed DB write; success toast on create/update
- [ ] Confirm: every button and form writes real data; no dead UI elements

**Definition of Done:** Open two browser tabs; create a record in tab 1; it appears in tab 2 within 2 seconds. Status change in tab 1 reflects in tab 2. All writes visible in Supabase table editor.

---

## Sprint 2 — Record Detail, Activity Log, Dashboard
**Goal:** Full record lifecycle (view, edit, delete) + operational dashboard.

- [ ] `/records/[id]` detail page: all fields, edit form (full update), delete with confirmation dialog
- [ ] Activity timeline on detail page: chronological list of `record_activities` for this record
- [ ] `/dashboard` page: count cards (open / in_progress / blocked / done), overdue records list, recent activity feed
- [ ] Staleness flag: records with no activity in >5 days since due date highlighted in list
- [ ] Status filter and assignee filter on `/records`
- [ ] Audit log writes on edit and delete
- [ ] Handle delete: cascade removes activities; audit log entry preserved

**Definition of Done:** Full create → edit → status change → delete flow works end-to-end. Dashboard counts match actual DB state. Activity log shows all events in order.

---

## Sprint 3 — Lock It Down (Auth + Role-Scoped RLS)
**Goal:** Real users log in; data is scoped by team membership; roles enforced.

- [ ] Enable Supabase Auth (email/password)
- [ ] Login and signup pages; redirect to `/records` on success
- [ ] Associate `work_records.user_id` and `record_activities.user_id` with `auth.uid()` on create
- [ ] Replace open RLS policies with `auth.uid() = user_id` owner policies on all tables
- [ ] Team membership: admin can invite a user by email; sets their role
- [ ] Enforce role on write routes: viewer cannot create/edit; editor cannot delete; admin can all
- [ ] Protect all API routes / Server Actions with session check — unauthenticated writes return 401

**Definition of Done:** Unauthenticated user sees records (read-only) but cannot submit any form. Viewer account cannot create records. Editor cannot delete. Admin can do all. Different users' records are correctly scoped.

---

## Sprint 4 — Intelligence & Automation
**Goal:** Surface smart signals; add AI-assisted next-step suggestions.

- [ ] `suggest_next_status(record_id)` tool: reads record type + activity history → calls LLM → stores result in `suggested_next_status*` columns
- [ ] Show suggestion chip on record detail with Accept / Dismiss actions (updates `review_status`)
- [ ] `draft_standup_summary(date)` tool: admin triggers → LLM generates markdown → shown in modal for copy/paste (medium risk, no auto-send)
- [ ] Stale-record alert: cron or on-load rule flags records overdue >5 days with a visual badge
- [ ] All agent actions logged to `audit_logs` with full payload

**Definition of Done:** Suggestion chip appears on a record with confidence score. Accept/Dismiss updates DB. Standup summary draft renders correctly. No AI call blocks core record actions.

---

## Gantt (sprint → features)
```
Sprint 1  |████████████████| DB + record list + create + status update + realtime
Sprint 2  |        ████████████████| Detail page + activity log + dashboard + filters
Sprint 3  |                ████████████████| Auth + RLS + roles + team membership
Sprint 4  |                        ████████████████| AI suggestions + stale alerts + standup draft
```
