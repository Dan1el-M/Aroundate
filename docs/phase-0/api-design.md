# API draft and endpoint inventory

Contract: [OpenAPI 3.1](openapi.json). Status: Draft, no endpoints implemented. Base prefix `/v1`, JSON request/response, RFC 9457 Problems. Date values RFC 3339 UTC, currencies ISO 4217 CRC/USD, countries ISO 3166, locales BCP 47 `es-CR`/`en`. Public identifiers UUIDv7; correlation UUID is separate.

## Search and privacy

`POST /v1/searches` evaluates a search; it does not persist the search or location. Coordinates/manual address belong in a body to avoid URL histories and referrer/query logs. Response and requests use no-store and log redaction. Whitelist exact query fields, reject unknowns with 422, validate geographic/spend/rating/limit ranges and priority. Center is either coordinates, manual address or configured labeled city; never silent user geolocation. The browser invokes navigator.geolocation only after the user clicks and sees the specific notice.

Share URLs use `/discover?q=...&city=...&categories=...&cuisines=...&currency=CRC&radius_km=5&priority=price,distance&strategy=weighted` with an allowlisted parser; exact center, account IDs and sensitive saved-location IDs omitted. Query text can itself be sensitive: sharing is an explicit copy-link action with preview. A later explicit share-location action needs its own warning/consent and cannot change this default. URL syntax is a presentation format mapped to the same SearchRequest; private presets are never public by opaque ID.

`POST /v1/autocomplete` takes query/locale/center in a body with small limits. `POST /v1/geocoding` handles manual addresses through the official adapter; no arbitrary fetch URL. `/v1/taxonomies` exposes database-managed tree/cuisines/features/tags/configured price meanings. `/v1/places/{place_id}` returns facts with evidence, unknowns and per-source ratings/opinions/media/contacts/hours; generated summary disabled by default. Data provenance and provider limitations travel with all responses. A provider-only place reference can have a permitted ID shell, not a copied Google record.

## Pagination, caching and side effects

Hard page max 50/default 20, candidates max 200. Cursors are opaque authenticated-encrypted or signed with minimum 256-bit managed key, expire after 5m, contain query HMAC (not query/address), revision, fixed evaluated_at, strategy/version and last comparison key/permitted IDs+rank-facts HMAC. No coordinate or user data in cursor. Search body resubmitted on each page; mismatch/tamper returns 422, expiry/facts revision change returns 409 restart-required. No total global corpus count claim; show scope/truncation. Native frozen-revision ordering and live re-fetch consistency follow [ranking](ranking.md).

Search/geocoding/personal responses are no-store; provider storage policy wins over every cache optimization. Native taxonomy/independently licensed place reads may use ETag and public max-age=60 with conditional If-None-Match=304. Mixed provider details no-store. User-owned resources use private no-store ETags for optimistic concurrency only; PATCH/DELETE use If-Match or 428, mismatched version 412. Never cache authorized private content as public or share a CSP nonce via cached HTML.

Side-effecting POSTs require Idempotency-Key: UUID or reviewed random string 16–128 characters, scoped to authenticated owner or anonymous purpose-session and route. Store key/body hashes and resource outcome atomically 24h; same key/same body returns original outcome/reference, same key/different body 409. GET/PUT/DELETE idempotent semantics remain; conditional requests protect concurrent changes. Search/autocomplete/geocoding POSTs have no durable side effect and do not require key. Provider connection initiation uses the key plus OIDC state/PKCE; webhook replay uses provider event ID, not a client header.

## Authorization inventory

The OpenAPI lists every planned API operation; no shadow endpoints. OAuth authorize/token/registration/reset/MFA pages belong to the separate IdP and are not invented Aroundate password endpoints. BFF `/auth/login`, `/auth/callback`, `/auth/logout` and all presentation routes are explicitly tracked below and must join a separate route manifest in Phase 1. Internal readiness/metrics live on private listeners and are not additional public APIs.

