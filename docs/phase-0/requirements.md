# ROLE
You are a senior full-stack engineer and security-minded software architect. Design and implement the system described below to production quality, following ISO/IEC 25010 (product quality), ISO/IEC 27001/27002 and 27034 (security), ISO/IEC 27701 and 29100 (privacy), ISO 9241 (usability), and WCAG 2.2 AA (ISO/IEC 40500). Where a requirement is ambiguous, state your assumption explicitly in the documentation instead of silently choosing.

# 1. PROJECT OBJECTIVE
Build a web application (responsive, mobile-first; architecture must allow a later mobile app) that helps users discover and choose places to go on a date. Users search places, filter them by category, food type, price and distance, and receive results ranked according to the filter they consider most important. The app aggregates place information, customer opinions, ratings and pictures from Google Maps / Google Places, Instagram and TikTok, and presents them with clear source attribution.

# 2. FUNCTIONAL REQUIREMENTS (all mandatory)

## 2.1 Search and discovery
- Free-text search for places and cuisines (autocomplete, typo tolerance, accent-insensitive; Spanish and English).
- Search around the user's current location (browser geolocation, only after explicit permission) or a manually entered address/city.
- Place detail page: name, address, map position, opening hours (with "open now"), phone, website, price level, categories, photos, aggregated opinions, and links to original sources.
- Date-oriented tags (e.g., romantic, quiet, casual, outdoor, active, good for first date), taken from source data or editorial/user tagging, never invented.

## 2.2 Categories and filters
- Top-level categories: cafés/coffee, restaurants, active/adventure activities, plus an extensible category tree managed in the database (not hard-coded).
- Specific food types / cuisines (e.g., Italian, sushi, vegetarian, vegan, Costa Rican, desserts), multi-select.
- Price filter (price levels and/or min–max range in a configurable currency; default CRC with USD support).
- Distance filter (radius slider, km; default and maximum configurable).
- Additional filters: minimum rating, open now, accessibility features, dietary options.
- Filters combinable, shareable by URL (query parameters), saved as user presets.

## 2.3 Result ordering by filter importance
- The user can define filter priority (e.g., 1st price, 2nd distance, 3rd type) via an accessible reorder control (drag-and-drop AND keyboard/button alternative).
- Implement two selectable ranking strategies:
  1. Lexicographic ordering by the user's priority list with deterministic tie-breakers.
  2. Weighted multi-criteria score with normalized criteria (price, distance, rating, type match, popularity), weights derived from the priority order.
- Ranking must be deterministic, unit-tested, documented, and explainable: each result shows why it ranked where it did ("Ranked 2nd: cheaper than 80% of results, 1.2 km away").
- Sponsored/promoted results, if ever added, must be clearly labeled and never mixed silently into organic ranking.

## 2.4 External integrations (official APIs only)
- Google Maps Platform (Places API, Maps JavaScript API, Geocoding): place data, ratings, reviews, photos, map display. Follow Google's terms: required attribution, storage and caching limits (store the place ID long-term; refresh other data within the permitted window), no pre-fetching/scraping.
- Google search/other Google services: only through official APIs.
- Instagram: official Instagram Graph API / oEmbed only (e.g., embedding public posts, business-account content the owner has authorized).
- TikTok: official TikTok APIs / embed only.
- NO scraping, unofficial APIs, or credential-sharing under any circumstance. If a source returns no data, the UI must degrade gracefully and still work.
- Implement an integration layer (anti-corruption layer + adapter per provider) with: timeouts, retries with exponential backoff and jitter, circuit breaker, rate-limit handling, response caching within each provider's terms, schema validation of every external response, and a health/status indicator.
- Each external item (review, photo, post) is shown with its source, author display name as provided, date, and a link back to the original. Do not alter the meaning of reviews.
- Opinions summary (optional): any generated/aggregated summary must be labeled as such, link to the underlying sources, and never fabricate quotes.

## 2.5 Opinions, photos and trust
- Show ratings and customer opinions per source separately (do not merge into a single unexplained score; if an aggregate is shown, document the formula).
- Detect and handle suspicious/fake reviews: heuristics (burst patterns, duplicate text, abnormal rating distributions), flagging, moderation queue, documented removal process. Never buy, write, incentivize, suppress or selectively hide reviews.
- If the app lets users post their own reviews: verified-visit or verified-account rule, clear moderation policy, disclosure of incentives, report/notice-and-action mechanism.
- Images: display only images obtained through licensed API terms or uploaded by users with an explicit license grant; keep license/source/author records; provide attribution; implement a takedown process; no hotlinking of unlicensed images; image upload validation (content-type sniffing, size limits, malware scan, EXIF stripping).

