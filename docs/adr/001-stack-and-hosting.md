# ADR 001 — Stack and hosting

Status: Proposed. Date: 2026-10-14.

Context: A mobile-first bilingual web product needs a reusable API, geospatial queries, complex privacy controls and container deployment. No code or hosting already exists.

Decision: TypeScript/Next.js web+BFF, NestJS modular API, worker, PostgreSQL/PostGIS, Redis and private S3-compatible objects. Compose locally; managed containers in production, cloud/region to confirm. Strict domain independence and raw parameterized SQL where geospatial features make generic ORM abstractions awkward. SQL migrations are reviewed and reversible.

Alternatives: FastAPI adds a second application language without a stated Python requirement. Serverless Sites/Workers would require HTTP DB access and deployment changes. Kubernetes is unnecessary until operations/scale justify it. These are viable alternatives for owner consideration, not inherently inferior products.

Consequences: Shared contracts and domain logic reduce duplication. OIDC, PostGIS and workers add operating costs; managed services and staffed incident response are release prerequisites. Exact package versions, licenses and image digests must be verified/pinned during Phase 1, not invented in a design document.
