# PRD — my-team-org

## Problem
The team tracks recurring operational work (records, owners, statuses) across spreadsheets and chat. There is no single shared view, status updates get lost, and it is impossible to see who is doing what at a glance.

## Target User
Department team members (3–15 people) who log and hand off recurring operational tasks daily.

## Core Objects
- **WorkRecord** — the unit of work: title, type, status, assignee, notes, due date, priority
- **TeamMember** — name, email, role (admin / editor / viewer)
- **RecordActivity** — append-only log of every change to a record
- **AuditLog** — system-wide log of every write action

## MVP Checklist (v1 must-haves)
- [ ] Any team member can create a new work record
- [ ] Any team member can update the status of any record
- [ ] All records visible in a shared live list with status, assignee, and priority
- [ ] Each record has a detail view with full edit and activity history
- [ ] Dashboard shows counts by status and a recent-activity feed
- [ ] App is viewable without login (demo-first); auth added later

## Non-Goals (v1)
- Email / Slack notifications
- Recurring workflow templates
- AI suggestions
- Per-user data isolation (comes in lock-down sprint)
- Mobile-native app

## Success Criteria
**End-to-end scenario:** Sam opens the app, sees the shared record list, clicks "New Record," fills in title / status / assignee / notes, submits — the record appears immediately in the list for Jordan (on a different browser tab) without a page refresh, and the activity log shows Sam's creation event.