## 2.6 User accounts (optional but designed in)
- Anonymous use of search is allowed. Accounts are needed only for saved places, presets and reviews.
- Registration by email or OAuth/OIDC; passkeys/WebAuthn and TOTP MFA supported.
- Profile page with data export, consent management, and account deletion (full erasure workflow).

# 3. ARCHITECTURE AND CODE QUALITY
- Propose and justify the stack (default suggestion: TypeScript; React/Next.js front end; Node.js NestJS or Python FastAPI back end; PostgreSQL + PostGIS; Redis cache; object storage + CDN). Containerized (Docker), configured via environment variables, 12-factor.
- Layered/hexagonal architecture with clear separation of domain, application, infrastructure and presentation layers.
- Apply SOLID, DRY, KISS, YAGNI, least privilege, defense in depth, fail-secure, secure-by-default.
- Design patterns where justified: Repository, Unit of Work, Dependency Injection, Strategy (ranking strategies), Factory/Adapter (provider integrations), Circuit Breaker, Retry, Bulkhead, Idempotency keys, Outbox (if events), Anti-corruption layer, API Gateway/BFF.
- Linting, formatting, static typing, strict compiler options, conventional commits, protected main branch, mandatory pull-request review, signed commits.
- Unit, integration, contract, end-to-end, accessibility, performance and security tests; target ≥80% coverage on domain logic and 100% on ranking and consent logic.
- Documentation: README, architecture diagram, data-flow diagram, ADRs (architecture decision records), runbooks, OpenAPI spec, threat model, and a CONTRIBUTING guide.

# 4. DATABASE REQUIREMENTS
- Normalized schema (3NF) with deliberate, documented denormalization only for measured performance needs.
- Suggested entities: users, consents, places, place_sources (provider, external_id, last_synced), categories (tree), cuisines, place_categories, price_levels, opinions (source, author, rating, text, date, license/attribution), media (source, license, author, attribution), saved_places, filter_presets, search_logs (minimized/anonymized), moderation_flags, audit_log, data_subject_requests.
- PostGIS geospatial indexes (GiST) for radius search; B-tree/GIN indexes designed from EXPLAIN plans; full-text search with trigram/unaccent.
- Constraints: PK/FK, UNIQUE, CHECK, NOT NULL; NUMERIC for money, TIMESTAMPTZ in UTC; non-guessable public IDs (UUIDv7).
- Personal data separated in its own schema/tables; soft delete plus scheduled hard delete to honor retention and erasure.
- Versioned, reversible migrations; seed data; separate DB roles (app role without DDL/DROP; migration role; read-only reporting role).
- Encryption at rest (AES-256 via managed KMS), TLS in transit, field-level encryption for sensitive fields, row-level security where multi-tenant.
- Backups encrypted, immutable, restore-tested; documented RPO/RTO.

# 5. API REQUIREMENTS
- API-first: OpenAPI 3.x specification, REST, versioned (/v1), JSON, consistent naming.
- RFC 3339 UTC dates, ISO 4217 currencies, ISO 3166 countries, BCP 47 languages.
- Correct HTTP verbs and status codes; errors in RFC 9457 Problem Details with correlation ID; no stack traces to clients.
- Cursor-based pagination with a hard max page size; filtering and sorting parameters whitelisted and validated (including the filter-priority parameter).
- Idempotency-Key for side-effecting POSTs; ETag/Cache-Control and conditional requests.
- Authentication: OAuth 2.1/OIDC, short-lived tokens, strict JWT validation (iss, aud, exp, pinned algorithm), PKCE for public clients.
- Authorization: deny by default, object-level checks on every endpoint (prevent BOLA/IDOR), scopes/roles.
- Rate limiting and quotas (429 + Retry-After), request size limits, strict schema validation rejecting unknown fields (prevent mass assignment).
- CORS with explicit origin allowlist; CSRF protection; no wildcard with credentials.
- Webhook signature verification and replay protection (for any provider callbacks).
- API inventory with no undocumented/shadow endpoints; follow OWASP API Security Top 10.

