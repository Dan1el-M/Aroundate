# ADR 004 — Ranking and pagination

Status: Proposed. Date: 2026-10-14.

Decision: Filter a bounded candidate set, then use user-selected lexicographic or weighted ranking with fixed-point normalized facts and UUID tie-breaks. Explanations use the same frozen facts as comparison. Scope and truncation are visible; organic ranking never absorbs sponsorship.

Own-catalog pages use a signed query/corpus-revision/algorithm/last-key cursor and repeatable evaluation time. Mixed/live pages carry only permitted identifiers and a keyed digest of the frozen rank facts. Re-fetch facts on subsequent pages; if membership, prices, ratings, time-sensitive state or provider availability changes, return 409 restart-required instead of quietly skipping/repeating results. No prohibited provider snapshot or user coordinate is stored in a cursor/cache.

Consequences: Determinism is defined for the same input snapshot, not an unstable internet corpus. A changed live response can require a restart; UI preserves filters and explains it. A legal provider snapshot policy could permit smoother paging later, but cannot be assumed. Bounded ranking is O(n log n); the maximum candidate count is disclosed and configurable.
