# Official sources and verification limits

Reviewed on 2026-10-14 using web research. Links identify primary sources; docs describe proposals where provider/legal interpretation requires review. Recheck current terms and selected versions at each affected implementation/release gate.

| Source | Supported finding / how used |
| --- | --- |
| [Google Places policies](https://developers.google.com/maps/documentation/places/web-service/policies) | Provider attribution, content-storage restrictions, source links and permitted place-ID storage; not permission for a general cache/warehouse. |
| [Google Maps service-specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) | Current non-EEA rules distinguish ID/coordinate exceptions and map compatibility; billing address determines terms branch. Places coordinate caching exception is not a blanket 30-day grant for reviews/photos. |
| [Place IDs](https://developers.google.com/maps/documentation/places/web-service/place-id) | Provider identity association and ID management; durable ID does not grant durable detail storage. |
| [Geocoding policies](https://developers.google.com/maps/documentation/geocoding/policies) | Geocoding has its own attribution/storage policies; service permissions cannot be reused indiscriminately. |
| [TikTok Display API overview](https://developers.tiktok.com/docs/en/display-api-overview) and [Get started](https://developers.tiktok.com/docs/en/display-api-get-started) | Authorized user profile/video retrieval; app products/scopes plus user approval; no assumed commercial universe of place reviews. |
| [TikTok official embeds](https://developers.tiktok.com/docs/en/embed-videos) | Official embed path for public video presentation, subject to its terms and privacy/availability constraints. |
| [Meta Instagram Login docs](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/) and [oEmbed docs](https://developers.facebook.com/docs/instagram-platform/oembed/) | Research tool returned errors. **Not verified from page contents**; proposed authorization/oEmbed branch based on original brief, exact scopes/version/eligibility/retention require developer-account review. No third-party blog substitutes for official verification. |
| [OWASP ASVS project](https://github.com/owasp/asvs) | ASVS 5.0.0 published stable reference and Level 2 target; implementation will freeze control IDs and applicability. |
| [NIST SP 800-63B-4 final guidance](https://pages.nist.gov/800-63-4/sp800-63b.html) | Password length/blocklist/no-composition and authenticator/session guidance; chosen IdP configuration must prove requirements. |
| [OAuth Security BCP, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) | Secure OAuth flow baseline; verify OAuth 2.1 specification status separately at implementation. |
| [Problem Details, RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) | API error shape/media type; correlation ID is an Aroundate extension. |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Accessibility AA acceptance standard; targets and manual checks are not achieved conformance. |
| [Official Costa Rican Law 8968 text](https://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/L/2010-2019/2010-2014/2011/1153F/DCEF7.HTML) | Initial local data-protection basis; counsel must verify consolidated amendments/regulations/registration/transfer and notice duties. Other local-law mappings have not been legally verified here. |
| [EDPB breach guidance](https://www.edpb.europa.eu/sme/assess-the-risks/data-breaches_en) and [Guidelines 9/2022](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-92022-personal-data-breach-notification-under_en) | Risk-based applicable GDPR breach notification within the awareness window; not a universal Costa Rican notice rule. EUR-Lex direct retrieval returned insufficient page contents; no unverified excerpt is quoted. |
| [Redis official licenses](https://redis.io/legal/licenses/) | Version-specific Redis license review; do not assume current server is BSD. |
| [Next.js](https://nextjs.org/docs), [NestJS](https://docs.nestjs.com/), [Keycloak project](https://github.com/keycloak/keycloak), [OpenTofu](https://opentofu.org/docs/intro/) | Stack candidates and official review entry points; no selected version is asserted patched or deployed. |

No ISO standard text, legal counsel signoff, vendor approval/DPA, license audit, production penetration test, usability participant evidence or actual load/restore results were available. Track those as external evidence, not fabricated checks. Sources do not authorize use beyond their terms.