# 6. SECURITY REQUIREMENTS
- Threat model (STRIDE for security, LINDDUN for privacy) and risk register delivered as documents; follow OWASP ASVS (target Level 2) and OWASP Top 10.
- Server-side input validation with allowlists; context-aware output encoding; parameterized queries only; protection against XSS, SQL injection, SSRF (egress allowlist, block metadata IPs), CSRF, clickjacking, open redirects, path traversal, insecure deserialization.
- HTTPS everywhere, HSTS, TLS 1.2+ (1.3 preferred).
- Security headers: strict nonce-based Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors, COOP/COEP/CORP. Subresource Integrity for third-party scripts.
- Cookies: Secure, HttpOnly, SameSite, __Host- prefix where applicable.
- Passwords: Argon2id; breached-password check; NIST 800-63B rules; throttling/lockout; non-enumerating reset flows; session rotation, idle and absolute timeouts.
- Secrets in a secrets manager, never in code or git; automated rotation; secret scanning.
- Bot/abuse protection, credential-stuffing defenses, WAF/CDN DDoS protection.
- Email: SPF, DKIM, DMARC; publish /.well-known/security.txt and a vulnerability disclosure policy.
- Secure logging: centralized, tamper-resistant, synchronized time, never log passwords/tokens/personal data unnecessarily; alerting on anomalies; incident response plan including breach notification workflow (72-hour GDPR timeline, Costa Rican Law 8968 notice duties).
- Business-logic abuse protection (review spam, scraping of our own API, enumeration, rate abuse, race conditions).

# 7. PRIVACY, LEGAL AND COMPLIANCE REQUIREMENTS
Jurisdiction baseline: Costa Rica (Law 8968 data protection / PRODHAB, Law 7472 consumer protection, Law 7600 accessibility, Law 9048 cybercrime, Law 8454 digital documents), with configurable support for EU (GDPR, ePrivacy, DSA, European Accessibility Act) and US (CCPA/CPRA, FTC rules, ADA). Document assumptions and flag items requiring legal review. Do not present generated legal texts as final legal advice.
- Data minimization: collect only what each feature needs; location only on explicit request and not stored unless the user saves it; no unnecessary personal fields; automated retention and deletion schedules; pseudonymize/anonymize analytics.
- Privacy by design/default: most private settings by default; Data Protection Impact Assessment template (ISO/IEC 29134); records of processing; data inventory.
- Privacy Policy page (plain language, linked in footer and at every data-collection point): controller identity and contact, data categories and purposes, legal basis, recipients/processors, international transfers and safeguards, retention periods, user rights (access, rectification, erasure, restriction, portability, objection, withdrawal of consent), complaint route (PRODHAB / EU authority), profiling disclosure, version history.
- Consent in forms: unticked, purpose-specific checkboxes, separate from Terms; no bundling of marketing consent; consent log (who, when, what text version); withdrawal as easy as giving; double opt-in and one-click unsubscribe for email.
- Cookie consent banner: nothing non-essential loads before opt-in; "Reject all" as prominent as "Accept all"; granular categories; persistent link to change choice; stored proof; periodic re-ask. Cookie Policy listing every cookie (name, provider, purpose, duration, category) generated from an automated cookie audit.
- Analytics: privacy-friendly or self-hosted (Matomo/Plausible-style), anonymized IP, short retention, no cross-site identifiers, honor Global Privacy Control/Do Not Track, loaded only after consent where required; disclosure in the policy. No session replay or ad pixels without consent and review.
- Terms and Conditions: parties, service description, acceptable use, user-content license, IP, disclaimers about third-party data accuracy, liability limits within the law, termination, governing law and jurisdiction, dispute resolution, change notification, version history, click-wrap acceptance record.
- Business information page (imprint): legal name, tax/registration number, physical address, email, phone, regulatory registrations; linked in footer.
- Refund/cancellation policy: required if any paid feature or subscription exists (plain language, shown before purchase, time windows, how refunds are issued, cancellation as easy as sign-up, renewal reminders, local mandatory consumer rights). If no paid features exist, implement the policy page as a template toggled by a feature flag.
- Pricing transparency: totals including taxes and fees before checkout; no drip pricing, fake scarcity, fake countdowns, pre-ticked boxes, confirmshaming or other dark patterns.
- Substantiation of claims: maintain a claims register linking every marketing claim (e.g., "best", "most accurate", "secure") to evidence; avoid absolute claims; qualify "free", "unlimited", "guaranteed".
- Advertising/affiliate/sponsored content labeling; endorsement and testimonial disclosure; anti-spam compliance.
- Image and content copyright: license inventory, attribution, takedown (DMCA-style) process, open-source license inventory from the SBOM, AI-generated content disclosure.
- Third-party integrations: vendor inventory, Data Processing Agreements, minimum data sharing, least-privilege API keys and scopes, key rotation, privacy-enhanced/click-to-load embeds (maps, Instagram, TikTok, YouTube), disclosure in policies, international transfer mechanism (SCCs).
- Children: define minimum age (terms + age gate); no behavioral advertising to minors.
- Data subject request tooling: export, rectification, deletion (including backups and processors), identity verification, response deadlines tracked.
- Legal pages in footer: Privacy, Cookies, Terms, Refunds, Accessibility statement, Business information, Contact, Report abuse/takedown.

