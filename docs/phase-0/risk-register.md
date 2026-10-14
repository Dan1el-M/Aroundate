# Risk register

Proposed initial risk scores: likelihood and impact 1–5, product >=15 critical, 8–14 high, 4–7 medium, <=3 low. Scores are planning judgments. Owners are roles to be assigned, not invented people. Residual acceptance requires named accountable owner and evidence.

| ID | Risk | L × I | Mitigation and verification | Owner | Release state |
| --- | --- | --- | --- | --- | --- |
| R01 | Provider data warehousing/custom ranking violates terms | 4×5=20 | Field/purpose deny-default policy, no scraping, billing-region terms review; lawyer/provider clarification on permitted derivations | Legal + integrations | Blocks affected live provider feature |
| R02 | Instagram/TikTok permissions cannot supply arbitrary place content | 5×4=20 | Owner-authorized content/reviewed embeds, honest source gaps; app access tests, no substitute unofficial API | Product + integrations | Confirm limited-coverage assumption; app approvals before live |
| R03 | Precise location/date discovery reveals sensitive life patterns | 4×5=20 | Request-only location, separate save/share action, no query logs, privacy test/DPIA | Privacy + security | Blocks release without network/log audit |
| R04 | BOLA exposes presets/reviews/DSR/export | 3×5=15 | Owner-scoped application queries+RLS+two-account tests; short export links and recent step-up | API security | Blocks release if any negative auth test fails |
| R05 | Upload malware/polyglot/EXIF disclosure | 3×5=15 | Quarantine scan decode strip re-encode; failure stays unpublished | Content security | Blocks uploads if pipeline unproven |
| R06 | Vendor CSP/SRI/isolation conflicts lead to blanket weakening | 4×4=16 | Consent, per-route policy and explicit approved exceptions; compatibility tests | Web security | Pending owner/security decision before affected route |
| R07 | Fake-review heuristic suppresses valid criticism | 3×4=12 | Human moderation, source-specific evidence, bias review, appeal and no sentiment filtering | Trust lead | Blocks reviews without policy/moderation capacity |
| R08 | Ranking unfair/unstable under unknowns, FX or provider changes | 3×4=12 | Frozen facts, fixed-point total order, explanations, cursor restart, golden/property tests | Domain lead | Ranking 100% coverage and reviewed vectors required |
| R09 | “ISO compliant”/“secure” claims lack proof | 4×4=16 | Claims register, controls/evidence matrix, organizational audits; no certification statement | Product + compliance | Block unsupported marketing claims |
| R10 | Controller/contact, legal deadlines and age policy unconfirmed | 4×5=20 | Counsel-reviewed CR/EU/US applicability; imprint placeholders cannot publish | Legal + owner | Public release blocker |
| R11 | Immutable backup restores erased users | 3×5=15 | Expiry policy, minimal tombstones, isolated restore+erasure replay, processor reconciliation | Operations + privacy | Successful restore/deletion rehearsal required |
| R12 | Provider quota/cost abuse or outage | 4×4=16 | Bounded searches/fields/retries, distributed spend cap, bulkhead, graceful fallback | Operations + integrations | Load/cost/failure tests required |
| R13 | Identity setup lacks promised password/MFA features | 3×5=15 | Verified IdP settings/extensions, WebAuthn/TOTP/recovery/reset tests, deny launch if gap | Identity + security | Production login blocker |
| R14 | Supply-chain compromise or unavailable patching | 3×5=15 | Lockfiles/digests, SBOM/SCA/secret/SAST, signed artifacts, restricted CI identity, vulnerability SLAs | DevSecOps | CI gate and ownership evidence required |
| R15 | External players inaccessible or transfer before opt-in | 4×4=16 | Local placeholders, no remote thumbnails/preconnect, captions/transcript alternative, network tests | Accessibility + privacy | Affected embeds remain disabled if gap |
| R16 | Traffic, budget, cloud and on-call capacity unknown | 4×4=16 | Confirm infra and workload assumptions, measured sizing/SLIs/runbooks | Owner + operations | Production deployment blocker |
| R17 | TTL/index/audit retention undermines performance or privacy | 3×4=12 | EXPLAIN synthetic load, expiry job monitoring, retention verification and encrypted access | Data + privacy | Phase 4 gates required |
| R18 | Counsel/vendor/real-user audits unavailable despite full delivery request | 4×4=16 | Track external evidence separately; no simulated audit or usability participants | Owner + QA | Release remains Partial until external evidence exists |

No risk is marked accepted. Review at phase gates, provider terms changes, incidents and feature activations; link each finding to a matrix row, owner, due date and verification artifact. Unknown critical risks cannot be signed off by a generated document.
