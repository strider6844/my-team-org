-- Enable Supabase Realtime for the shared live list (Sprint 1 success criteria:
-- a record created in one browser tab appears in another within seconds, no
-- refresh). Realtime only broadcasts changes for tables in this publication.
alter publication supabase_realtime add table work_records;
alter publication supabase_realtime add table record_activities;

-- REPLICA IDENTITY FULL so UPDATE/DELETE events carry the full old row,
-- letting clients reconcile the list precisely.
alter table work_records replica identity full;
alter table record_activities replica identity full;