# 8. USABILITY AND ACCESSIBILITY (ISO 9241 / WCAG 2.2 AA)
- Human-centered design process (ISO 9241-210): user personas, user flows, wireframes, usability test plan (≥5 users per round, including users with disabilities).
- ISO 9241-110 interaction principles: task suitability, self-descriptiveness, controllability, conformity with expectations, error tolerance, individualization, learnability.
- Perceivable: alt text for every meaningful image (alt="" for decorative; for API-sourced images generate/store descriptive alt text or a neutral fallback such as "Photo of {place name}"); captions/transcripts for media; contrast ≥4.5:1 text and ≥3:1 for large text/UI components/focus; no color-only meaning; reflow at 320 px; text resize to 200%; support text-spacing overrides.
- Operable: 100% keyboard operable, including filters, ranking reorder, map controls, carousels and modals; no keyboard traps; logical tab order; visible, unobscured focus; skip links; target size ≥24×24 px; alternatives to drag-and-drop and gestures; respect prefers-reduced-motion; no flashing content; descriptive titles, headings, link text.
- Understandable: lang attribute and i18n (UTF-8, locale formats, translatable strings, Spanish and English at launch); visible labels on every field (not placeholder-only); required fields marked; inline, specific error messages with correction hints; autocomplete attributes; no redundant re-entry; confirmation or undo for destructive actions; accessible authentication (no cognitive tests, allow paste/password managers).
- Robust: semantic HTML first, ARIA only when necessary, correct names/roles/values, aria-live for result-count and status updates, accessible map alternative (list view of the same results).
- Keyboard-friendly forms and filters; clear labeling of buttons and results (price level meaning, distance units, source of each opinion).
- Accessibility testing: automated (axe, Lighthouse) in CI plus a manual keyboard and screen-reader test script (NVDA, VoiceOver, TalkBack). Publish an accessibility statement with a feedback contact.

# 9. PERFORMANCE AND EFFICIENCY (ISO/IEC 25010 performance efficiency)
- Targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, TTFB ≤ 800 ms, API p95 latency budget defined and documented (e.g., search endpoint p95 ≤ 500 ms excluding external API calls).
- Front end: responsive images (WebP/AVIF, srcset, lazy loading, explicit dimensions), minification, tree-shaking, code-splitting, deferred non-critical scripts, font subsetting, Brotli, HTTP/2 or HTTP/3, CDN, performance budget enforced with Lighthouse CI; lazy-load the map and third-party embeds.
- Back end: multi-layer caching (HTTP, Redis) within provider terms, connection pooling, async/queue processing for provider synchronization, no N+1 queries, graceful degradation when a provider is down.
- Database: query plans reviewed, indexes justified, partitioning/read replicas only if measured need.
- Load and stress tests (k6 or equivalent) with documented results; SLIs, SLOs, and error budgets; autoscaling and health checks.
- Resource efficiency and sustainability: right-sized infrastructure, efficient payloads, caching to reduce external calls (Green Software principles).
- Reliability: backups, tested restores, disaster recovery plan (ISO 22301), uptime monitoring.

# 10. DEVOPS, SUPPLY CHAIN AND OPERATIONS
- CI/CD pipeline with: lint, type-check, unit/integration/contract/e2e tests, SAST, DAST, SCA (dependency and license scan), secret scanning, IaC scanning, container image scanning, accessibility and performance gates; failing gates block merge/deploy.
- Infrastructure as Code, CIS-hardened baselines, separate dev/test/staging/production; no real personal data in non-production.
- Containers: minimal base images, non-root, read-only FS, pinned digests.
- SBOM (CycloneDX/SPDX), signed artifacts, dependency pinning and lockfiles, review for typosquatting.
- Feature flags, versioned releases, rollback plan, change log.
- Observability: structured logs, metrics, traces, dashboards, alerting, on-call runbook.
- Vulnerability management with severity SLAs; patch management; annual penetration test plan.

