# Intelligence Layer — my-team-org

## Messy Inputs
- Freeform notes text on records
- Inconsistent status labels used historically
- No structured "reason for block" field

## Auto-Structure Schema (example)
```json
{
  "record_id": "uuid",
  "inferred_next_status": "done",
  "reasoning": "Record type is onboarding; all prior onboarding records move to done after blocked resolves.",
  "confidence": 0.82,
  "source": "gpt-4o-mini/v1",
  "review_status": "unreviewed"
}
```
Stored in `work_records.suggested_next_status*` columns.

## Events to Track
- Record created (type, priority, assignee)
- Status changed (from → to, time in previous status)
- Record age vs. due_date (days overdue)
- Assignee workload (open record count)

## Scoring Rules (rule-based first)
- **Staleness score:** days since last activity ÷ (due_date − created_at); >0.8 = stale flag
- **Priority score:** high=3, medium=2, low=1 × staleness multiplier
- **Workload score:** count of open records per assignee

## What Gets Ranked
- Records on dashboard sorted by priority score descending
- Overdue / stale records surfaced at top of list

## v1 vs Later
- **v1:** rule-based staleness flag, priority sort — no AI calls
- **Later:** LLM-suggested next status, auto-tagging record type from notes
