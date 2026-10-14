# Quality and acceptance plan

Design targets, not measured results. ISO/IEC 25010 quality dimensions covered: functional suitability, performance efficiency, compatibility, interaction capability/usability, reliability, security, maintainability and flexibility/portability, with applicable safety concerns reviewed. Freeze normative editions in Phase 1; no unlicensed reconstruction of ISO standards or certification claim. WCAG target is **2.2 AA**; ISO/IEC 40500 reference does not by itself certify WCAG 2.2 conformance.

## Automated and manual evidence

| Area | Tests/gates to implement | Passing evidence |
| --- | --- | --- |
| Domain | Both rank strategies, consent state machine, combinations/unknowns, money, provenance, distance/hours and property tests | >=80% domain statements/branches; 100% ranking and consent statements/branches, reviewed vectors; no coverage exclusions masking logic. |
| Database integration | Migrations up/down, RLS pooled sessions/two owners, transaction rollback/outbox, constraints, spatial boundaries, erase/expiry, query plans | Synthetic real PostgreSQL/PostGIS/Redis CI; all pass, plans archived; no real data. |
| Provider contracts | Google/Meta/TikTok fixture schema, missing attribution/date, invalid JSON, response size, 429, Retry-After, timeout/cancellation, jitter, breaker/probe/bulkhead, no forbidden cache | Virtual clock and deterministic random fixtures, no billed calls in CI; approved staging smoke separate. |
| API security | Missing/expired/wrong iss/aud/alg tokens, scope/object ownership, cursor tamper, unknown fields, CSRF/CORS, webhook replay, limits, idempotency races | Negative paths asserted, Problems no trace, no sensitive logs, allowlist/default deny proven. |
| Consent | Fresh/rejected/granted/withdrawn/expired/version-changed, GPC/DNT, maps/social/analytics independence, settings persistence and late async completion | Browser intercept asserts zero nonessential requests, iframe/script/preconnect/thumbnail loads before valid opt-in and after withdrawal. |
| E2E | Anonymous search, manual/current center, denied geolocation, share URL, reset filters, drag/buttons/keyboard reorder, strategies, saved presets, place details, locale, rights/reports | Playwright desktop/mobile bilingual flows with sandbox fixtures and accessible error states. |
| Accessibility | axe on all routes/states, Lighthouse, contrast, keyboard-only, screen-reader and text-spacing/zoom/reflow | Zero serious/critical automated violations; reviewed AA findings remediated; manual NVDA, VoiceOver, TalkBack scripts and findings logged. |
| Upload/content trust | Magic-type/size/pixel/EXIF/polyglot/malware/quarantine timeout, license grant, notices/appeals, heuristic false positives | No publication until all controls pass; no sentiment-based suppression; scan fail remains quarantined. |
| Performance | Lighthouse CI representative mobile routes; k6 baseline/ramp/spike/soak under independent/native and failing-provider scenarios | Budgets below with environment/run/workload/p50/p95/p99/error report; tests have not run yet. |
| Supply chain/security | SAST, DAST, SCA+licenses, secrets, IaC, container scans, SBOM, signed provenance | Required blocking jobs with no unresolved critical/high vulnerabilities unless narrowly time-bounded security-approved exception. |

## Performance/reliability budget

Targets: LCP <=2.5s, INP <=200ms, CLS <=0.1, TTFB <=800ms. Native search p95 <=500ms excluding external I/O; provider path total deadline <=3s, visible degradation beyond budget. Proposed initial mobile payload: first-route JS <=180 KiB compressed, CSS <=40 KiB, initial image <=150 KiB and explicit dimensions; confirm bundle budget after framework measurement. Lighthouse lab metrics cannot demonstrate real-user INP by themselves; field measurements load only with consent and anonymous aggregation.

Initial sizing scenario to confirm: 10,000 independently licensed places, 1,000 concurrent searches at a ramped 100 searches/sec, 20-result pages, 200 candidates max. k6 native ramp 1→100 rps over 10m, 10m plateau; separate spike at 200 rps 2m, soak 1h, plus provider outage/quota/abort cases. Use synthetic traffic and credentials. Record infra/hardware/config/dataset/cost; failing scale budgets require right-sizing/algorithm fixes before deployment. No generated load report pretends these runs occurred.

