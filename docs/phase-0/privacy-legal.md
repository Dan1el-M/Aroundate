# Privacy, legal review and policy specification

**DRAFT — FOR QUALIFIED LAWYER REVIEW.** This document defines proposed product controls and templates, not final legal advice or a completed jurisdiction assessment. Controller identity/contact and business details are unknown and must not be fabricated.

## Inventory and proposed retention

| Data/purpose | Basis to confirm | Location/recipients | Proposed retention and deletion |
| --- | --- | --- | --- |
| Search query/coordinate | User-requested service; browser permission and clear notice for geolocation | Request memory, minimal disclosed provider request | Request lifetime only; not saved or logged by default; no analytics query text. |
| Saved location/preset/places | Account service plus explicit save-location action for coordinates | Personal DB schema, backups | Until user removes or account deletion; encrypted saved exact location; never automatically saved. |
| Email/OIDC subject/account display name | Account service, counsel to confirm lawful basis | PII schema and identity processor | Active account; soft delete immediate on confirmed erasure, target primary hard deletion <=30 days unless valid legal exception. |
| Consent/rejection/withdrawal proof | Compliance accountability, confirm basis | Restricted privacy schema | Proposed 3 years after final event; anonymous proof not used for tracking; shorter period if legally required. |
| User opinions/licensed images | Service, content license/terms; separate from marketing consent | Content DB, private objects/CDN, moderation | Until deletion/takedown/account erasure; any lawful evidence hold is narrow, documented and access-restricted. |
| Provider author/date/source content | Provider license/terms and legal rights | Request-time UI, approved cache only | Field-specific policy expiry; no default durable social/Google payload. |
| Operational logs/security events | Security necessity, counsel review | Redacted log sink, limited authorized operators | Operational logs 14 days; minimal security/audit metadata 180 days; incidents may require documented hold. |
| Anonymous analytics | Optional granular opt-in where required; honor GPC/DNT globally | Self-hosted analytics, no cross-site identifiers | Raw anonymized events max 7 days, aggregate counts 90 days; no session replay by default. |
| Provider tokens | Owner authorization | Encrypted secret references, API only | Revoke/delete when disconnected/account erased; bounded refresh-token expiry. |
| DSR verification/export | Rights handling, necessity | Privacy service, relevant processors | Export download expires 24h; verification evidence deleted within 30 days after completion; minimal request ledger proposed 3 years subject to counsel. |
| Encrypted immutable backups | Recovery need under bounded retention | Isolated backup vault | Proposed 35 days rolling; erasure tracked to expiry. Restore replays deletion before service opens. |
| Idempotency/replay records | Safety/security, minimum metadata | Restricted DB/Redis | Idempotency 24h; webhook replay 24h unless provider specifies longer; no raw tokens/body. |
| Quarantine uploads | Validation | Private quarantine bucket | Max 24h if rejected/abandoned; scan/log metadata follows minimal security retention. |

Periods are proposals, not legal entitlements. Automated TTL/erase jobs produce non-sensitive proof and alerts; expired records cannot be served while cleanup waits. No personal data in development, tests, fixtures or screenshots. Fields indicating sexual orientation, relationship status or behavioral dating profiles are not collected.

## Consent model and collection-point notices

Purpose vocabulary: analytics, marketing email, Google map resources, Instagram embeds, TikTok embeds, optional saved location. Browser geolocation authorization is separate and request-specific; cookie consent does not grant location permission. Search disclosure explains required minimal provider lookup and international transfer before the user submits. If counsel determines separate consent is needed for a provider search, enforce that gate too; native sandbox/catalog remains usable.

State machine: unknown/expired -> reject or grant -> withdrawn or expired; policy version change affecting purpose returns to unknown. Grant events require affirmative unticked choices, current text version, timestamp and proof ID; terms acceptance is its own click-wrap event. Unknown is denied. Rejection is persistent and just as easy as acceptance. No preselected marketing, bundled Terms consent, confirmshaming, fabricated scarcity or disguised buttons. Every collection point links a short privacy notice and full policy.

Browser storage uses only necessary session/CSRF/preference/consent-proof entries before opt-in; no third-party code/network/resource loads. Strictly necessary consent preference is a signed expiring first-party token with no cross-site ID. Re-ask proposed every 180 days or material purpose/version change. Reject all and accept all equal size/visual weight, granular settings and permanent “Change privacy choices” footer link. Withdrawal records event, unloads/blocks resources and cancels queued analytics; it cannot undo already disclosed transfers.

GPC or DNT on initial request disables analytics/marketing and opt-out-of-sale/sharing behavior where applicable; this launch has no sale/sharing for ads. Do not override these signals with an “Accept all” for analytics/marketing. Functional map/social consent remains distinct. Marketing remains feature-flagged off until double opt-in, proof, suppression list, one-click unsubscribe and SPF/DKIM/DMARC are verified. Revoking consent is not account deletion.

## Policy pages to implement in Phase 1

All initial texts marked draft until approved; Spanish and English are consistent translations with version history. Footer and collection points link to Privacy, Cookies, Terms, Refunds, Accessibility, Business information, Contact and Report abuse/takedown. A no-paid-features Refunds page can explain no purchases while keeping the paid template inactive; never expose invented purchase conditions as current.

