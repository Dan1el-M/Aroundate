# Contributing to Aroundate

Phase 0 was approved on 2026-10-14 and development is active. The local Git repository is initialized; remote branch-protection/review/signing enforcement has not been configured. Run `npm run check`, `npm run format:check`, `npm run build` and affected browser tests before review.

Use conventional commits and signed commits; open a pull request reviewed by another accountable maintainer. Protected main must enforce required checks/review, prevent force-push and require signed history where supported. Never commit secrets, API responses with personal data, exact user locations, provider payloads without storage permission or real user fixtures. Use fictional sandbox data and placeholders.

Keep domain logic framework-independent, strict TypeScript, small clear interfaces and explicit assumptions/ADRs. Every dependency needs purpose, verified license, pinned version/lockfile, current maintenance/security review and removal plan. Parameterize SQL; follow default-deny authorization and consent; source content requires licensed provenance and attribution.

Changes need appropriate existing checks, meaningful regression coverage for business/security behavior and matrix evidence. Ranking and consent require 100% statements/branches; overall domain >=80%. Do not simulate legal/usability/restore/production evidence. Record unresolved gaps as Partial with owner and next step.

Security reports use the future reviewed security.txt/disclosure contact, not public issues with exploit personal data. Until a real contact is provided, no fabricated email endpoint is published. Review policy/terms changes with counsel, integration changes against official provider terms and accessibility changes using keyboard/AT tests.
