"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Place, Taxon } from "../../../packages/catalog/seed";
import { api } from "../lib/client";
import { useLocale } from "../lib/i18n";
export function PlaceDetail({ id }: { id: string }) {
  const { t, locale } = useLocale();
  const [place, setPlace] = useState<Place & { open_now: boolean | null }>(),
    [tags, setTags] = useState<Taxon[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    api<Place & { open_now: boolean | null }>(`places/${id}`)
      .then(setPlace)
      .catch(() =>
        setError(
          t("Este lugar no está disponible.", "This place is unavailable."),
        ),
      );
    api<{ tags: Taxon[] }>("taxonomies")
      .then((value) => setTags(value.tags))
      .catch(() => {});
  }, [id]);
  return (
    <main id="main" className="content-page">
      <Link className="back-link" href="/">
        ← {t("Volver a explorar", "Back to explore")}
      </Link>
      {error ? (
        <p role="alert">{error}</p>
      ) : !place ? (
        <p role="status">{t("Cargando lugar…", "Loading place…")}</p>
      ) : (
        <>
          <div className="detail-banner">
            <span className="eyebrow">
              {t(
                "Lugar ficticio · datos de demostración",
                "Fictional place · demo data",
              )}
            </span>
            <h1>{place.name}</h1>
            <p>{place.address}</p>
            <p>
              {locale === "en" ? place.description.en : place.description.es}
            </p>
            <button
              className="button"
              onClick={async () => {
                try {
                  await api(`me/saved-places/${id}`, { method: "PUT" });
                  setNotice(
                    t(
                      "Guardado en tus planes demo.",
                      "Saved to your demo plans.",
                    ),
                  );
                } catch {
                  setNotice(
                    t(
                      "Primero inicia una cuenta demo en Mis planes.",
                      "Start a demo account in My plans first.",
                    ),
                  );
                }
              }}
            >
              {t("Guardar para después", "Save for later")} ♡
            </button>
            <p role="status">{notice}</p>
          </div>
          <div className="detail-columns">
            <section>
              <h2>{t("Antes de ir", "Before you go")}</h2>
              <dl className="detail-facts">
                <div>
                  <dt>
                    {t(
                      "Precio ilustrativo por persona",
                      "Illustrative per-person price",
                    )}
                  </dt>
                  <dd>
                    {place.prices.CRC === undefined
                      ? t("No disponible", "Unavailable")
                      : new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: "CRC",
                          maximumFractionDigits: 0,
                        }).format(place.prices.CRC)}
                  </dd>
                </div>
                <div>
                  <dt>
                    {t("Horario diario de ejemplo", "Illustrative daily hours")}
                  </dt>
                  <dd>
                    {place.hours
                      ? `${place.hours.start}:00 – ${place.hours.end}:00`
                      : t("Desconocido", "Unknown")}{" "}
                    ·{" "}
                    {place.open_now === null
                      ? t(
                          "No se puede confirmar apertura",
                          "Open state unknown",
                        )
                      : place.open_now
                        ? t("Abierto ahora", "Open now")
                        : t("Cerrado ahora", "Closed now")}
                  </dd>
                </div>
                <div>
                  <dt>{t("Ubicación ilustrativa", "Illustrative location")}</dt>
                  <dd>
                    {place.latitude}, {place.longitude} · America/Costa_Rica
                  </dd>
                </div>
                <div>
                  <dt>{t("Teléfono y sitio web", "Phone and website")}</dt>
                  <dd>
                    {t(
                      "No disponibles para un lugar ficticio.",
                      "Unavailable for a fictional place.",
                    )}
                  </dd>
                </div>
              </dl>
              <h2>{t("Ambiente y evidencia", "Atmosphere and evidence")}</h2>
              <div className="tag-row">
                {tags
                  .filter((tag) => place.tags.includes(tag.id))
                  .map((tag) => (
                    <span className="pill" key={tag.id}>
                      {locale === "en" ? tag.en : tag.es}
                    </span>
                  ))}
              </div>
              <p className="fine-print">
                {t(
                  "Etiquetas editoriales de la semilla ficticia; no se derivan de fotos ni reseñas externas.",
                  "Editorial tags from fictional fixtures; not inferred from photos or external reviews.",
                )}
              </p>
            </section>
            <section className="detail-map">
              <span aria-hidden="true">⌖</span>
              <h2>
                {t("Elige si cargas un mapa", "Choose whether to load a map")}
              </h2>
              <p>
                {t(
                  "El mapa de Google está desactivado en la demo. La dirección y las coordenadas son la alternativa textual.",
                  "The Google map is disabled in this demo. Address and coordinates provide the text alternative.",
                )}
              </p>
              <button
                className="button button-outline"
                onClick={() =>
                  window.dispatchEvent(new Event("privacy-settings"))
                }
              >
                {t(
                  "Ver preferencias de privacidad",
                  "View privacy preferences",
                )}
              </button>
            </section>
          </div>
          <section className="account-section">
            <h2>{t("Opiniones por fuente", "Opinions by source")}</h2>
            <div className="source-grid">
              <div>
                <h3>Aroundate sandbox</h3>
                <p>
                  {place.rating === null
                    ? t("Sin puntuación disponible", "No rating available")
                    : `${place.rating}/5 · ${place.reviews} ${t("opiniones ficticias", "fictional opinions")}`}
                </p>
                <p>
                  {t(
                    "Puntuación de fixture: no corresponde a personas reales. No hay textos de reseñas inventados como citas.",
                    "Fixture rating: no real people. No invented review quotes are presented.",
                  )}
                </p>
              </div>
              {["Google", "Instagram", "TikTok"].map((source) => (
                <div key={source}>
                  <h3>{source}</h3>
                  <p>
                    {t(
                      "Integración desactivada. No hay contenido de esta fuente.",
                      "Integration disabled. No content from this source.",
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="account-section">
            <h2>{t("Fotos y contenido", "Photos and content")}</h2>
            <p>
              {t(
                "No hay fotos licenciadas cargadas. Las ilustraciones del catálogo son decorativas y creadas con CSS.",
                "No licensed photos have been loaded. Catalog illustrations are decorative CSS artwork.",
              )}
            </p>
            <Link href={`/report?target_id=${id}`}>
              {t(
                "Reportar información o contenido",
                "Report information or content",
              )}
            </Link>
          </section>
        </>
      )}
    </main>
  );
}