| Group | Planned operations | Access and object rules |
| --- | --- | --- |
| Discovery | search, autocomplete, geocoding, taxonomy, place detail, provider status | Anonymous, distributed quotas, no account required, no secret status details. |
| Consent proof | current choices and POST event | Anonymous signed purpose-session or account; CSRF/origin checks, cannot change another subject; grants require current text/version. |
| Legal/contact | policy by allowed slug/version, reports/status/appeals, contact submission | Public submission, own report receipt/purpose-session or account for private status/appeal, minimal fields, bounded quotas, no implied marketing consent. |
| Personal profile | get/patch profile, saved-place list/put/delete, preset list/create/get/patch/delete | `profile:read/write`, `saved:read/write`, `presets:read/write`; every object owned by token subject, 404 for foreign objects. |
| User content | POST opinion, PATCH/DELETE own opinion, media upload intent, media finalize | `reviews:write`, `media:write`; verified-account and license/terms rules, deny publication before moderation/scan controls. |
| Rights | create/list/get DSR, request export download, confirmed account DELETE | `rights:read/write`, own requests only; recent step-up for export/deletion; deletion queued 202. |
| Provider connections | begin connection and disconnect | `providers:write`, own connection, reviewed scopes, state replay prevention; official OAuth callbacks documented per enabled provider. |
| Moderation | list flags, POST reasoned decision | `moderation:read/write`, privileged MFA, audit and separation of duties; no user-set role. |
| Admin taxonomy | POST/PATCH category | `catalog:write`, admin MFA/audit, no cycles, owner context not client-controlled. |
| Provider webhook | POST provider webhook | Provider enum/approved configured handler, exact-byte signature/time/replay check; no user JWT substituted for provider signature. |

First-party endpoints use BFF session cookies or bearer access tokens on API clients. Both enforce identical scopes/ownership. API JWTs strictly verify iss/aud/exp/nbf/iat, allowed algorithm/key type, bounded clock skew (30s proposed), key rotation and JWKS host allowlist; never trust token-selected algorithm or remote key URL. OAuth follows code+PKCE and current security BCP; confirm the status of the OAuth 2.1 specification during implementation rather than treating a label as proof of conformance. DSR/exports/deletion need recent MFA/passkey step-up. Cookie routes enforce CSRF tokens+Origin, same-origin BFF and explicit CORS origins; no credential wildcard. Idempotency cannot substitute for authorization.

## Transport limits and errors

Proposed quotas: anonymous discovery 30/min rotating short-lived IP hash and necessary session; signed-in discovery 60/min subject; writes 10/min; contact/reports 5/hour; global provider budget. Account+network layers resist easy identifier cycling and NAT fairness must be evaluated. Exceed =>429 with Retry-After, no revealing quota internals. JSON <=64KiB, query string <=2KiB, upload max 10MiB through separate signed object pipeline; boundary/too-large returns 413. Unknown query fields rejected too. All body value objects disallow additionalProperties unless explicitly declared map.

Status: 200 read/evaluation, 201 new resource+Location, 202 async work, 204 completed no-body operation, 304 conditional read, 400 malformed JSON, 401 unauthenticated+WWW-Authenticate, 403 insufficient scope/verification, 404 absent or foreign-owned, 409 idempotency/state/cursor conflict, 412 stale ETag, 413 size, 422 validation, 428 missing precondition, 429 quota, 503 unavailable dependency. Failure content-type application/problem+json with type/title/status/detail/instance/correlation_id plus specific field errors, no stack trace or personal values. X-Correlation-ID generated/validated at ingress and consistently logged as opaque metadata.

## Presentation route manifest to build

`/discover`, `/places/[id]`, `/account`, `/account/presets`, `/account/privacy`, `/account/security`, `/privacy`, `/cookies`, `/terms`, `/refunds`, `/accessibility`, `/business-information`, `/contact`, `/report`, `/auth/login`, `/auth/callback`, `/auth/logout`, `/.well-known/security.txt`. Authentication callbacks are code/state validation routes, not open redirects; logout state change uses POST/CSRF. Official provider connection callbacks are added explicitly only when configured and included in OpenAPI/API inventory if served by API. No webhook route becomes functional solely because the draft includes it.
