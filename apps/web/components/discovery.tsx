"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { CRITERIA, type Criterion } from "../../../packages/domain/ranking";
import type { Place, Taxon } from "../../../packages/catalog/seed";
import type { SearchRequest } from "../../../packages/contracts";
import { api } from "../lib/client";
import { useLocale } from "../lib/i18n";
interface Result extends Place {
  distance_km: number;
  open_now: boolean | null;
  rank: {
    ordinal: number;
    weighted_numerator: number;
    full_priority: Criterion[];
    facts: {
      criterion: Criterion;
      known: boolean;
      utility_micros: number;
      raw_weight: number;
    }[];
  };
}
interface Results {
  items: Result[];
  candidate_count: number;
  next_cursor: string | null;
}
interface Taxonomies {
  categories: Taxon[];
  cuisines: Taxon[];
  features: Taxon[];
  tags: Taxon[];
}
const labels: Record<Criterion, [string, string]> = {
  price: ["Precio", "Price"],
  distance: ["Distancia", "Distance"],
  type_match: ["Tipo de plan", "Type match"],
  rating: ["Puntuación", "Rating"],
  popularity: ["Popularidad verificada", "Verified popularity"],
};
const initial: SearchRequest = {
  q: "",
  locale: "es-CR",
  center: { kind: "city", city_id: "san-jose" },
  filters: {
    categories: [],
    cuisines: [],
    radius_km: 5,
    rating_source: "aroundate",
    open_now: false,
    accessibility: [],
    dietary: [],
    tags: [],
  },
  priority: [...CRITERIA],
  strategy: "lexicographic",
  page_size: 20,
};
function Illustration({
  tone = "sage",
  activity = false,
}: {
  tone?: string;
  activity?: boolean;
}) {
  return (
    <div className={`place-art ${tone}`} aria-hidden="true">
      <span className="art-sun" />
      <span className="art-leaf leaf-one" />
      <span className="art-leaf leaf-two" />
      <span className="art-leaf leaf-three" />
      <div className={activity ? "art-mountain" : "art-cup"}>
        <span />
      </div>
      <span className="art-line" />
    </div>
  );
}
export function Discovery() {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState<SearchRequest>(initial),
    [draft, setDraft] = useState(""),
    [taxonomies, setTaxonomies] = useState<Taxonomies>(),
    [results, setResults] = useState<Results>(),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [view, setView] = useState<"list" | "map">("list"),
    [initialized, setInitialized] = useState(false),
    [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categories = (params.get("categories") ?? "")
        .split(",")
        .filter(Boolean),
      cuisines = (params.get("cuisines") ?? "").split(",").filter(Boolean);
    const priority = (params.get("priority") ?? "")
      .split(",")
      .filter((key): key is Criterion => CRITERIA.includes(key as Criterion));
    const q = params.get("q") ?? "";
    setDraft(q);
    setQuery({
      ...initial,
      q,
      priority: priority.length ? priority : [...CRITERIA],
      strategy:
        params.get("strategy") === "weighted" ? "weighted" : "lexicographic",
      filters: {
        ...initial.filters,
        categories,
        cuisines,
        dietary: (params.get("dietary") ?? "").split(",").filter(Boolean),
        accessibility: (params.get("accessibility") ?? "")
          .split(",")
          .filter(Boolean),
        tags: (params.get("tags") ?? "").split(",").filter(Boolean),
        radius_km: Number(params.get("radius_km") ?? 5),
        open_now: params.get("open_now") === "true",
        ...(params.has("min_rating")
          ? { min_rating: Number(params.get("min_rating")) }
          : {}),
        ...(params.has("max_amount")
          ? {
              price: {
                currency: params.get("currency") === "USD" ? "USD" : "CRC",
                max_amount: params.get("max_amount")!,
              },
            }
          : {}),
      },
    });
    setInitialized(true);
    api<Taxonomies>("taxonomies")
      .then(setTaxonomies)
      .catch(() =>
        setError(
          t("No se pudieron cargar los filtros.", "Could not load filters."),
        ),
      );
    api<{ authenticated: boolean }>("bootstrap")
      .then((context) => {
        if (context.authenticated)
          api<{ items: { place_id: string }[] }>("me/saved-places")
            .then((data) => setSaved(data.items.map((item) => item.place_id)))
            .catch(() => {});
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!initialized) return;
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true);
      setError("");
      api<Results>("searches", { method: "POST", body: { ...query, locale } })
        .then((data) => {
          if (active) setResults(data);
        })
        .catch((cause) => {
          if (active)
            setError(
              cause instanceof Error
                ? cause.message
                : t("No se pudo buscar.", "Search failed."),
            );
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, locale, initialized]);
  function filters(patch: Partial<SearchRequest["filters"]>) {
    setQuery({ ...query, filters: { ...query.filters, ...patch } });
  }
  function toggle(
    field: "categories" | "cuisines" | "dietary" | "accessibility" | "tags",
    id: string,
  ) {
    const values = query.filters[field];
    filters({
      [field]: values.includes(id)
        ? values.filter((value) => value !== id)
        : [...values, id],
    });
  }
  function reorder(index: number, destination: number) {
    if (destination < 0 || destination >= query.priority.length) return;
    const order = [...query.priority];
    const [item] = order.splice(index, 1);
    if (item) order.splice(destination, 0, item);
    setQuery({ ...query, priority: order });
    setNotice(t("Prioridad actualizada.", "Priority updated."));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    setQuery({ ...query, q: draft });
  }
  async function share() {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    params.set("city", "san-jose");
    for (const field of [
      "categories",
      "cuisines",
      "dietary",
      "accessibility",
      "tags",
    ] as const)
      if (query.filters[field].length)
        params.set(field, query.filters[field].join(","));
    params.set("radius_km", String(query.filters.radius_km));
    params.set("priority", query.priority.join(","));
    params.set("strategy", query.strategy);
    if (query.filters.open_now) params.set("open_now", "true");
    if (query.filters.min_rating !== undefined)
      params.set("min_rating", String(query.filters.min_rating));
    if (query.filters.price?.max_amount) {
      params.set("max_amount", query.filters.price.max_amount);
      params.set("currency", query.filters.price.currency);
    }
    const url = `${location.origin}/?${params}`;
    history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setNotice(
        t(
          "Enlace copiado. No incluye tus coordenadas.",
          "Link copied. Your coordinates are excluded.",
        ),
      );
    } catch {
      setNotice(
        t(
          "Puedes copiar el enlace de la barra de direcciones.",
          "Copy the link from the address bar.",
        ),
      );
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setError(
        t(
          "Tu navegador no permite ubicación. Usa la ciudad.",
          "Your browser does not support location. Use the city.",
        ),
      );
      return;
    }
    setNotice(
      t(
        "Solicitando permiso; la ubicación solo se usa en esta búsqueda.",
        "Requesting permission; location is only used for this search.",
      ),
    );
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setQuery({
          ...query,
          center: {
            kind: "coordinates",
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              source: "geolocation",
              accuracy_m: position.coords.accuracy,
            },
          },
        });
        setNotice(
          t(
            "Ubicación aplicada a esta búsqueda.",
            "Location applied to this search.",
          ),
        );
      },
      () =>
        setError(
          t(
            "Permiso denegado o ubicación no disponible. Sigue usando San José.",
            "Permission denied or location unavailable. Continue using San José.",
          ),
        ),
      { timeout: 8000, maximumAge: 0 },
    );
  }
  async function save(id: string) {
    try {
      if (saved.includes(id)) {
        await api(`me/saved-places/${id}`, { method: "DELETE" });
        setSaved(saved.filter((value) => value !== id));
      } else {
        await api(`me/saved-places/${id}`, { method: "PUT" });
        setSaved([...saved, id]);
      }
      setNotice(
        t(
          "Planes actualizados en tu cuenta demo.",
          "Plans updated in your demo account.",
        ),
      );
    } catch {
      setNotice(
        t(
          "Inicia una cuenta demo en Mis planes para guardar lugares.",
          "Start a demo account in My plans to save places.",
        ),
      );
    }
  }
  async function savePreset() {
    const name = window.prompt(
      t(
        "Nombre del conjunto de filtros (sin guardar ubicación):",
        "Filter preset name (location will not be saved):",
      ),
    );
    if (!name) return;
    try {
      await api("me/presets", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: {
          name,
          search: { ...query, center: { kind: "city", city_id: "san-jose" } },
          save_location: false,
        },
      });
      setNotice(
        t(
          "Filtros guardados en tu cuenta demo.",
          "Filters saved in your demo account.",
        ),
      );
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "authentication_required",
      );
    }
  }
  const number = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const currency = query.filters.price?.currency ?? "CRC";
  const options = (
    items: Taxon[],
    field: "cuisines" | "accessibility" | "dietary" | "tags",
  ) => (
    <div className="checkbox-list">
      {items.map((item) => (
        <label key={item.id}>
          <input
            type="checkbox"
            checked={query.filters[field].includes(item.id)}
            onChange={() => toggle(field, item.id)}
          />
          {locale === "en" ? item.en : item.es}
        </label>
      ))}
    </div>
  );
  return (
    <main id="main" className="discovery">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-spark" aria-hidden="true">
              ✳
            </span>{" "}
            {t("Planes para compartir", "Plans to share")}{" "}
            <span className="pill">
              {t("DEMO COSTA RICA", "COSTA RICA DEMO")}
            </span>
          </div>
          <h1>
            {t("Menos “¿qué hacemos?”.", "Less “what should we do?”.")}
            <br />
            <span>{t("Más buenos momentos.", "More good moments.")}</span>
          </h1>
          <p>
            {t(
              "Un café, una cena o una pequeña aventura. Encuentra un plan que se parezca a ustedes.",
              "Coffee, dinner or a little adventure. Find a plan that feels like the two of you.",
            )}
          </p>
          <form onSubmit={submit} className="search-bar">
            <label className="search-field">
              <span>
                {t("¿Qué te gustaría hacer?", "What would you like to do?")}
              </span>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t(
                  "Café, sushi, un paseo…",
                  "Coffee, sushi, a walk…",
                )}
                autoComplete="off"
              />
            </label>
            <button className="button" type="submit">
              <span aria-hidden="true">⌕</span>{" "}
              {t("Encontrar un plan", "Find a plan")}
            </button>
          </form>
          <div className="location-row">
            <span aria-hidden="true">⌖</span>
            <span>
              {query.center.kind === "coordinates"
                ? t(
                    "Tu ubicación · solo esta búsqueda",
                    "Your location · this search only",
                  )
                : "San José, Costa Rica"}
            </span>
            <button className="text-button" onClick={locate}>
              {t("Usar mi ubicación", "Use my location")}
            </button>
            <a className="privacy-link" href="/privacy">
              {t("Privacidad", "Privacy")}
            </a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-ring" />
          <div className="ticket ticket-one">
            <Illustration />
            <span>un café & una conversación</span>
          </div>
          <div className="ticket ticket-two">
            <Illustration tone="peach" />
            <span>a little time together</span>
          </div>
          <span className="hero-star">✳</span>
          <span className="hero-small-star">✧</span>
        </div>
      </section>
      <section
        className="workspace"
        aria-label={t("Buscar y comparar planes", "Search and compare plans")}
      >
        <aside className="filter-panel">
          <div className="filter-title">
            <h2>{t("A tu manera", "Your way")}</h2>
            <button
              className="text-button"
              onClick={() => {
                setQuery(initial);
                setDraft("");
              }}
            >
              {t("Limpiar", "Reset")}
            </button>
          </div>
          <p className="muted">
            {t(
              "Los filtros se combinan. Tú eliges lo importante.",
              "Combine filters. You choose what matters.",
            )}
          </p>
          <fieldset>
            <legend>{t("Tipo de plan", "Type of plan")}</legend>
            <div className="category-buttons">
              {taxonomies?.categories
                .filter((item) => !item.parent_id)
                .map((item) => (
                  <button
                    key={item.id}
                    className={
                      query.filters.categories.includes(item.id)
                        ? "category selected"
                        : "category"
                    }
                    aria-pressed={query.filters.categories.includes(item.id)}
                    onClick={() => toggle("categories", item.id)}
                  >
                    <span aria-hidden="true">
                      {item.slug === "coffee"
                        ? "☕"
                        : item.slug === "restaurants"
                          ? "♧"
                          : "↗"}
                    </span>
                    {locale === "en" ? item.en : item.es}
                  </button>
                ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              {t("Presupuesto por persona", "Estimated spend per person")}
            </legend>
            <div className="inline-controls">
              <label>
                {t("Moneda", "Currency")}
                <select
                  value={currency}
                  onChange={(event) =>
                    filters({
                      price: { currency: event.target.value as "CRC" | "USD" },
                    })
                  }
                >
                  <option>CRC</option>
                  <option>USD</option>
                </select>
              </label>
              <label>
                {t("Máximo", "Maximum")}
                <input
                  type="number"
                  min="0"
                  max={currency === "CRC" ? 50000 : 100}
                  step={currency === "CRC" ? 500 : 1}
                  placeholder={t("Sin límite", "No limit")}
                  value={query.filters.price?.max_amount ?? ""}
                  onChange={(event) =>
                    filters({
                      price: {
                        currency,
                        ...(event.target.value
                          ? { max_amount: event.target.value }
                          : {}),
                      },
                    })
                  }
                />
              </label>
            </div>
            <p className="fine-print">
              {t(
                "Precios ilustrativos; no son tarifas de negocios reales.",
                "Illustrative prices; not real business rates.",
              )}
            </p>
          </fieldset>
          <fieldset>
            <legend>
              {t("Cerca de ti", "Near you")}{" "}
              <span className="range-value">
                {number(query.filters.radius_km)} km
              </span>
            </legend>
            <label className="sr-only" htmlFor="radius">
              {t(
                "Radio de búsqueda en kilómetros",
                "Search radius in kilometers",
              )}
            </label>
            <input
              id="radius"
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={query.filters.radius_km}
              onChange={(event) =>
                filters({ radius_km: Number(event.target.value) })
              }
            />
            <div className="range-labels">
              <span>0.5 km</span>
              <span>50 km</span>
            </div>
          </fieldset>
          <fieldset>
            <legend>{t("Un par de detalles", "A few details")}</legend>
            <label className="check-row">
              <input
                type="checkbox"
                checked={query.filters.open_now}
                onChange={(event) =>
                  filters({ open_now: event.target.checked })
                }
              />
              {t("Abierto ahora · horario demo", "Open now · demo hours")}
            </label>
            <label className="stack-label">
              {t(
                "Puntuación mínima · Aroundate demo",
                "Minimum rating · Aroundate demo",
              )}
              <select
                value={query.filters.min_rating ?? ""}
                onChange={(event) =>
                  filters({
                    ...query.filters,
                    min_rating: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  })
                }
              >
                <option value="">{t("Cualquiera", "Any")}</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
              </select>
            </label>
          </fieldset>
          <details>
            <summary>{t("Comidas y sabores", "Food and cuisines")}</summary>
            {taxonomies && options(taxonomies.cuisines, "cuisines")}
          </details>
          <details>
            <summary>{t("Opciones alimentarias", "Dietary options")}</summary>
            {taxonomies &&
              options(
                taxonomies.features.filter((item) =>
                  ["vegetarian-options", "vegan-options"].includes(item.slug),
                ),
                "dietary",
              )}
          </details>
          <details>
            <summary>{t("Accesibilidad", "Accessibility")}</summary>
            {taxonomies &&
              options(
                taxonomies.features.filter((item) =>
                  ["step-free", "accessible-toilet"].includes(item.slug),
                ),
                "accessibility",
              )}
          </details>
          <details>
            <summary>{t("Ambiente del plan", "Plan atmosphere")}</summary>
            {taxonomies && options(taxonomies.tags, "tags")}
          </details>
          <details>
            <summary>{t("Ubicación manual", "Manual location")}</summary>
            <p className="fine-print">
              {t(
                "Centro de ciudad o coordenadas. Las direcciones necesitarán la API de geocodificación.",
                "City center or coordinates. Street addresses will require the geocoding API.",
              )}
            </p>
            <button
              className="text-button"
              onClick={() => setQuery({ ...query, center: initial.center })}
            >
              San José
            </button>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setQuery({
                  ...query,
                  center: {
                    kind: "coordinates",
                    coordinates: {
                      latitude: Number(data.get("latitude")),
                      longitude: Number(data.get("longitude")),
                      source: "manual",
                    },
                  },
                });
              }}
            >
              <label className="stack-label">
                {t("Latitud", "Latitude")}
                <input
                  name="latitude"
                  type="number"
                  min="-90"
                  max="90"
                  step="any"
                  required
                />
              </label>
              <label className="stack-label">
                {t("Longitud", "Longitude")}
                <input
                  name="longitude"
                  type="number"
                  min="-180"
                  max="180"
                  step="any"
                  required
                />
              </label>
              <button className="button button-outline" type="submit">
                {t("Aplicar", "Apply")}
              </button>
            </form>
          </details>
        </aside>
        <div className="result-area">
          <div className="result-header">
            <div>
              <span className="eyebrow">
                {t(
                  "Un nuevo recuerdo comienza aquí",
                  "A new memory starts here",
                )}
              </span>
              <h2>{t("Encuentra su próximo plan", "Find your next plan")}</h2>
            </div>
            <div
              className="view-toggle"
              aria-label={t("Vista de resultados", "Results view")}
            >
              <button
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                {t("Lista", "List")}
              </button>
              <button
                aria-pressed={view === "map"}
                onClick={() => setView("map")}
              >
                {t("Mapa", "Map")}
              </button>
            </div>
          </div>
          <div className="priority-panel">
            <div>
              <strong>{t("¿Qué importa más?", "What matters most?")}</strong>
              <p>
                {t(
                  "Ordena tus prioridades. También puedes usar las flechas.",
                  "Order your priorities. You can also use the arrows.",
                )}
              </p>
            </div>
            <ol className="priority-list">
              {query.priority.map((key, index) => (
                <li
                  key={key}
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData("text/plain", String(index))
                  }
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    reorder(
                      Number(event.dataTransfer.getData("text/plain")),
                      index,
                    );
                  }}
                >
                  <span className="priority-number">{index + 1}</span>
                  <span>{t(...labels[key])}</span>
                  <div>
                    <button
                      aria-label={`${t("Subir", "Move up")} ${t(...labels[key])}`}
                      disabled={index === 0}
                      onClick={() => reorder(index, index - 1)}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`${t("Bajar", "Move down")} ${t(...labels[key])}`}
                      disabled={index === query.priority.length - 1}
                      onClick={() => reorder(index, index + 1)}
                    >
                      ↓
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            <label className="strategy-label">
              {t("Cómo comparar", "How to compare")}
              <select
                value={query.strategy}
                onChange={(event) =>
                  setQuery({
                    ...query,
                    strategy: event.target.value as SearchRequest["strategy"],
                  })
                }
              >
                <option value="lexicographic">
                  {t("Prioridad estricta", "Strict priority")}
                </option>
                <option value="weighted">
                  {t("Balance de prioridades", "Weighted balance")}
                </option>
              </select>
            </label>
            <p className="fine-print">
              {query.strategy === "weighted"
                ? t(
                    "Cada prioridad aporta al puntaje; la primera pesa más.",
                    "Each priority contributes to the score; the first carries more weight.",
                  )
                : t(
                    "Primero compara la prioridad 1; las siguientes resuelven empates.",
                    "Compare priority 1 first; later priorities resolve ties.",
                  )}
            </p>
          </div>
          <div className="results-toolbar">
            <p role="status" aria-live="polite">
              {busy
                ? t("Buscando planes…", "Finding plans…")
                : `${results?.candidate_count ?? 0} ${t("planes de ejemplo", "demo plans")}`}
            </p>
            <div>
              <button className="text-button" onClick={savePreset}>
                {t("Guardar filtros", "Save filters")}
              </button>
              <button className="text-button" onClick={share}>
                {t("Compartir", "Share")} <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
          <p className="notice" role="status">
            {notice}
          </p>
          {error && (
            <div role="alert" className="error-card">
              {t(
                "Revisa los filtros o vuelve a intentarlo.",
                "Check filters or try again.",
              )}{" "}
              {error}
            </div>
          )}
          {view === "map" && (
            <div className="map-placeholder">
              <span aria-hidden="true">⌖</span>
              <h3>
                {t(
                  "El mapa se carga cuando tú lo eliges.",
                  "The map loads when you choose.",
                )}
              </h3>
              <p>
                {t(
                  "Google Maps está desactivado en el sandbox. Esta lista contiene los mismos resultados y distancias.",
                  "Google Maps is disabled in the sandbox. The list contains the same results and distances.",
                )}
              </p>
              <button
                className="button button-outline"
                onClick={() =>
                  window.dispatchEvent(new Event("privacy-settings"))
                }
              >
                {t("Revisar privacidad", "Review privacy")}
              </button>
            </div>
          )}
          <div className="result-grid" aria-busy={busy}>
            {results?.items.map((place) => (
              <article className="place-card" key={place.id}>
                <Link
                  className="art-link"
                  href={`/places/${place.id}`}
                  aria-label={`${t("Ver detalles de", "View details for")} ${place.name}`}
                >
                  <Illustration
                    tone={place.tone}
                    activity={place.categories.includes(
                      taxonomies?.categories.find(
                        (item) => item.slug === "active",
                      )?.id ?? "",
                    )}
                  />
                  <span className="card-demo">
                    {t("LUGAR FICTICIO", "FICTIONAL PLACE")}
                  </span>
                </Link>
                <button
                  className={`save-button ${saved.includes(place.id) ? "saved" : ""}`}
                  onClick={() => save(place.id)}
                  aria-pressed={saved.includes(place.id)}
                  aria-label={`${saved.includes(place.id) ? t("Quitar", "Remove") : t("Guardar", "Save")} ${place.name}`}
                >
                  {saved.includes(place.id) ? "♥" : "♡"}
                </button>
                <div className="card-body">
                  <div className="card-topline">
                    <span>
                      {taxonomies?.categories
                        .filter(
                          (item) =>
                            place.categories.includes(item.id) &&
                            !item.parent_id,
                        )
                        .map((item) => (locale === "en" ? item.en : item.es))
                        .join(" · ")}
                    </span>
                    <span>
                      {place.rating === null
                        ? "—"
                        : `★ ${number(place.rating)}`}
                    </span>
                  </div>
                  <h3>
                    <Link href={`/places/${place.id}`}>{place.name}</Link>
                  </h3>
                  <p className="card-address">{place.address}</p>
                  <div className="card-meta">
                    <span>
                      {place.prices[currency] === undefined
                        ? t("Precio no disponible", "Price unavailable")
                        : new Intl.NumberFormat(locale, {
                            style: "currency",
                            currency,
                            maximumFractionDigits: 0,
                          }).format(place.prices[currency]!)}
                    </span>
                    <span>{number(place.distance_km)} km</span>
                    <span>
                      {place.open_now === null
                        ? t("Horario no disponible", "Hours unavailable")
                        : place.open_now
                          ? t("Abierto", "Open")
                          : t("Cerrado", "Closed")}
                    </span>
                  </div>
                  <div className="rank-reason">
                    <span className="rank-badge">#{place.rank.ordinal}</span>
                    <p>
                      {t("Según tus prioridades", "Using your priorities")}:{" "}
                      {t(...labels[place.rank.full_priority[0] ?? "price"])}.{" "}
                      {t("Nivel de precio", "Price level")}{" "}
                      {place.priceLevel === null
                        ? t("desconocido", "unknown")
                        : `${place.priceLevel}/4`}{" "}
                      · {number(place.distance_km)} km.{" "}
                      {place.rank.facts.some((fact) => !fact.known)
                        ? t(
                            "Datos faltantes identificados.",
                            "Missing facts disclosed.",
                          )
                        : ""}
                    </p>
                  </div>
                  <details className="rank-details">
                    <summary>
                      {t(
                        "Cómo se ordenó este plan",
                        "How this plan was ranked",
                      )}
                    </summary>
                    <p>
                      {t("Puntaje ponderado", "Weighted score")}:{" "}
                      {number((place.rank.weighted_numerator / 15000000) * 100)}{" "}
                      / 100
                    </p>
                    <ul>
                      {place.rank.full_priority.map((criterion) => {
                        const fact = place.rank.facts.find(
                          (value) => value.criterion === criterion,
                        );
                        return (
                          <li key={criterion}>
                            {t(...labels[criterion])}:{" "}
                            {fact?.known
                              ? `${number(fact.utility_micros / 10000)} / 100`
                              : t(
                                  "dato no disponible; aporte cero",
                                  "unavailable; zero contribution",
                                )}{" "}
                            · {t("peso", "weight")} {fact?.raw_weight ?? 0}/15
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                  <p className="source-note">
                    {t(
                      "Fuente: Aroundate sandbox · opiniones ilustrativas",
                      "Source: Aroundate sandbox · illustrative opinions",
                    )}
                  </p>
                </div>
              </article>
            ))}
          </div>
          {!busy && !results?.items.length && !error && (
            <div className="empty-state">
              <h3>
                {t(
                  "Un pequeño ajuste puede abrir más planes.",
                  "A small change can open up more plans.",
                )}
              </h3>
              <p>
                {t(
                  "Amplía el radio o quita un filtro. Los datos desconocidos no satisfacen filtros específicos.",
                  "Expand the radius or remove a filter. Unknown facts do not satisfy specific filters.",
                )}
              </p>
              <button
                className="button button-outline"
                onClick={() => setQuery(initial)}
              >
                {t("Restablecer filtros", "Reset filters")}
              </button>
            </div>
          )}
          <div className="honest-note">
            <span aria-hidden="true">◎</span>
            <p>
              {t(
                "Explora con contexto: todos estos lugares, precios y opiniones son ficticios. Google, Instagram y TikTok se conectarán mediante sus APIs oficiales.",
                "Explore with context: these places, prices and opinions are fictional. Google, Instagram and TikTok will connect through their official APIs.",
              )}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
