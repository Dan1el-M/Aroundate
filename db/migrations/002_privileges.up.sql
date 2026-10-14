-- Roles must be provisioned by the cluster owner, with passwords supplied externally.
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='aroundate_app') THEN CREATE ROLE aroundate_app NOLOGIN NOBYPASSRLS; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='aroundate_reporting') THEN CREATE ROLE aroundate_reporting NOLOGIN NOBYPASSRLS; END IF;
END $$;
GRANT USAGE ON SCHEMA catalog,privacy,content,trust,ops TO aroundate_app;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO aroundate_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON privacy.users,privacy.saved_places,privacy.filter_presets,privacy.provider_connections,privacy.data_subject_requests TO aroundate_app;
GRANT SELECT,INSERT ON privacy.consents,privacy.terms_acceptances TO aroundate_app;
GRANT SELECT ON privacy.policy_versions TO aroundate_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON privacy.bff_sessions TO aroundate_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON ops.idempotency_records TO aroundate_app;
GRANT INSERT ON ops.audit_log,ops.outbox TO aroundate_app;
GRANT SELECT,INSERT ON trust.reports,trust.appeals TO aroundate_app;
GRANT USAGE ON SCHEMA ops TO aroundate_reporting;
GRANT SELECT ON ops.search_logs TO aroundate_reporting;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
