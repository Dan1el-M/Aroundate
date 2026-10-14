# Implementation status — 0.1.0 sandbox

Date: 2026-10-14. Phase 0 owner approval received. This is a working first development milestone, not the completion of Phases 1–5 or production release.

## What runs now

- TypeScript monorepo, npm exact direct versions + lockfile, Next.js/React web, NestJS API, strict TypeScript/lint/format checks and separate domain/application/infrastructure/presentation files.
- Eight explicitly fictional place fixtures; database-shaped extensible taxonomies; bilingual text lookup with accents/one-edit typo tolerance; combinable cuisines, category, price/currency, radius, rating, open-hour, dietary, accessibility and evidenced fixture tags.
- Both ranking strategies with fixed-point utilities, deterministic tie-breaking and disclosed unknowns; keyboard/button alternatives to draggable priorities; visible rank facts and contributions.
- Local privacy-first UI, list equivalent to disabled map, details, fixture-source attribution and explicit absence of real provider photos/reviews.
- Purpose/version-specific consent, equal accept/reject, granular unticked choices, easy withdrawal, GPC/DNT handling, necessary-cookie audit and no external resources even after opt-in while providers remain disabled.
- Sandbox accounts with random identities, separate adult and terms affirmation, opaque HttpOnly sessions, CSRF+Origin checks, scopes/owner filtering, short signed sandbox bearer tokens, saved places and city-only presets. Demo data is volatile.
- OIDC code+PKCE/state/nonce implementation and a Keycloak realm starter with short tokens, audience/scopes, Argon2 policy, TOTP and WebAuthn registration configuration. Actual IdP/email/blocklist/MFA/recovery tests still require running the IdP. The current BFF session store is single-process memory, not production identity storage.
- Versioned API, strict schemas/no mass assignment, RFC 9457 errors/correlation IDs, size limits, local session/finality/network quotas, signed cursors, owner-scoped idempotent writes, ETags/preconditions and explicit CORS. Actual inventory: [OpenAPI](openapi.json), 20 operations.
- Bilingual legal draft pages/footer, no invented controller/contact, disabled paid/refund template, demo report/contact receipts and a demo-only export. DSR requests are pending receipts; processor deletion and backup workflows have not been implemented.
- Versioned paired SQL migrations for PostGIS/trigram/unaccent, constraints/taxonomy cycle trigger, separate schemas, personal RLS, app/reporting privileges; fictional seed and migration runner with lock/checksum/transaction.
- Docker/Compose source with verified registry digests, non-root application runtime targets and read-only deployment shape; pinned CI action SHAs, unit/API/browser/database jobs, CodeQL/Trivy/SCA gates and CycloneDX command.

## Startup and configuration

Use Node 24; `npm ci --ignore-scripts`, `npm run setup:local`, `npm run dev`. The root dev supervisor loads .env, shares one secret between BFF/API and starts both on loopback. `npm run setup:local` refuses to overwrite an existing .env. API-only/web-only dev scripts require the same explicit SESSION_SECRET; prefer the supervisor. No cloud service/account/message/publication was created.

Production startup rejects sandbox and missing TLS/legal/secret/identity configuration. The API additionally rejects live mode until production gates below are implemented and verified. This is intentional fail-closed behavior. A production build can be checked without claiming the deployment is ready. No live provider flag can silently enable unfinished adapters or tracking.

## Database and optional identity development

Docker must be installed separately; it is absent on this machine. Local infrastructure only:

```powershell
docker compose --env-file .env --env-file infra/images.env -f infra/compose.yml up -d
npm run db:migrate
npm run db:seed
```

Optional identity: add `--profile identity` to compose. Configure OIDC_ISSUER to `http://127.0.0.1:8080/realms/aroundate-local` in local .env and restart npm run dev. Complete SMTP/verification in Keycloak; bootstrap admin credentials are generated in untracked .env and never included in the realm file. Browser Login OIDC is then available. Registration, email/passkey/TOTP and resets belong to the IdP, not custom Aroundate password routes.

The local database runner uses the migration role; the API never executes DDL. `PostgresStore` is preparatory infrastructure and is **not selected by the current sandbox**. CI has real PostGIS migration/RLS/rollback tests; until they run, do not claim real-DB verification. CI-only trust authentication is explicitly isolated to an ephemeral synthetic-data VM; local Compose uses generated passwords. Never copy CI trust auth or development IdP mode into production.

## Explicit gaps and next milestones

| Gate | Remaining implementation/evidence |
| --- | --- |
| Phase 1 production persistence | Connect transactional Postgres repositories, persistent encrypted BFF sessions, complete object-level RLS and tests; preserve atomic audit/outbox/idempotency and race-safe mutations; implement bounded retention jobs. |
| Phase 1 identity | Run real OIDC/IdP tests, configure email/Argon2/blocklist/passkey login/TOTP/recovery/session revocation, deployment TLS and password policy verification. Realm import alone is not proof. |
| Phase 2 discovery | Wire official geocoding and autocomplete UI, live PostGIS admission/query plans, complete preset edit/load UX and exact-location explicit-save controls, exceptional/DST hours, full ranking/explanation/normalization coverage. |
| Phase 3 integrations | Implement official Google/Instagram/TikTok adapters/resilience/contracts, approved per-field storage permissions, real attribution/embeds, upload scan/strip/license pipeline, moderation/appeals. Keys/access/terms review required. |
| Privacy/rights | Persistent anonymous proof, approved retention/rights deadlines and actual export/rectification/erasure/processor/backup workflows. Demo export is not full data-subject tooling. |
| Security/operations | Distributed quotas/Redis, vault/KMS/rotation, WAF, logging/traces/alerts, security.txt with real contact, webhook contracts, incident drills; review/activate all security headers under actual TLS. |
| Supply chain/cloud | Execute remote CI/scans, choose cloud/region/budget, production IaC, immutable signed artifacts, SBOM/license audit, branch settings/review/signed commits. No remote repository is configured or unsigned commit made. |
| Phase 4/5 validation | Actual DB/container/restore/load/CWV/DAST/ASVS, manual screen readers and >=5-user study, lawyer/DPA/transfer approvals, independent audits and remediation/release decision. |

Current local source is reviewable, with [verification](evidence/README.md) and [every original checklist item](compliance-current.md). No mandatory requirement was deleted. Features not implemented are identified rather than silently faked. Conditional payments, sponsorship, analytics and generated summaries remain disabled.

## Route inventory beyond the API

Presentation: `/`, `/account`, `/places/[id]`, allowed policy slugs `/privacy`, `/cookies`, `/terms`, `/refunds`, `/accessibility`, `/business-information`, `/contact`, `/report`. Necessary BFF bootstrap is GET `/api/bootstrap`; allowlisted `/api/[...path]` proxies only implemented API paths. Auth: POST `/auth/demo` (development sandbox only), POST `/auth/login`, GET `/auth/callback`, POST `/auth/logout`. Private tokens never leave server-side sessions. No undocumented public readiness/metrics/provider webhook routes exist.

## Sources/dependency notes

Direct versions/licenses were queried from npm; incompatible TypeScript 7 was not selected because typescript-eslint supports <6.1. TypeScript 5.9.3 is the verified compatible choice; Node typings match Node 24. Express is explicit (MIT), not an undeclared transitive dependency. Dependencies are pinned and npm audit initially reported zero vulnerabilities; no guarantee is inferred. See [proposed justifications](phase-0/dependencies.md), [registry image pins](../infra/images.lock.json) and [verified action SHAs](../infra/actions.lock.json). Image pinning is not a vulnerability scan result.
