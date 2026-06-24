# Data Model — my-team-org

## team_members
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid (nullable) | linked at lock-down sprint |
| name | text | |
| email | text | |
| role | text | admin / editor / viewer |
| created_at | timestamptz | |

## work_records
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid (nullable) | creator; linked at lock-down |
| title | text | |
| record_type | text | general / contract / compliance / onboarding / finance / project |
| status | text | open / in_progress / blocked / done / cancelled |
| assignee_id | uuid FK → team_members | |
| notes | text | |
| due_date | date | |
| priority | text | low / medium / high |
| suggested_next_status | text | **AI field** |
| suggested_next_status_source | text | model/version used |
| suggested_next_status_confidence | numeric | 0–1 |
| suggested_next_status_review_status | text | unreviewed / accepted / rejected |
| created_at | timestamptz | |

## record_activities
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid (nullable) | |
| record_id | uuid FK → work_records | cascade delete |
| actor_name | text | display name at time of action |
| action | text | status_change / edit / create / delete |
| field_changed | text | |
| old_value | text | |
| new_value | text | |
| created_at | timestamptz | |

## audit_logs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid (nullable) | |
| actor_name | text | |
| action | text | |
| target_table | text | |
| target_id | uuid | |
| payload | jsonb | full diff |
| created_at | timestamptz | |

## RLS (v1 — open for demo)
All tables: permissive SELECT and ALL policies (`using (true)`). Replaced with `auth.uid() = user_id` owner policies in the lock-down sprint.
