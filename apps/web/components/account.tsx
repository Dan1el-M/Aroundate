"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/client";
import { useLocale } from "../lib/i18n";
import type { Place } from "../../../packages/catalog/seed";
import type { Profile, Preset } from "../../api/src/application/store";
export function Account() {
  const { t } = useLocale();
  const [profile, setProfile] = useState<Profile>(),
    [places, setPlaces] = useState<Place[]>([]),
    [presets, setPresets] = useState<Preset[]>([]),
    [adult, setAdult] = useState(false),
    [terms, setTerms] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(true),
    [confirm, setConfirm] = useState(false);
  async function load() {
    try {
      const user = await api<Profile>("me");
      setProfile(user);
      const saved = await api<{ items: { place_id: string }[] }>(
        "me/saved-places",
      );
      setPlaces(
        await Promise.all(
          saved.items.map((item) => api<Place>(`places/${item.place_id}`)),
        ),
      );
      setPresets((await api<{ items: Preset[] }>("me/presets")).items);
    } catch {
      setProfile(undefined);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function login(demo: boolean) {
    if (!adult || !terms) {
      setMessage(
        t(
          "Confirma la edad y acepta los términos por separado.",
          "Confirm your age and accept terms separately.",
        ),
      );
      return;
    }
    try {
      if (demo) {
        await api("/auth/demo", {
          method: "POST",
          body: {
            adult: true,
            terms_version: "2026-10-14",
            terms_accepted: true,
          },
        });
        await load();
      } else {
        const result = await api<{ authorize_url: string }>("/auth/login", {
          method: "POST",
          body: {
            adult: true,
            terms_version: "2026-10-14",
            terms_accepted: true,
          },
        });
        location.assign(result.authorize_url);
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "login_failed");
    }
  }
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setProfile(undefined);
    setPlaces([]);
    setPresets([]);
  }
  async function exportData() {
    try {
      const data = {
        generated_at: new Date().toISOString(),
        mode: "fictional-sandbox",
        profile,
        saved_places: await api("me/saved-places"),
        filter_presets: await api("me/presets"),
        consent_choices: await api("consents"),
      };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "aroundate-sandbox-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(
        t(
          "Exportación de tus datos demo descargada.",
          "Your demo data export was downloaded.",
        ),
      );
    } catch {
      setMessage(
        t(
          "No se pudo exportar. Inténtalo de nuevo.",
          "Could not export. Try again.",
        ),
      );
    }
  }
  async function removePreset(preset: Preset) {
    try {
      await api(`me/presets/${preset.id}`, {
        method: "DELETE",
        headers: { "If-Match": `"${preset.version}"` },
      });
      await load();
    } catch {
      setMessage(
        t(
          "El filtro cambió. Actualiza e inténtalo de nuevo.",
          "The preset changed. Reload and try again.",
        ),
      );
    }
  }
  async function erasure() {
    try {
      const receipt = await api<{ id: string }>("me/data-subject-requests", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: { kind: "erasure" },
      });
      setMessage(
        `${t("Solicitud demo pendiente; no se ha ejecutado borrado. Referencia:", "Demo request pending; deletion has not been executed. Reference:")} ${receipt.id}`,
      );
      setConfirm(false);
    } catch {
      setMessage(
        t(
          "No se pudo registrar la solicitud.",
          "Could not record the request.",
        ),
      );
    }
  }
  return (
    <main id="main" className="content-page">
      <div className="page-heading">
        <span className="eyebrow">
          {t("Para volver a encontrarse", "For the next time together")}
        </span>
        <h1>{t("Mis planes", "My plans")}</h1>
        <p>
          {t(
            "Guarda ideas para después. Tú controlas tus datos.",
            "Save ideas for later. You control your data.",
          )}
        </p>
      </div>
      <p role="status">{message}</p>
      {busy ? (
        <p>{t("Cargando…", "Loading…")}</p>
      ) : !profile ? (
        <section className="account-login">
          <div>
            <h2>
              {t("Prueba una cuenta de demostración", "Try a demo account")}
            </h2>
            <p>
              {t(
                "No pide correo ni contraseña. Los datos se guardan temporalmente en memoria y se pierden al reiniciar el servidor.",
                "No email or password needed. Data is temporarily stored in memory and disappears on server restart.",
              )}
            </p>
            <label className="check-row">
              <input
                type="checkbox"
                checked={adult}
                onChange={(event) => setAdult(event.target.checked)}
              />
              {t(
                "Confirmo que tengo al menos 18 años.",
                "I confirm that I am at least 18 years old.",
              )}
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={terms}
                onChange={(event) => setTerms(event.target.checked)}
              />
              {t(
                "Acepto el borrador de términos de la demo.",
                "I accept the demo terms draft.",
              )}{" "}
              <Link href="/terms">{t("Leer términos", "Read terms")}</Link>
            </label>
            <p className="fine-print">
              <Link href="/privacy">
                {t("Cómo usamos tus datos", "How we use your data")}
              </Link>
            </p>
            <div className="button-row">
              <button className="button" onClick={() => login(true)}>
                {t("Entrar a la demo", "Enter demo account")}
              </button>
              <button
                className="button button-outline"
                onClick={() => login(false)}
              >
                {t("Iniciar sesión OIDC", "Sign in with OIDC")}
              </button>
            </div>
            <p className="fine-print">
              {t(
                "OIDC requiere configurar el proveedor de identidad. Passkeys y TOTP se gestionan allí.",
                "OIDC requires configuring an identity provider. Passkeys and TOTP are managed there.",
              )}
            </p>
          </div>
          <div className="account-art" aria-hidden="true">
            <span>✳</span>
            <p>
              little plans.
              <br />
              good company.
            </p>
          </div>
        </section>
      ) : (
        <>
          <div className="account-bar">
            <p>
              {t(
                "Cuenta demo · identidad verificada de prueba",
                "Demo account · verified test identity",
              )}
            </p>
            <button className="button button-outline" onClick={logout}>
              {t("Cerrar sesión", "Sign out")}
            </button>
          </div>
          <section className="account-section">
            <h2>{t("Lugares guardados", "Saved places")}</h2>
            {places.length ? (
              <ul className="saved-list">
                {places.map((place) => (
                  <li key={place.id}>
                    <div>
                      <Link href={`/places/${place.id}`}>
                        <strong>{place.name}</strong>
                      </Link>
                      <p>{place.address}</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={async () => {
                        await api(`me/saved-places/${place.id}`, {
                          method: "DELETE",
                        });
                        await load();
                      }}
                    >
                      {t("Quitar", "Remove")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {t(
                  "Todavía no has guardado un lugar. Explora y usa el corazón.",
                  "No saved places yet. Explore and use the heart.",
                )}
              </p>
            )}
            <Link className="button button-outline" href="/">
              {t("Explorar planes", "Explore plans")}
            </Link>
          </section>
          <section className="account-section">
            <h2>{t("Filtros guardados", "Saved filters")}</h2>
            {presets.length ? (
              <ul className="saved-list">
                {presets.map((preset) => (
                  <li key={preset.id}>
                    <strong>{preset.name}</strong>
                    <button
                      className="text-button"
                      onClick={() => removePreset(preset)}
                    >
                      {t("Eliminar filtro", "Delete preset")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {t(
                  "Guarda tus preferencias desde la página Explorar.",
                  "Save your preferences from Explore.",
                )}
              </p>
            )}
          </section>
          <section className="account-section">
            <h2>{t("Privacidad y datos", "Privacy and data")}</h2>
            <div className="button-row">
              <button className="button button-outline" onClick={exportData}>
                {t("Exportar datos demo", "Export demo data")}
              </button>
              <button
                className="button button-outline"
                onClick={() =>
                  window.dispatchEvent(new Event("privacy-settings"))
                }
              >
                {t("Cambiar consentimientos", "Change consent")}
              </button>
              <button className="text-button" onClick={() => setConfirm(true)}>
                {t("Solicitar eliminación", "Request deletion")}
              </button>
            </div>
            {confirm && (
              <div className="confirmation">
                <p>
                  {t(
                    "Se registrará una solicitud demo pendiente. El flujo con procesadores y respaldos se implementará antes de habilitar producción.",
                    "A pending demo request will be recorded. Processor and backup workflows will be implemented before production is enabled.",
                  )}
                </p>
                <div className="button-row">
                  <button className="button" onClick={erasure}>
                    {t("Confirmar solicitud", "Confirm request")}
                  </button>
                  <button
                    className="button button-outline"
                    onClick={() => setConfirm(false)}
                  >
                    {t("Cancelar", "Cancel")}
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
