# Agentic Layer — my-team-org

## Risk Levels & Actions

### Low — Auto (no approval needed)
- Suggest next status based on record type + history → stored in `suggested_next_status`, shown as a chip
- Auto-tag `record_type` from notes text → stored with confidence score
- Compute staleness flag and priority score on read

### Medium — Light Approval (user confirms before execution)
- Reassign a stale record to a different team member
- Change record status in bulk (e.g., mark all done after project closes)
- Draft a summary of open records for a team standup

### High — Always Approval (explicit confirm step + audit write)
- Send a notification to a team member about an overdue record
- Archive a batch of cancelled records

### Critical — Human Only
- Permanent delete of records
- Removing a team member and reassigning their records
- Any action touching the audit_log table directly

## Named Tools (approved list)
- `suggest_next_status(record_id)` — reads history, returns suggestion
- `draft_standup_summary(date)` — returns markdown summary for review
- `reassign_record(record_id, new_assignee_id)` — medium risk, requires confirmation
- `send_nudge_notification(record_id, recipient_id)` — high risk, requires approval

## Audit Log Fields (every agent action)
`actor_name`, `action`, `target_table`, `target_id`, `payload` (input + output), `created_at`

## v1 vs Later
- **v1:** no agent calls; staleness flag is rule-based only
- **Later:** `suggest_next_status` auto-runs on record load; `draft_standup_summary` available to admin
