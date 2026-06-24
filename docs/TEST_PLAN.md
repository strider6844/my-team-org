# Test Plan — my-team-org

## Success Scenario (manual)
1. Open `/records` in two browser tabs (no login)
2. **Tab 1:** Click "New Record" → fill: title="Weekly Invoice Check", type=finance, status=open, assignee=Sam Rivera, notes="Check all outstanding invoices", due date=next Friday, priority=high → Submit
3. **Expected:** Record appears in Tab 1 list immediately with correct badge colors
4. **Tab 2:** Confirm the new record appears within 2 seconds without a page refresh (Realtime)
5. **Tab 1:** Click status dropdown on the new record → change to "in_progress"
6. **Expected:** Status badge updates in Tab 1 and Tab 2 within 2 seconds
7. Open record detail → confirm activity log shows: "Sam Rivera created record" and "status changed: open → in_progress"
8. Open Supabase table editor → confirm `work_records`, `record_activities`, and `audit_logs` all have the correct rows

## Empty State
- Delete all records (or use a fresh DB) → `/records` shows empty state illustration + "New Record" button
- `/dashboard` shows zero counts, not blank/broken

## Error Cases
- Submit "New Record" form with blank title → inline validation error, no DB write
- Simulate network failure (DevTools offline) → submit form → error toast appears, form data preserved
- Navigate to `/records/nonexistent-uuid` → 404 message, not a crash

## Data Integrity
- Create a record, delete it → confirm `record_activities` rows are also deleted (cascade)
- Confirm `audit_logs` row for the delete still exists (audit rows are NOT cascaded)

## Role Checks (Sprint 3+)
- Viewer account: "New Record" button is hidden or returns 403
- Editor account: delete button is hidden or returns 403
- Admin account: all actions succeed
