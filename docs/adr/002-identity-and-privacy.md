# ADR 002 — Identity and privacy

Status: Proposed. Date: 2026-10-14.

Decision: Delegate identity to a maintained OIDC provider that supports email registration, WebAuthn, TOTP, Argon2id and blocklist checks. Use code+PKCE, strict iss/aud/exp/nbf/alg validation and server-managed browser sessions; mobile obtains its own scoped tokens. Anonymous search is available. Require verified-account status for first-party reviews and recent step-up for export/deletion/security changes.

Persist only purpose-specific consent and necessary user-owned records. Location remains request-only unless deliberately saved. Unknown/expired/withdrawn consent blocks third-party code. GPC/DNT disables analytics/marketing; maps/social remain separately controlled by explicit action.

Alternatives: An application-owned password stack increases security responsibility. Browser localStorage access/refresh tokens increase XSS impact. Forced login for discovery violates anonymous use.

Consequences: Identity processor deletion and backup retention enter the DSR workflow. Provider configuration and extension readiness for breached-password checks must be proven; choosing Keycloak-compatible identity is not evidence that defaults satisfy every requirement. Proposed session limits: 30-minute idle, 12-hour absolute; API access tokens at most 5 minutes; admin MFA required.
