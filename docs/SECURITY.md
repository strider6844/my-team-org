# Security — my-team-org

## Secret Handling
- Supabase service-role key: server-side only (Next.js API routes / Server Actions). Never imported in client components.
- Supabase anon key: safe for client — only used with RLS-enforced queries.
- All env vars prefixed `NEXT_PUBLIC_` only for non-secret config.

## Permission Model (end state, post lock-down sprint)
| Role | Can do |
|---|---|
| viewer | Read all records and activities |
| editor | Create and edit records; update status |
| admin | All editor actions + delete records, manage team members |

Role stored in `team_members.role`. Checked server-side on every write route.

## Approved-Tools Rule
Agent actions use only the named tools listed in AGENTIC_LAYER.md. No `run_any`, `eval`, or dynamic SQL construction. Every tool call is logged to `audit_logs` before execution.

## Audit Principle
Every meaningful write (create / update / delete / status change / agent action) writes a row to `audit_logs` with actor, action, target, and full payload diff. Audit rows are append-only — no update or delete permitted even for admins.

## v1 (demo) vs Lock-down
- **v1:** open RLS policies; no auth required; suitable for internal demo only — no real sensitive data yet.
- **Lock-down sprint:** replace open policies with `auth.uid() = user_id`; enable email auth; gate all writes on session.
