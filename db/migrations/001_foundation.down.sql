-- Local reversible foundation only. Production rollback requires the expand/contract runbook.
DROP SCHEMA ops CASCADE;
DROP SCHEMA trust CASCADE;
DROP SCHEMA content CASCADE;
DROP SCHEMA privacy CASCADE;
DROP SCHEMA catalog CASCADE;
-- Shared database extensions deliberately retained.
