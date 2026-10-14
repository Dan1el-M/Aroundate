# Phase 0 approval brief

Date: 2026-10-14 (America/Costa_Rica). Status: **Approved by owner; original design snapshot**.

The workspace was empty and had no existing application, Git repository or AGENTS.md instructions. This package therefore proposes a new system rather than adapting an existing architecture. Documentation is in English to match the engineering brief; the product will launch in Spanish (`es-CR`) and English (`en`).

## Proposed stack

TypeScript throughout; Next.js/React for mobile-first web and a thin same-origin BFF; NestJS for the versioned API; PostgreSQL with PostGIS, pg_trgm and unaccent for independently licensed discovery data; Redis for explicitly permitted caches, quotas and work queues; S3-compatible private object storage for licensed uploads; Keycloak-compatible OIDC identity with email registration, passkeys and TOTP. Docker Compose for local development and managed container hosting for staging/production. Production cloud and deployment region remain unselected. See [architecture](architecture.md), [dependency justification](dependencies.md) and [ADRs](../adr/README.md).

The API remains independent of the BFF so mobile clients can use Authorization Code + PKCE. Authentication is optional for discovery and required for personal saved places, presets and user reviews. Owner-confirmed features will be delivered, not silently dropped because they are optional in the source brief.

## Assumptions requiring approval

| ID | Proposed assumption | Consequence |
| --- | --- | --- |
| A01 | First geography is Costa Rica; default center is San José city center, clearly labeled, until the user chooses another center. | Never silently substitute geolocation; coordinate configuration must have an independent licensed source. |
| A02 | Free service at launch; no subscriptions, sponsored listings, affiliates or marketing email initially. | Keep paid/refunds/ads/marketing feature flags, disclosure rules and templates; activate only after review. |
| A03 | Adult-only service, proposed minimum age 18, self-attestation without collecting birth date. | Legal review must assess age assurance; no behavioral ads or inferred romantic/sexual profiles. |
| A04 | Include accounts, saved places, presets and verified-account reviews in Phases 1–3. | No identity document or visit proof by default; label verified account, never verified visit. |
| A05 | Default radius 5 km; configurable maximum 50 km; default page 20, maximum 50; at most 200 candidates per search. | Display candidate scope, truncation and provider gaps; ranking does not claim coverage of all places. |
| A06 | CRC and USD supported; numerical price range means estimated per-person spend for a stated offering/basis. | Unknown amounts stay unknown; price level is ordinal and not a currency conversion. |
| A07 | Exchange rates supplied by an approved official API or a dated administrator-maintained rate. | No invented live rate; strict currency filter excludes unconvertible prices. |
| A08 | Google ratings are the default explicit rating criterion when available; user may choose Aroundate ratings. | Ratings stay separate by source; social likes are never converted into stars. |
| A09 | Own/owner/editorial licensed catalog is indexed in PostGIS. Google details are fetched on a user request, not copied into that catalog. | No general Google content warehouse, offline mirror or bulk synchronization. |
| A10 | Instagram/TikTok content is owner-authorized or a reviewed public URL association; missing source content is a normal state. | Arbitrary commercial crawling and universal social review aggregation are not promised. |
| A11 | No generated opinion summaries at launch; implement the guarded, labeled summary path only if activated. | Source reviews remain unmodified; this optional function remains in the design. |
| A12 | Production uses managed KMS, secrets, immutable encrypted backups and WAF/CDN; self-hosted Keycloak is an option, not a proven operated service. | Deployment cannot be considered ready until services, costs, region and accountable operators are selected. |
| A13 | Exact location is used only in a search request; sharing URLs omit it by default. Saving or sharing an exact location requires separate explicit action. | Filter sharing still works with city/region identifiers; disclose sensitivity before optional location sharing. |
| A14 | RPO 15 minutes, RTO 4 hours, service SLO 99.9% monthly are proposed targets. | Restore/load evidence and budget needed before claiming these targets. |

## Open questions and external blockers

1. Approve the proposed stack and inclusion of accounts/reviews, or specify alternatives before scaffolding.
2. Confirm geography, adult age policy, free-service launch, price basis and ranking defaults.
3. Identify controller/legal business identity, support/abuse contacts and counsel. Placeholder identities cannot be published as a valid imprint.
4. Choose production cloud, region/data residency, monthly spend and expected peak traffic; nominate operations and incident-response owners.
5. Confirm Google billing-address terms, API budget, keys and Meta/TikTok developer app approvals. Credentials must be configured through a secrets manager, never pasted into repository files.
6. Approve provider-limited coverage: official APIs do not establish access to every review, photo or social post about an arbitrary place. Meta documentation could not be retrieved by the research tool; its access, scopes, retention and oEmbed rules must be verified in the developer account before Phase 3.
7. Approve proposed retention periods and legal deadlines after counsel review. Costa Rican notification obligations must be verified separately; a GDPR 72-hour rule cannot be assigned universally to Costa Rica.

Items 3–7 do not prevent development of an isolated sandbox after stack approval. They block affected production features or public release. None authorize collecting real personal data in non-production.

## Scope preservation and conflicts

Every detailed bullet and checklist entry is tracked in [the matrix](compliance-matrix.md). The design reconciles provider restrictions with database/caching requirements by storing only independently licensed content and expressly permitted provider fields. Unknown hours, accessibility, price, dates or tags are represented honestly rather than invented. Native upload/review capabilities retain their security and moderation requirements.

Strict COEP/CORP isolation and SRI can conflict with official dynamically served maps/embeds. The proposed route-specific policy in [the threat model](threat-model.md) requires owner/security approval and compatibility tests; it is an explicit exception proposal, not a silently removed requirement. No analytics or embeds load before valid consent. No scraped data is a fallback.

## Approval record

| Decision | State | Evidence |
| --- | --- | --- |
| Phase 0 package prepared | Complete as design, pending review | Files linked from root README |
| Stack, assumptions and explicit exception proposals approved | **Approved 2026-10-14** | Owner replied: “si los aprueba, emepcemos con el proyecto” |
| Begin Phase 1 implementation | **Authorized and started** | Owner approval; see ../implementation.md |
| Production/legal/provider launch approval | Pending later evidence | Risk register and release gates |

The requested stop after Phase 0 was satisfied and revoked by the owner's approval to begin implementation. Production legal/vendor approvals remain distinct and pending. The current implementation is tracked in [implementation status](../implementation.md); this folder retains the original proposed contracts and design evidence.
