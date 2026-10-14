# Aroundate

Responsive date-place discovery for Costa Rica, with Spanish and English interfaces and an API suitable for a later mobile client.

**Current delivery: runnable local sandbox, Phase 1 foundation and initial Phase 2 discovery.** Phase 0 was approved by the owner on 2026-10-14. Next.js web, NestJS API, strict contracts, deterministic ranking, purpose-specific consent, demo accounts, saved places/presets, draft legal pages, migrations and CI source are implemented. Live deployment is blocked until the remaining production gates pass. Standards alignment is an acceptance target, not certification.

## Run locally

Requires Node.js 24 and npm. From this directory:

```powershell
npm ci --ignore-scripts
npm run setup:local
npm run dev
```

Open **http://127.0.0.1:3000**; the API uses port 3001. If .env already exists, retain it and skip setup:local. No paid keys or Docker are needed for the fictional sandbox. Setup generates local secrets without printing them; .env is ignored by Git. Every place/price/rating is explicitly fictional. Demo accounts and saved data use memory and disappear on server restart. Location is request-only; sharing and presets default to the city, not exact coordinates.

Checks: `npm run check`, `npm run format:check`, `npm run build`, `npm run test:e2e`. Browser tests use installed Edge on Windows and Playwright Chromium in CI. See [implementation status and blockers](docs/implementation.md), [actual OpenAPI](docs/openapi.json), [current compliance ledger](docs/compliance-current.md) and [verification evidence](docs/evidence/README.md).

Start with [the approval brief](docs/phase-0/README.md). Then review:

| Deliverable | File |
| --- | --- |
| Scope, assumptions, questions and approval record | [Phase 0](docs/phase-0/README.md) |
| Stack, boundaries, architecture and data flow | [Architecture](docs/phase-0/architecture.md) |
| ERD, normalized tables, indexes and deletion design | [Data model](docs/phase-0/data-model.md) |
| Versioned REST contract | [OpenAPI 3.1 JSON](docs/phase-0/openapi.json) |
| API semantics and authorization inventory | [API design](docs/phase-0/api-design.md) |
| Deterministic ranking specification and worked examples | [Ranking](docs/phase-0/ranking.md) |
| Official providers, terms, resilience and attribution | [Integrations](docs/phase-0/integrations.md) |
| STRIDE and LINDDUN | [Threat model](docs/phase-0/threat-model.md) |
| Owners, mitigations and launch blockers | [Risk register](docs/phase-0/risk-register.md) |
| Privacy inventory, consent and legal review | [Privacy and legal](docs/phase-0/privacy-legal.md) |
| Test plan, accessibility, performance and usability | [Quality plan](docs/phase-0/quality-plan.md) |
| Phases, release gates and operations | [Delivery and operations](docs/phase-0/delivery-operations.md) |
| Architecture decisions | [ADRs](docs/adr/README.md) |
| Proposed dependencies and official sources | [Dependencies](docs/phase-0/dependencies.md), [Sources](docs/phase-0/sources.md) |
| Every supplied checklist item and detailed requirement bullet | [Compliance matrix](docs/phase-0/compliance-matrix.md), [CSV](docs/phase-0/compliance-matrix.csv) |
| Original brief | [Requirements](docs/phase-0/requirements.md) |
| Document checks actually performed | [Validation](docs/phase-0/validation.md) |

All legal material is **DRAFT — FOR QUALIFIED LAWYER REVIEW**. Production infrastructure, controller identity and vendor approvals remain unresolved. Docker is not available in the current machine: database/container and real-IdP tests are prepared but have not been run locally.

## Working agreement

The Phase 0 approval gate is complete. Phases 1–5 retain every original requirement. The Phase 0 matrix is preserved as its design snapshot; the current ledger records source/test evidence and remaining work. `Partial` is never described as a completed production control. Documentation does not constitute a passing implementation check.