# 11. TESTING AND ACCEPTANCE
- Provide automated tests for: filter combinations, ranking strategies (including ties, missing data and extreme values), distance calculation, provider adapters with mocked responses, failure/timeout/circuit-breaker behavior, consent gating (no tracker loads before consent), authorization (IDOR) cases, input validation, accessibility, and performance budgets.
- Provide seed/demo data and a sandbox mode that works without paid API keys.

# 12. DELIVERABLES AND WORKING METHOD
Work in phases and stop for confirmation after Phase 0:
- Phase 0: confirm stack, assumptions and open questions; threat model; data model (ERD); OpenAPI draft; ranking algorithm specification; risk register; compliance matrix (requirement → implementation → evidence).
- Phase 1: project scaffold, CI/CD, DB migrations, auth, security baseline, legal pages and consent system.
- Phase 2: search, categories, filters, ranking, place pages, map.
- Phase 3: provider integrations (Google, Instagram, TikTok) with attribution, caching and moderation of opinions and photos.
- Phase 4: accessibility, performance and security hardening; tests; documentation.
- Phase 5: audit checklist run, remediation list, release notes.
Output: source code, tests, migrations, OpenAPI file, IaC, documentation, compliance matrix, and the completed checklist below with status (Done / Partial / Not applicable + reason) and evidence links for each item.

# 13. CONSTRAINTS
- Do not remove or simplify any requirement above without stating the reason and getting confirmation.
- Never hard-code secrets, API keys or personal data. Use placeholders and .env.example.
- Do not scrape or bypass any provider's terms. If a requirement cannot be met through official APIs, say so and propose a compliant alternative.
- Prefer standards and well-maintained libraries; justify every dependency (license, maintenance, security).
- Legal documents are drafts for lawyer review and must be marked as such.

