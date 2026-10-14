# Ranking specification v1

Status: Proposed contract; no ranking implementation or runtime tests yet. Algorithm identifier `aroundate-rank-v1`. Both strategies return an explainable total order for the **same validated, frozen candidate snapshot**.

## Search semantics before ranking

Normalize text with Unicode NFKD, lowercase and accent removal for lookup only; preserve original display/review text. Spanish and English catalog vectors plus pg_trgm provide accent-insensitive search, typo tolerance and suggestions. Provider text goes through the official autocomplete/search path, not a local copied index. Text relevance is for candidate admission, never an undisclosed ranking criterion.

Within category and cuisine selection, match ANY selected entry; across filter families apply AND. A selected parent category includes its descendants with cycle-safe traversal. Accessibility/dietary selection matches ALL requested features. Evidence must be true/verified; unknown is not a match. Cuisine `type_match` can distinguish one versus multiple requested cuisine matches after ANY admission. Date tags are filters backed by source/editorial/user evidence, not generated romantic stereotypes.

Price levels use provider-documented ordinal meanings 0–4; per-person amounts need amount, currency, offering basis, source and observation date. Min/max and level selections, if both present, both apply. Amount conversion uses one frozen approved FX rate set, labeled date and estimated basis. Unknown amount/FX cannot satisfy an active amount filter. Absent amount filter: normalized price uses ordinal level only for cross-source comparability; do not rank mixed menu-item prices as comparable spend. Clamp roundoff, never silently accept invalid money. All monetary input is a decimal string, not binary float.

Radius is great-circle distance, not driving time. Use PostGIS geography `ST_DWithin` for licensed catalog filtering and the documented haversine algorithm for request-time ranking/fixtures: mean Earth radius 6371.0088 km; radians; `a = sin²(Δφ/2) + cos φ1 cos φ2 sin²(Δλ/2)` clamped to [0,1]; `d = 2R atan2(sqrt(a),sqrt(1-a))`. Validate latitude [-90,90] and longitude [-180,180]. Exact antimeridian and pole cases must work. Admission uses unrounded distance; sort quantizes to millimeters; UI formats km. Geolocation accuracy is disclosed rather than treated as a precision guarantee.

Open-now is three-state `true/false/unknown`, evaluated at a fixed UTC `evaluated_at` using place IANA timezone and exceptional/overnight opening periods. Active filter requires true. Closed/unknown omitted only because the requested filter cannot be satisfied, never hidden as poor reviews. Sources that cannot supply a requested feature are disclosed in coverage warnings.

Rating filter/ranking uses explicitly selected `rating_source` (`google` default or `aroundate`), a 0–5 scale and sample size. No cross-provider rating aggregate at launch. Native per-source average is arithmetic `sum(published eligible ratings)/count`; show count and verification method. Social popularity is not a rating. Source reviews are never reordered or suppressed to inflate reputation.

## Priority and weights

Vocabulary: `price`, `distance`, `rating`, `type_match`, `popularity`. UI labels are localized, not database cuisine/category constants. Default full order: price, distance, type_match, rating, popularity. Request `priority` has 1–5 unique allowed entries. Append omitted entries in default order. Reject duplicates, unknowns, NaN/Infinity and out-of-range values with 422. This appending rule is visible in UI and contract. Reorder uses drag-and-drop plus Move up/Move down buttons, position announcements and stable focus; dragging is never required.

Let full priority have m=5 entries. Raw rank-order weight at position j (one-based) is `m-j+1`. Sum=15; weight is `raw/15`. The first entry thus has 5/15, second 4/15 and so on. This is a weighted tradeoff strategy: priority does not guarantee dominance. Lexicographic does guarantee dominance in the specified comparison keys.

## Normalization and missing values

Normalize with frozen query/config bounds, **not candidate min/max**; inserting an outlier does not alter every other score. Utilities are in [0,1]; larger is better.

| Criterion | Utility and recorded facts |
| --- | --- |
| Price with active spend basis | `1 - clamp((converted_amount - min)/(max-min),0,1)`; use configured floor 0 and budget cap if only one bound exists; zero-width equal bound gives 1 for admitted equal prices. |
| Price without comparable spend basis | `1 - level/4`; null level is unknown. Do not infer level from a single menu item. |
| Distance | `1 - clamp(distance_km/radius_km,0,1)`; radius >0; unknown coordinate is unknown. |
| Rating | `rating/5`, selected source only; no votes means unknown rather than rating zero. |
| Type match | Fraction of selected cuisine IDs matched, else fraction of selected top-level category branches matched, else constant 1; unknown tagging when a type preference exists gives unknown. |
| Popularity | `min(log1p(verified native visit count)/log1p(popularity_cap),1)` with initial cap 1000; absent reliable verified visit counts is unknown. No external likes/review counts mixed into this metric. |

