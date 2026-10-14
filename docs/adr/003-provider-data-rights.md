# ADR 003 — Provider data rights

Status: Proposed. Date: 2026-10-14.

Decision: Own/owner/editorial licensed catalog data is durable and searchable. External data enters request-time typed facts with exact provenance and is persisted only when a versioned field-level policy authorizes it. Google place IDs may persist; general Places text/review/photo storage is denied by default. Current non-EEA terms permit limited latitude/longitude caching, but the initial conservative policy leaves it off until billing terms and purpose are approved.

Social content associates a place with an owner-authorized account or reviewed public URL. Official APIs/embeds only; no crawler, unofficial endpoint, account/password sharing or inferred star ratings. No source result means a source-status message and remaining native content.

Consequences: Google ranking/distance facts are transient. Full-text/typo indexing uses own content; live provider autocomplete supplements it. Deep social discovery and complete external review sets cannot be assumed. Owner/legal review of permitted custom ranking and derivation is a Phase 3 gate. Provider terms supersede optimization preferences; TTL is permission enforcement, not a substitute for permission.