| Page | Required sections |
| --- | --- |
| Privacy | Actual controller/contact; data/purposes/bases; recipients/processors and transfer safeguards; retention; all access/rectification/erasure/restriction/portability/objection/withdrawal rights; PRODHAB/EU complaint route as applicable; disclosed user-controlled ranking/profiling; children/age policy; request mechanism; version/date/change history. |
| Cookies | Audit-generated table of exact name/provider/purpose/duration/category, necessary-storage basis, granular change link and external resource explanation. Document localStorage too; do not fabricate a final cookie inventory before runtime audit. |
| Terms | Actual parties/service; official third-party coverage/accuracy; acceptable use/moderation; content license and attribution; IP; legally valid liability limits; termination; governing law/jurisdiction/disputes; change notice; age policy; click-wrap and version history. |
| Business information | Actual legal name, tax/registration number, address, email, telephone, relevant registrations; release blocker until supplied and verified. |
| Refunds/cancellation | Feature-flagged paid template: tax/fee-inclusive totals, cancellation as easy as purchase, statutory rights, windows, refund method, renewals/reminders and processor handling. Counsel review before checkout exists. |
| Accessibility | Target WCAG 2.2 AA, scope, evaluation date/method, tested status, known provider limitations, alternative list/transcript and actual feedback contact. Do not claim conformance before evidence. |
| Contact / takedown | Actual support/abuse route, minimum rights/report evidence, acknowledgment/deadlines, appeal process and privacy notice; no identity-document upload by default. |

License/content grant records differ from consent. Photo grant specifies uploader rights and permission scope; API content follows API license, not a blanket user license. Optional AI content must be labeled and source-grounded, never fabricated quotations. Claims register starts with no unsupported “best”, “secure”, “guaranteed”, “unlimited” or “most accurate” claims. Every future claim needs owner, wording, evidence, expiry and review.

## Rights workflow

Create request -> recent step-up or proportionate alternative verification -> jurisdiction/deadline assignment -> discovery of primary/identity/object/provider holdings -> execution -> processor acknowledgment -> export or reasoned decision -> verification -> closure -> backup-expiry follow-up. Never accept client-supplied target user. Exports are structured JSON and licensed content references; do not export other reviewers' private data. Rectification accepts allowed fields only. Deletion asks for accessible confirmation and revokes sessions immediately after authorization; verification methods avoid demanding unnecessary government IDs. A user cannot delete all external Google/Instagram/TikTok content by deleting an Aroundate account; removal of Aroundate associations and provider rights/report links are clearly differentiated.

Legal response deadline configuration requires counsel-approved jurisdiction rules, extensions/notification logic and reminders. Do not assume all countries have one deadline. Backup deletion is bounded expiry plus tombstone replay, not an impossible assertion that immutable backups are instantly rewritten. A narrow lawful exception/hold records reason and review date; erasure never leaves a fully recoverable account indefinitely.

## DPIA and records-of-processing templates

DPIA entry fields: operation/version/owner; intended purposes and lawful bases; data categories/subjects including minors; sources/recipients/transfers; necessity/proportionality and alternatives; data flows/retention; LINDDUN harms/severity/likelihood; safeguards; consultation with affected users; residual risks and approval/escalation; review triggers and next date. Assess precise saved location and third-party embed transfers before enabling them. Consider whether authority consultation or a DPO is required rather than asserting either universally.

ROPA entry fields: controller/processor roles and contact, purpose, legal basis, subjects/data categories, recipients, country and transfer mechanism, retention, security measures, DPA, subprocessors, consent/rights mechanism, owner, evidence and last review. Vendor register fields: official service, license/version, scopes/field sharing, region/subprocessors, DPA status, deletion/revocation support, SCC/other safeguards where applicable, rotation owner and review date. No DPA or transfer mechanism is marked executed.

## Jurisdiction mapping for counsel

| Baseline/module | Product mapping and unresolved review |
| --- | --- |
| Costa Rica Law 8968 / PRODHAB | Data rights, informed processing, safety/confidentiality and applicable registration/transfer rules; verify current consolidated law/regulation and exact breach notice obligations. Never import GDPR 72h as a Costa Rican deadline. |
| Costa Rica Law 7472 | Counsel to assess consumer disclosures, unfair terms and paid cancellation/refund rights; no paid features proposed initially. |
| Costa Rica Law 7600 | Accessible flows and statement; counsel assesses applicability alongside WCAG evidence. |
| Costa Rica Law 9048 | Security/abuse handling and incident evidence; counsel assesses offenses/notice interaction. |
| Costa Rica Law 8454 | Electronic records/acceptance evidence; do not equate ordinary click-wrap automatically with a certified digital signature. |
| EU GDPR/ePrivacy | Counsel evaluates territorial scope, bases, rights deadlines, cookies, transfers/DPA and incident Article 33 workflow when applicable; DPIA and privacy controls remain enabled by default. |
| EU DSA / European Accessibility Act | Assess service classification, intermediary/content notice/appeal duties, scope/exemptions and effective obligations; not every venue finder automatically falls under every provision. |
| US CCPA/CPRA / FTC / ADA | Assess thresholds, residents, sale/share definitions, GPC handling, endorsement/review rules and accessibility exposure. No claim these apply identically to every launch. |

Only Law 8968's official text was inspected in this phase; other local law mappings are scope for counsel verification, not findings of completed legal compliance. ISO/IEC 27701/29100/29134 are privacy-management/design guides; legal texts and normative ISO editions require qualified review. No generated policy is approved for public production.