Unknown utilities become 0 for scoring; weights are not redistributed. A known genuine zero also scores 0 but is distinguishable in lexicographic keys and completeness tie-breaks. Invalid negative count/rating, invalid coordinates or inconsistent price bounds are rejected/quarantined, not upgraded to unknown to evade validation. Unknown cost is never treated as free. With no verified visits at launch, popularity remains disclosed unknown; all candidates receive the same zero contribution.

Quantize every utility to integer `U = floor(u * 1_000_000 + 0.5)`. Use integer arithmetic for weighted sum `W = Σ raw_weight * U`; denominator 15_000_000 is constant. Specify correctly rounded `log1p`/decimal conversion behavior and pin normalization runtime/fixtures; cross-runtime implementations must produce the same quantized values. Displayed percentages/score are rounded after ordering. Sort IDs by UUID bytes, not locale-dependent collation. Test vectors are language-neutral fixtures.

## Strategies and tie-breakers

**Lexicographic:** For each full priority criterion compare `(known_flag descending, U descending)`. Thus a known zero beats unknown before moving to the next criterion. Compare subsequent criteria only when both components tie. Final tie-breaker ascending immutable public UUID. All five entries are considered; no hidden vendor/provider/name boost.

**Weighted:** Compare W descending; then count of known criteria descending; then the lexicographic keys in the user's full order; finally UUID bytes ascending. Do not compare floating-point scores with an epsilon, which can violate comparator transitivity.

Organic results and any future sponsored placement are separate surfaces; sponsorship labels and rules must be reviewed before activating the feature. Eligibility cannot be bought.

## Worked vector

Scope: three fictional candidates, radius 5 km, ordinal level basis, priority price/distance/type_match/rating/popularity, type_match 1 for all, popularity unknown for all. UUID suffixes denote ascending stable IDs.

| Candidate | Price level | Distance | Rating | Utilities P,D,T,R,V | W numerator |
| --- | --- | --- | --- | --- | --- |
| A (ID ...001) | 1 | 1 km | 4.0 | .75,.8,1,.8,0 | 11,550,000 |
| B (ID ...002) | 2 | .5 km | 4.8 | .5,.9,1,.96,0 | 11,020,000 |
| C (ID ...003) | 1 | 2 km | 4.5 | .75,.6,1,.9,0 | 10,950,000 |

Lexicographic gives **A,C,B** (price first, then distance). Weighted gives **A,B,C** (A .77, B .734667, C .73). Reordering distance before price changes the stated weighting and lexicographic order. Same input in a different array order yields identical output.

## Explanations

Return strategy/version, one-based ordinal, candidate_count, candidate_scope, selected rating source, evaluated_at, full priority, raw weights, per-criterion known/value/utility/contribution/source and warnings. UI explanation templates use these facts, never a generated ungrounded sentence.

Price percentile is `100 * count(other candidates with known comparable price strictly greater than this price) / count(other candidates with known comparable price)`. Equal prices do not count as more expensive; unknowns excluded; omit percentile when denominator=0. In the worked example A is cheaper than 50% of the other two candidates, not 80%. Always state comparison scope and estimated basis. Example: “Ranked 2nd in these 3 candidates using weighted priorities; level 2 of 4, 0.5 km away; Google rating 4.8/5. Popularity unavailable.” Do not imply a weighted result is cheaper than its immediate neighbors.

Unknown explanations say which facts are unavailable and how they affected ordering. Filters disclose excluded-for-unknown counts per feature when possible without asserting exhaustive provider coverage.

## Candidate scope and cursor consistency

Deduplicate with native place UUID/provider ID mapping, never fuzzy auto-merging that can misattribute reviews. Candidate membership is bounded by 200, independent providers' official caps and discovery response; display truncation. Ranking is relative to this set, not all businesses. Provider metadata stays transient unless field policy permits storage. Own-catalog cursors include revision and fixed evaluated_at; live cursors carry permitted IDs plus a keyed digest of facts. Changed facts/membership/availability return 409 restart-required. New filters invalidate cursor. Cursor omits user coordinates; client resubmits search body each page. See API design for signing/expiry.

## Required acceptance vectors

Both strategies: empty and single sets; exact ties; all unknown; known-zero vs unknown; outliers; price=0 and max values; zero-width bounds; currency conversion and stale/missing FX; full and partial priority; duplicate/unknown priority rejected; deterministic permutation invariance, total-order transitivity and tie-breaks; input immutability; filter combinations and tag provenance; pole/antimeridian/identical/antipodal distance; DST/overnight/exceptional hours; snapshot changes and expired/tampered cursors; explanation ordinal and percentile ties/unknown denominator; no sponsorship in organic order. Target 100% statement/branch coverage for ranking, plus property tests and reviewed fixtures. These tests remain Phase 2/4 work.