Optimize native images AVIF/WebP/srcset/lazy/dimensions, defer noncritical scripts, code split and lazy maps/embeds; system/local licensed subset fonts; Brotli, HTTP/2+ at CDN. Provider images follow delivery rights. Native HTTP/Redis cache permissions and ETags avoid redundant transfers, never override consent/terms. Query batching and EXPLAIN prevent N+1. Partition/read replica/autoscaling thresholds come from measurement. Sustainability: bounded fields/results, minimized retries, right-sized instances and documented utilization/cost, not an unsupported “green” claim.

Proposed 99.9% monthly availability SLO; 30-day error budget 43.2 minutes. Track native search latency/availability, provider success/degradation, rate limits, outbox lag, retention overdue and upload quarantine. Provider-dependent SLI separate from native functionality so failures are not concealed. No real-user exact coordinates/queries in metrics. Backups/restore RPO 15m/RTO 4h are launch targets, verified quarterly and after material changes.

## Human-centered design and wireframes

Hypothesis personas (not user research results): bilingual mobile visitor choosing an inexpensive first-date café; keyboard/screen-reader user comparing accessible venues; active-outing planner with cuisine/dietary preferences. Validate these with users without collecting unnecessary relationship/sensitive traits.

Primary flow: language -> text/place or explicit current location -> combinable filters -> priority controls/strategy -> explainable list -> place source details -> optional consent-gated map/social -> optional account save. Failed location returns manual city choice; no-data filters offer clear editable filter summary. Source outage says unavailable rather than suggesting the venue is closed.

Wireframe search: skip link, header/logo+language, visible query/city labels and Search/current-location buttons; filter disclosure panels; priorities with drag handles+Move buttons; strategy explanation; live result count; list/map toggle; cards with name/category/price basis/distance/rating source/reasons; footer legal/settings/report links. Mobile layout is single column; list is always equivalent to map. Place detail: H1/address, facts with unknown labels, observed hours/open state, contacts/source links, verified tag evidence, licensed photo gallery, separate source opinion sections, opt-in map/social placeholders, save/report actions. Account: saved presets/places, consent purposes, export/correction/delete controls, security settings. No photo is necessary to understand a card.

ISO 9241-110 mapping: task suitability via progressive filters, self-description via price/unknown/source labels, controllability via undo/reset/withdrawal, expectations via native controls, error tolerance via specific validation/manual center fallback, individualization via language/presets/priorities, learnability via explicit strategy explanations. Document iterative changes rather than assuming this meets user needs.

## Accessibility implementation contract

Semantic headings/landmarks/forms, lang and translations; visible labels and field-level actionable errors, autocomplete where appropriate, no placeholder-only fields or color-only state. All controls operable by keyboard with visible unobscured focus, logical order and no traps. Skip link reaches results; modals restore focus; result count/status uses polite aria-live without repeated verbose announcements. Reorder announces position and retains focus; target design >=44px where practical and absolute WCAG minimum >=24×24px with specified spacing exceptions reviewed.

Contrast text >=4.5:1, large text/UI/focus >=3:1. Meaningful images have descriptive/neutral place alt, decorative images empty alt. Reflow 320px, 200% text/zoom and spacing overrides without clipping. Respect reduced motion, no flashes, accessible media captions/transcripts and map list equivalent. Authentication allows paste/managers and avoids cognitive tests; errors do not erase previously entered safe fields. Destructive account deletion needs accessible confirmation and recent step-up.

Manual test script: keyboard traverse all flows; activate and move every filter without mouse; deny and retry geolocation; reorder from each position using buttons; switch languages/strategy and announce counts; inspect unknown/source labels; open/close galleries/dialogs and return focus; operate maps through list/control alternatives; test consent accept/reject/withdraw/GPC; perform auth and rights flows; use 320px, 200% and spacing overrides; NVDA/VoiceOver/TalkBack headings, labels, announcements and reading order; record device/browser/version, actual tester and defects. Automated axe alone is insufficient.

Usability plan: >=5 real participants per round including people with disabilities, voluntary informed research consent, task success/time/errors and qualitative feedback; proposed success >=90% for search/filter/reorder with no critical barriers. Do not claim five participants were tested in a document-only phase. Review personas/wireframes before styling; repeat after substantive fixes.
