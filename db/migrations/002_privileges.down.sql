REVOKE ALL ON ALL TABLES IN SCHEMA catalog,privacy,content,trust,ops FROM aroundate_app;
REVOKE USAGE ON SCHEMA catalog,privacy,content,trust,ops FROM aroundate_app;
REVOKE ALL ON ops.search_logs FROM aroundate_reporting;
REVOKE USAGE ON SCHEMA ops FROM aroundate_reporting;
-- Keep externally managed roles. Do not restore PUBLIC CREATE privileges.
