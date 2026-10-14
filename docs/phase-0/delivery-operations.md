# Delivery, CI and operations plan

Status: Proposed; no pipeline, IaC, container, runbook execution or release exists. The original Phase 0 stop is respected.

## Phases and exit criteria

| Phase | Concrete deliverables | Exit evidence |
| --- | --- | --- |
| 0 (this package) | Proposed stack/assumptions, architecture/DFD, ERD, OpenAPI, ranking spec, STRIDE/LINDDUN, risk and requirement ledger | Owner reviews and explicitly approves/corrects stack, assumptions and exception proposals before coding. |
| 1 | Workspace/Git scaffold, locked justified dependencies, strict TS/lint/formatter, Docker/CI, reversible DB migrations and fictional seeds, OIDC, security baseline, legal draft pages and fail-closed consent | Build/checks, migrations/role/RLS/auth/consent tests; no claim branch settings enabled without remote access proof. |
| 2 | Bilingual responsive search, manual/current center, taxonomy/filters/share URL/presets, both ranking strategies/explanations, place details and consent-gated map | Domain ranking fixtures/properties, all filter and keyboard flows, sandbox E2E, >=required coverage. |
| 3 | Official provider adapters and approved rights/attribution policy, resilience/status, source-separated opinions/photos, authorized social embeds, upload/moderation/takedown | Contract/failure/permission/cache/license/scan tests, real developer app approvals for enabled sources. |
| 4 | WCAG, privacy/performance/security hardening, test expansion, final operational/legal docs | Automated suites, real-user usability round, manual AT, measured load/CWV, lawyer review, staging security scans and restore rehearsal. |
| 5 | Full audit, remediation, final matrix/checklist, versioned release notes and release/rollback decision | Required evidence links, no unresolved critical blockers, approved release; no automatic certification declaration. |

No requirement may be dropped or relaxed silently. If an official API cannot provide desired content, document the exact limitation and obtain owner confirmation of the alternative before considering that requirement satisfied.

## Proposed blocking CI/CD

Pull request: conventional commit/PR checks, formatting/lint/strict tsc, unit/domain coverage, OpenAPI schema and inventory drift check, real DB integration/migrations, mocked provider contracts, Playwright E2E/axe and cookie/network audit, Lighthouse budgets, CodeQL/Semgrep SAST, dependency/license SCA, secret scan, IaC scan, container scan and CycloneDX/SPDX SBOM. Isolated staging: OWASP ZAP authenticated DAST, k6 and restore checks, manual evidence links. Failures block merge/deploy via remote branch protection; signed commits, mandatory reviewer and CODEOWNERS; least-privilege CI token and OIDC cloud federation, no persistent deployment keys.

Container images pinned to reviewed immutable digests at implementation, minimal runtime base, non-root UID, read-only root filesystem, dropped Linux capabilities, no privileged mode, writable bounded tmpfs only where required. Identity/media scanner images get equivalent hardening where compatible and documented exceptions. Sign artifacts/SBOM/provenance with workload identity and verify before deployment; commit lockfiles and dependency update review for license/typosquatting/CVEs. No guessed digest in a Dockerfile. Automated vulnerability gates can fail on missing scan evidence.

Terraform-compatible IaC proposal for CDN/WAF/TLS, isolated managed container apps, private network DB/Redis, object quarantine/public licensed derivatives, KMS/vault, immutable backups/log sink, monitoring and environment-specific least-privilege service identities. Separate dev/test/staging/production credentials/stores/keys; CIS baseline checklist and IaC scans. Cloud and Terraform provider licensing/costs must be confirmed; no deployed environment currently exists. Right-size before adopting orchestration/autoscaling based on actual CPU/queue/latency thresholds.

Release uses versioned immutable image/config/schema, migration expand/contract, staging gates, canary feature flags, explicit rollback checkpoints and changelog. Roll back to previous signed image/config; do not down-migrate erased personal data or restore a prohibited provider cache. Release notes list behaviors, legal/terms changes, known limitations and evidence. Account/review/upload/map/social/analytics/paid/sponsorship flags default safe/off until the specific gates pass; sandbox startup can expose clearly fictional implementations without live data.

## Runbook specifications

**Provider outage/quota:** check coarse status/error/latency metrics, isolate provider breaker, stop queued retries and spend, present source degraded notice while licensed catalog remains usable; recover with one safe probe, verify cache permission/expiry and attribution. Never scrape or serve stale disallowed data. Page on-call when native functionality exceeds SLO; provider status separately recorded.

**Security incident/breach:** detect and triage with on-call/security/privacy/legal owner, record UTC awareness time, contain compromised sessions/keys/components, preserve minimal tamper-resistant evidence, scope data/recipients, rotate credentials and fix, assess notification duties per jurisdiction, communicate approved factual notices, verify recovery, post-incident review. Applicable GDPR authority notice assessed within the 72-hour awareness window with risk exceptions and staged updates as documented by EDPB; counsel verifies Costa Rican obligations independently. No universal legal countdown inferred. Do not put personal evidence into issue trackers/public release notes.

**DSR/erasure:** verify proportionately, assign configured deadline and reminders, execute owner-scoped DB/object/IdP/processor deletion, revoke tokens, audit outcome, track backup expiry and notify status; rehearse failure/retry/legal-hold/processor nonresponse. Recovery restores into isolation and replays tombstones before network opens.

**Backup/DR:** continuous WAL/PITR proposed for RPO 15m, encrypted immutable 35-day backup vault, separate account credentials, quarterly restore including KMS availability and all objects/IdP dependencies; validate schema/data/counts/erasure replay/permissions, measure RTO <=4h and RPO. Document failover, DNS/cert/secret recovery and actual measured timestamps. ISO 22301 continuity plan includes operator loss/provider failure, contacts and annual drill. No restore has been tested in Phase 0.

**Media abuse/takedown:** quarantine suspect item, record license/source, human decision and lawful notice/appeal, purge native derivatives/objects where required, source-provider reporting link for external content; scanner failure never promotes data. Rate-limit hostile reporters without dismissing valid notices.

**Key rotation/deployment:** retrieve least-privilege vault references, introduce new key/version, overlap verify where required, rotate tokens/secrets/browser restrictions, revoke old keys, test; never emit tokens to logs. Restore of encrypted data requires tested retired-key retention within lawful lifecycle.

## Observability and response ownership

Structured allowlisted logs (timestamp, opaque correlation, operation, sanitized outcome, latency); metrics and traces with no query/coordinate/token/reviewer name. Synchronized UTC clocks, tamper-resistant centralized sink, retention/access separation. Dashboard native/provider latency/error, quota spend, consent gate rejections, auth anomalies, moderation lag, DSR deadlines, erase/TTL/outbox/backup freshness and quarantine backlog. Alerts have thresholds, runbook links and a named staffed rotation before production. Public health exposes readiness/coarse provider state only; metrics private, liveness no paid calls.

Vulnerability SLAs proposed: critical exploited issue contain within 24h; high remediate 7d; medium 30d; low 90d, with reviewed compensating controls and due dates. Emergency patch/rollback pathway preserves scans and audit. Annual independent penetration test, accessibility/privacy audit and DR exercise, plus triggers after substantial changes. Publish a real-contact security.txt and disclosure policy only after contact supplied. Email infrastructure requires SPF/DKIM/DMARC verification, monitored abuse and no marketing until permission features pass.

Organizational requirements (branch protection, signed commits/reviews, ISO governance, legal review, DPA execution, annual audits and on-call staffing) require access/actions and human evidence. They are not completed by adding markdown or a workflow file.