A. Core functionality
-  Text search for places and cuisines, with autocomplete and typo tolerance
-  Search by current location (permission-based) or manual address
-  Categories: coffee, restaurants, active/adventure, extensible category tree
-  Specific food-type filter (multi-select)
-  Price filter (levels and/or range, multi-currency)
-  Distance filter (radius)
-  Extra filters: rating, open now, dietary, accessibility
-  Shareable filter URLs and saved filter presets
-  User-defined filter priority (accessible reorder control)
-  Lexicographic and weighted ranking strategies, deterministic and tested
-  Explanation of why each result ranks where it does
-  Place detail page (hours, map, contacts, photos, opinions, source links)
-  Date-oriented tags
-  Map view and equivalent accessible list view
B. Integrations
-  Google Maps/Places integration under official terms (attribution, caching limits)
-  Instagram integration via the official API/embeds only
-  TikTok integration via the official API/embeds only
-  Other Google services via official APIs only
-  Adapter and anti-corruption layer per provider
-  Timeouts, retries with backoff, circuit breaker, rate-limit handling
-  Schema validation of all external responses
-  Graceful degradation when a provider fails or returns no data
-  Source, author, date and link shown for every opinion and photo
-  Per-source ratings, with a documented aggregate formula if one is shown
-  Vendor inventory, DPAs, least-privilege keys, key rotation
C. Content trust
-  Fake-review detection heuristics and moderation queue
-  No buying, incentivizing or suppressing reviews
-  Verified-user rule and notice-and-action for user reviews
-  Image license and attribution records, plus takedown process
-  Upload validation (type, size, malware scan, EXIF removal)
-  Alt text for all meaningful images
-  Generated summaries labeled as such and linked to sources
D. Architecture and code quality
-  Justified stack, containerized, 12-factor configuration
-  Layered/hexagonal architecture, SOLID, design patterns applied
-  Linting, strict typing, protected branches, mandatory code review, signed commits
-  Unit, integration, contract, e2e, accessibility, performance and security tests
-  README, architecture and data-flow diagrams, ADRs, runbooks, OpenAPI, threat model
E. Database
-  Normalized schema with constraints and correct data types
-  PostGIS geospatial indexes and full-text search
-  UUIDv7 public identifiers
-  Personal data isolated in its own schema
-  Soft delete plus scheduled hard delete
-  Versioned, reversible migrations
-  Least-privilege DB roles
-  Encryption at rest and in transit
-  Encrypted, immutable, restore-tested backups, with RPO/RTO defined
-  DB audit logging
F. API
-  OpenAPI 3.x specification, versioned endpoints
-  ISO/RFC formats for dates, currencies, countries and languages
-  RFC 9457 error format with correlation ID
-  Cursor pagination with a maximum page size
-  Whitelisted filtering and sorting
-  Idempotency keys, ETag/Cache-Control
-  OAuth 2.1/OIDC, strict JWT validation, PKCE
-  Object-level authorization (no BOLA/IDOR)
-  Rate limiting, request size limits, schema validation rejecting unknown fields
-  CORS allowlist, CSRF protection, webhook signature verification
-  API inventory with no shadow endpoints
G. Security
-  Threat model (STRIDE/LINDDUN) and risk register
-  OWASP ASVS and Top 10 coverage
-  Input validation, output encoding, parameterized queries
-  Protection against XSS, SQLi, SSRF, CSRF, clickjacking, open redirect
-  HTTPS, HSTS, TLS 1.2+
-  Full security header set, SRI on third-party scripts
-  Secure cookies
-  Argon2id, breached-password check, MFA/passkeys, session management
-  Secrets manager, rotation, secret scanning
-  WAF/CDN, bot protection
-  SPF/DKIM/DMARC, security.txt, disclosure policy
-  Centralized secure logging, alerting, no sensitive data in logs
-  Incident response plan and breach notification workflow
-  Business-logic abuse protection
H. Privacy and legal
-  Data minimization, retention schedules, anonymized analytics
-  Privacy by default, DPIA template, records of processing
-  Privacy Policy with all required sections
-  Granular, unticked, logged consent in forms; easy withdrawal
-  Cookie banner with equal “Reject all”, and no trackers before consent
-  Cookie Policy with an automated cookie audit
-  Privacy-friendly analytics, GPC/DNT honored, disclosed
-  Terms and Conditions with click-wrap acceptance record
-  Business information page
-  Refund/cancellation policy (or template behind a feature flag)
-  Transparent pricing, no dark patterns
-  Claims register for substantiation
-  Sponsored/ad/affiliate labeling
-  Image copyright and open-source license inventory
-  Data subject request tooling (export, rectification, erasure)
-  Age policy and children’s data safeguards
-  DPAs and international transfer mechanisms
-  Local law mapping (Costa Rica) plus configurable EU/US modules
-  Legal footer links: Privacy, Cookies, Terms, Refunds, Accessibility, Business info, Contact, Takedown
I. Usability and accessibility
-  Personas, user flows, wireframes, usability tests with real users
-  ISO 9241-110 principles applied
-  Contrast 4.5:1 / 3:1, no color-only meaning
-  100% keyboard operability, visible focus, skip links, no traps
-  Keyboard alternative for drag-and-drop reordering
-  Target size ≥24×24 px
-  Reflow at 320 px, 200% zoom, text-spacing support
-  Reduced-motion support, no flashing
-  Labels on all fields, inline actionable errors, autocomplete attributes
-  Accessible authentication
-  Semantic HTML, correct ARIA, aria-live for dynamic updates
-  Spanish and English i18n, locale formatting
-  Clear labeling of prices, distance units and data sources
-  axe/Lighthouse in CI plus manual screen-reader testing
-  Published accessibility statement
J. Performance and reliability
-  Core Web Vitals targets met (LCP, INP, CLS) and TTFB budget
-  Image optimization, code-splitting, compression, CDN, HTTP/2 or 3
-  Lazy-loaded map and embeds
-  Redis/HTTP caching within provider terms
-  No N+1 queries, async jobs for provider sync
-  Load and stress test results documented
-  SLIs, SLOs, error budgets, health checks, autoscaling
-  Disaster recovery and business continuity plan with tested restore
-  Efficient resource use (Green Software principles)
K. DevOps and supply chain
-  CI/CD with SAST, DAST, SCA, secret, IaC and container scans, with blocking gates
-  IaC, CIS hardening, separated environments, no real personal data outside production
-  Minimal, non-root containers with pinned digests
-  SBOM, signed artifacts, dependency pinning
-  Feature flags, versioned releases, rollback plan
-  Metrics, tracing, dashboards, on-call runbook
-  Vulnerability SLAs and patch management
-  Annual penetration test and accessibility/privacy audit plan
L. Deliverables
-  Phase 0 package (assumptions, ERD, OpenAPI draft, ranking spec, compliance matrix) confirmed before coding
-  Source code, tests, migrations, IaC, docs
-  Sandbox mode with seed data (works without paid API keys)
-  Final compliance matrix with status and evidence for every item
-  Legal documents marked as drafts for lawyer review
