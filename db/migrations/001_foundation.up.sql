CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE SCHEMA catalog;
CREATE SCHEMA privacy;
CREATE SCHEMA content;
CREATE SCHEMA trust;
CREATE SCHEMA ops;

CREATE TABLE catalog.licenses (id UUID PRIMARY KEY, code TEXT NOT NULL UNIQUE, grant_text TEXT NOT NULL, source_uri TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE catalog.provenance (id UUID PRIMARY KEY, source TEXT NOT NULL CHECK (source IN ('owner','editorial','user','sandbox')), author TEXT, evidence_uri TEXT, license_id UUID NOT NULL REFERENCES catalog.licenses, observed_at TIMESTAMPTZ NOT NULL);
CREATE TABLE catalog.places (id UUID PRIMARY KEY, name TEXT NOT NULL, address TEXT NOT NULL, country CHAR(2) NOT NULL CHECK (country ~ '^[A-Z]{2}$'), timezone TEXT NOT NULL, location geography(Point,4326) NOT NULL, description_es TEXT NOT NULL, description_en TEXT NOT NULL, price_level SMALLINT CHECK (price_level BETWEEN 0 AND 4), phone TEXT, website TEXT, provenance_id UUID NOT NULL REFERENCES catalog.provenance, search_text TEXT NOT NULL, search_es TSVECTOR NOT NULL, search_en TSVECTOR NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ);
CREATE INDEX places_location_gist ON catalog.places USING GIST(location);
CREATE INDEX places_search_es_gin ON catalog.places USING GIN(search_es);
CREATE INDEX places_search_en_gin ON catalog.places USING GIN(search_en);
CREATE INDEX places_trigram_gin ON catalog.places USING GIN(search_text gin_trgm_ops);
CREATE TABLE catalog.categories (id UUID PRIMARY KEY, parent_id UUID REFERENCES catalog.categories, slug TEXT NOT NULL UNIQUE, CHECK(parent_id IS DISTINCT FROM id));
CREATE TABLE catalog.category_translations (category_id UUID NOT NULL REFERENCES catalog.categories ON DELETE CASCADE, locale TEXT NOT NULL CHECK(locale IN ('es-CR','en')), label TEXT NOT NULL, PRIMARY KEY(category_id,locale));
CREATE INDEX category_parent ON catalog.categories(parent_id);
CREATE FUNCTION catalog.no_category_cycle() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (WITH RECURSIVE ancestry AS (SELECT parent_id,id FROM catalog.categories WHERE id=NEW.parent_id UNION SELECT c.parent_id,c.id FROM catalog.categories c JOIN ancestry a ON c.id=a.parent_id) SELECT 1 FROM ancestry WHERE id=NEW.id) THEN RAISE EXCEPTION 'category cycle'; END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER category_cycle AFTER INSERT OR UPDATE ON catalog.categories DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION catalog.no_category_cycle();
CREATE TABLE catalog.cuisines (id UUID PRIMARY KEY, slug TEXT NOT NULL UNIQUE);
CREATE TABLE catalog.cuisine_translations (cuisine_id UUID NOT NULL REFERENCES catalog.cuisines ON DELETE CASCADE, locale TEXT NOT NULL CHECK(locale IN ('es-CR','en')), label TEXT NOT NULL, PRIMARY KEY(cuisine_id,locale));
CREATE TABLE catalog.features (id UUID PRIMARY KEY, slug TEXT NOT NULL UNIQUE, kind TEXT NOT NULL CHECK(kind IN ('accessibility','dietary')));
CREATE TABLE catalog.feature_translations (feature_id UUID NOT NULL REFERENCES catalog.features ON DELETE CASCADE, locale TEXT NOT NULL CHECK(locale IN ('es-CR','en')), label TEXT NOT NULL, PRIMARY KEY(feature_id,locale));
CREATE TABLE catalog.tags (id UUID PRIMARY KEY, slug TEXT NOT NULL UNIQUE);
CREATE TABLE catalog.tag_translations (tag_id UUID NOT NULL REFERENCES catalog.tags ON DELETE CASCADE, locale TEXT NOT NULL CHECK(locale IN ('es-CR','en')), label TEXT NOT NULL, PRIMARY KEY(tag_id,locale));
CREATE TABLE catalog.place_categories (place_id UUID NOT NULL REFERENCES catalog.places, category_id UUID NOT NULL REFERENCES catalog.categories, provenance_id UUID NOT NULL REFERENCES catalog.provenance, PRIMARY KEY(place_id,category_id));
CREATE TABLE catalog.place_cuisines (place_id UUID NOT NULL REFERENCES catalog.places, cuisine_id UUID NOT NULL REFERENCES catalog.cuisines, provenance_id UUID NOT NULL REFERENCES catalog.provenance, PRIMARY KEY(place_id,cuisine_id));
CREATE TABLE catalog.place_features (place_id UUID NOT NULL REFERENCES catalog.places, feature_id UUID NOT NULL REFERENCES catalog.features, value BOOLEAN, provenance_id UUID NOT NULL REFERENCES catalog.provenance, PRIMARY KEY(place_id,feature_id));
CREATE TABLE catalog.place_tags (place_id UUID NOT NULL REFERENCES catalog.places, tag_id UUID NOT NULL REFERENCES catalog.tags, provenance_id UUID NOT NULL REFERENCES catalog.provenance, PRIMARY KEY(place_id,tag_id));
CREATE TABLE catalog.price_observations (id UUID PRIMARY KEY, place_id UUID NOT NULL REFERENCES catalog.places, amount NUMERIC(18,4) NOT NULL CHECK(amount>=0), currency CHAR(3) NOT NULL CHECK(currency IN ('CRC','USD')), basis TEXT NOT NULL CHECK(basis IN ('per_person','activity','menu_item')), provenance_id UUID NOT NULL REFERENCES catalog.provenance, observed_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ, UNIQUE(place_id,currency,basis,observed_at));
CREATE TABLE catalog.opening_periods (id UUID PRIMARY KEY, place_id UUID NOT NULL REFERENCES catalog.places, weekday SMALLINT NOT NULL CHECK(weekday BETWEEN 0 AND 6), opens TIME NOT NULL, closes TIME NOT NULL, end_day_offset SMALLINT NOT NULL CHECK(end_day_offset IN (0,1)), provenance_id UUID NOT NULL REFERENCES catalog.provenance);
CREATE TABLE catalog.opening_exceptions (id UUID PRIMARY KEY, place_id UUID NOT NULL REFERENCES catalog.places, local_date DATE NOT NULL, closed BOOLEAN NOT NULL, opens TIME, closes TIME, UNIQUE(place_id,local_date));
CREATE TABLE catalog.providers (code TEXT PRIMARY KEY CHECK(code IN ('google','instagram','tiktok')));
INSERT INTO catalog.providers VALUES ('google'),('instagram'),('tiktok');
CREATE TABLE catalog.provider_policies (id UUID PRIMARY KEY, provider TEXT NOT NULL REFERENCES catalog.providers, version TEXT NOT NULL, fields TEXT[] NOT NULL, purpose TEXT NOT NULL, max_ttl_seconds INTEGER NOT NULL CHECK(max_ttl_seconds>=0), approval_reference TEXT NOT NULL, UNIQUE(provider,version,purpose));
CREATE TABLE catalog.place_sources (id UUID PRIMARY KEY, place_id UUID NOT NULL REFERENCES catalog.places, provider TEXT NOT NULL REFERENCES catalog.providers, external_id TEXT NOT NULL, last_synced TIMESTAMPTZ, UNIQUE(provider,external_id));
CREATE TABLE catalog.provider_field_cache (source_id UUID NOT NULL REFERENCES catalog.place_sources, policy_id UUID NOT NULL REFERENCES catalog.provider_policies, field TEXT NOT NULL, value JSONB NOT NULL, expires_at TIMESTAMPTZ NOT NULL, PRIMARY KEY(source_id,policy_id,field));
CREATE INDEX provider_cache_expiry ON catalog.provider_field_cache(expires_at);

CREATE TABLE privacy.users (id UUID PRIMARY KEY, oidc_issuer TEXT NOT NULL, oidc_subject TEXT NOT NULL, email_cipher BYTEA, display_name_cipher BYTEA, locale TEXT NOT NULL DEFAULT 'es-CR' CHECK(locale IN ('es-CR','en')), verified_account BOOLEAN NOT NULL DEFAULT false, age_attested_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ, erase_after TIMESTAMPTZ, UNIQUE(oidc_issuer,oidc_subject));
CREATE TABLE privacy.policy_versions (version TEXT PRIMARY KEY, text_digest TEXT NOT NULL, published_at TIMESTAMPTZ NOT NULL, draft BOOLEAN NOT NULL DEFAULT true);
INSERT INTO privacy.policy_versions VALUES ('2026-10-14','phase1-draft-consent-v1',now(),true);
CREATE TABLE privacy.consents (id UUID PRIMARY KEY, subject_hash TEXT NOT NULL, purpose TEXT NOT NULL CHECK(purpose IN ('analytics','marketing_email','google_maps','instagram_embeds','tiktok_embeds','saved_location')), decision TEXT NOT NULL CHECK(decision IN ('grant','reject','withdraw')), version TEXT NOT NULL REFERENCES privacy.policy_versions, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX consent_subject_time ON privacy.consents(subject_hash,created_at,id);
CREATE TABLE privacy.terms_acceptances (id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES privacy.users, version TEXT NOT NULL REFERENCES privacy.policy_versions, accepted_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE privacy.saved_places (user_id UUID NOT NULL REFERENCES privacy.users ON DELETE CASCADE, place_id UUID NOT NULL REFERENCES catalog.places, saved_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(user_id,place_id));
CREATE TABLE privacy.filter_presets (id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES privacy.users ON DELETE CASCADE, name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80), filters JSONB NOT NULL CHECK(jsonb_typeof(filters)='object'), location_cipher BYTEA, location_consent_event_id UUID REFERENCES privacy.consents, version INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id,name), CHECK(location_cipher IS NULL OR location_consent_event_id IS NOT NULL));
CREATE INDEX presets_owner_keyset ON privacy.filter_presets(user_id,created_at,id);
CREATE TABLE privacy.provider_connections (id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES privacy.users ON DELETE CASCADE, provider TEXT NOT NULL REFERENCES catalog.providers, scopes TEXT[] NOT NULL, token_cipher BYTEA NOT NULL, expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, UNIQUE(user_id,provider));
CREATE TABLE privacy.data_subject_requests (id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES privacy.users ON DELETE CASCADE, kind TEXT NOT NULL CHECK(kind IN ('access','export','rectification','erasure','restriction','objection')), details_cipher BYTEA, status TEXT NOT NULL CHECK(status IN ('verification_required','pending','processing','completed','rejected')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), deadline_at TIMESTAMPTZ, completed_at TIMESTAMPTZ);
CREATE TABLE privacy.dsr_tasks (id UUID PRIMARY KEY, request_id UUID NOT NULL REFERENCES privacy.data_subject_requests ON DELETE CASCADE, processor TEXT NOT NULL, state TEXT NOT NULL, expires_at TIMESTAMPTZ, UNIQUE(request_id,processor));
CREATE TABLE privacy.bff_sessions (id_hash TEXT PRIMARY KEY, state_cipher BYTEA NOT NULL, expires_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX sessions_expiry ON privacy.bff_sessions(expires_at);
CREATE TABLE privacy.erasure_tombstones (subject_hash TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL);

CREATE TABLE content.opinions (id UUID PRIMARY KEY, place_id UUID NOT NULL REFERENCES catalog.places, source_id UUID REFERENCES catalog.place_sources, rating NUMERIC(2,1) CHECK(rating BETWEEN 0 AND 5), source_uri TEXT, provenance_id UUID NOT NULL REFERENCES catalog.provenance, published_at TIMESTAMPTZ);
CREATE TABLE content.user_opinions (opinion_id UUID PRIMARY KEY REFERENCES content.opinions ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES privacy.users, text TEXT NOT NULL CHECK(length(text)<=5000), verified_account_at TIMESTAMPTZ NOT NULL, incentive_disclosure TEXT, license_id UUID NOT NULL REFERENCES catalog.licenses, state TEXT NOT NULL CHECK(state IN ('pending','published','flagged','removed')), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE content.media (id UUID PRIMARY KEY, place_id UUID NOT NULL REFERENCES catalog.places, user_id UUID REFERENCES privacy.users, source_id UUID REFERENCES catalog.place_sources, license_id UUID NOT NULL REFERENCES catalog.licenses, storage_key TEXT UNIQUE, source_uri TEXT, author TEXT, source_date TIMESTAMPTZ, attribution TEXT NOT NULL, alt_text TEXT NOT NULL CHECK(length(alt_text)>0), mime TEXT NOT NULL, size_bytes BIGINT NOT NULL CHECK(size_bytes BETWEEN 1 AND 10485760), state TEXT NOT NULL CHECK(state IN ('quarantined','scanning','rejected','published','removed')), malware_scanned_at TIMESTAMPTZ, metadata_stripped_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(state<>'published' OR (malware_scanned_at IS NOT NULL AND metadata_stripped_at IS NOT NULL)));
CREATE TABLE trust.moderation_flags (id UUID PRIMARY KEY, opinion_id UUID REFERENCES content.opinions, media_id UUID REFERENCES content.media, reason TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('open','reviewing','resolved')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(num_nonnulls(opinion_id,media_id)=1));
CREATE INDEX moderation_state_time ON trust.moderation_flags(state,created_at,id);
CREATE TABLE trust.moderation_decisions (id UUID PRIMARY KEY, flag_id UUID NOT NULL REFERENCES trust.moderation_flags, actor_id UUID NOT NULL REFERENCES privacy.users, action TEXT NOT NULL, reason TEXT NOT NULL, policy_version TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE trust.reports (id UUID PRIMARY KEY, subject_hash TEXT NOT NULL, target_kind TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL, details_cipher BYTEA NOT NULL, contact_cipher BYTEA, state TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE trust.appeals (id UUID PRIMARY KEY, report_id UUID NOT NULL REFERENCES trust.reports, subject_hash TEXT NOT NULL, reason_cipher BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE ops.audit_log (id UUID PRIMARY KEY, actor_hash TEXT NOT NULL, action TEXT NOT NULL, target_id TEXT, correlation_id UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE ops.idempotency_records (scope_hash TEXT NOT NULL, route TEXT NOT NULL, key_hash TEXT NOT NULL, body_hash TEXT NOT NULL, response JSONB NOT NULL, expires_at TIMESTAMPTZ NOT NULL, PRIMARY KEY(scope_hash,route,key_hash));
CREATE TABLE ops.outbox (id UUID PRIMARY KEY, kind TEXT NOT NULL, reference_id UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), delivered_at TIMESTAMPTZ, attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0));
CREATE INDEX outbox_pending ON ops.outbox(created_at) WHERE delivered_at IS NULL;
CREATE TABLE ops.job_receipts (event_id UUID NOT NULL REFERENCES ops.outbox, consumer TEXT NOT NULL, completed_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(event_id,consumer));
CREATE TABLE ops.search_logs (day DATE NOT NULL, locale TEXT NOT NULL, latency_bucket SMALLINT NOT NULL, event_count BIGINT NOT NULL CHECK(event_count>=0), PRIMARY KEY(day,locale,latency_bucket));
CREATE TABLE ops.configuration (key TEXT PRIMARY KEY, value JSONB NOT NULL, version INTEGER NOT NULL DEFAULT 1);
INSERT INTO ops.configuration VALUES ('search','{"default_radius_km":5,"max_radius_km":50,"max_candidates":200,"max_page_size":50}',1);

ALTER TABLE privacy.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy.users FORCE ROW LEVEL SECURITY;
CREATE POLICY user_identity ON privacy.users USING(oidc_issuer=current_setting('app.issuer',true) AND oidc_subject=current_setting('app.subject',true)) WITH CHECK(oidc_issuer=current_setting('app.issuer',true) AND oidc_subject=current_setting('app.subject',true));
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['saved_places','filter_presets','terms_acceptances','provider_connections','data_subject_requests'] LOOP
    EXECUTE format('ALTER TABLE privacy.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE privacy.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY own_record ON privacy.%I USING(user_id::text=current_setting(''app.user_id'',true)) WITH CHECK(user_id::text=current_setting(''app.user_id'',true))',t);
  END LOOP;
END $$;
ALTER TABLE privacy.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy.consents FORCE ROW LEVEL SECURITY;
CREATE POLICY own_consent ON privacy.consents USING(subject_hash=current_setting('app.proof',true)) WITH CHECK(subject_hash=current_setting('app.proof',true));
