# Verification evidence

Local environment: Windows, Node 24.21.0; date 2026-10-14. Fictional sandbox only. Actual checks are recorded here; no production/real-user/legal evidence is simulated.

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript app/API/tooling | Passed | `npm run typecheck`; strict configs in root/apps |
| ESLint | Passed after excluding generated build files | `npm run lint`; source lint remains enabled |
| Unit and HTTP API | 45 passing, one real-DB case skipped because Docker/PostgreSQL absent | [Tests](../../tests), [domain fixtures](../../packages/domain); `npm run test:coverage` |
| Ranking and consent core | 100% statements, branches, functions and lines for the two domain files | `coverage/coverage-summary.json`, [coverage snapshot](domain-coverage.json); normalization/application coverage is not included in this claim |
| OpenAPI 3.1 | Both design and implemented specs validated with Swagger Parser; 20 API operations match source | [Actual specification](../openapi.json), [inventory check](../../scripts/openapi-check.mjs) |
| Production build | Next.js and compiled NestJS succeeded | `npm run build`; runtime live/production gates remain closed |
| Playwright desktop and mobile | 8 passing scenarios using installed Edge; fresh browser contexts | [E2E suite](../../tests/e2e/discovery.spec.ts), local `playwright-report` |
| Automated accessibility | axe returned no violations for tagged WCAG rules in tested discovery desktop/mobile states | E2E axe assertion; not a complete/manual WCAG certification |
| Cookie/network audit | Fresh/rejected preferences loaded zero third-party requests; necessary-cookie metadata attached, session HttpOnly checked | E2E `cookie-audit.json` attachments; values are excluded from audit artifact |
| Responsive visual QA | Desktop/mobile screenshots inspected; 320px detail reflow assertion passed | [Desktop preview](preview-desktop.png), [Mobile preview](preview-mobile.png) |
| Dependency audit | Initial npm audit: zero known vulnerabilities | Locked install output; re-run audit in CI, not a permanent safety claim |
| Image/action pins | Official registry digests and GitHub tag-to-commit SHAs resolved | [Image lock](../../infra/images.lock.json), [action lock](../../infra/actions.lock.json) |
| DB/containers/IdP | **Not run locally**: Docker absent | CI test/job source prepared; no passed result claimed |
| Remote CI/scans/deploy/restore/legal/user testing | **Not executed** | Production blockers in implementation.md and risk register |

Browser checks caught a quota bug shared across users' loopback IP; it was corrected with signed purpose-session/finality buckets plus a network cap and all eight scenarios rerun successfully. Early count assertions were corrected to respect the default radius (seven of eight fixtures inside 5km). No failing result was marked passing by disabling a check.

Re-run `npm run check`, `npm run format:check`, `npm run build`, `npm run test:e2e`. Real-DB tests activate only with RUN_DB_TESTS=true and configured migration/app connections; skipping them is an explicit verification gap.
