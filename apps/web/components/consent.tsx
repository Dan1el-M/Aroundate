"use client";
import { useEffect, useState } from "react";
import { PURPOSES, type Purpose } from "../../../packages/domain/consent";
import { api } from "../lib/client";
import { useLocale } from "../lib/i18n";
interface State {
  has_choice: boolean;
  gpc: boolean;
  dnt: boolean;
  choices: { purpose: Purpose; allowed: boolean }[];
}
const names: Record<Purpose, [string, string]> = {
  analytics: ["Analítica anónima", "Anonymous analytics"],
  marketing_email: ["Correo de novedades", "Marketing email"],
  google_maps: ["Mapa de Google", "Google map"],
  instagram_embeds: ["Publicaciones de Instagram", "Instagram posts"],
  tiktok_embeds: ["Videos de TikTok", "TikTok videos"],
  saved_location: ["Ubicación guardada", "Saved location"],
};
export function Consent() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false),
    [expanded, setExpanded] = useState(false),
    [state, setState] = useState<State>(),
    [choices, setChoices] = useState<Partial<Record<Purpose, boolean>>>({}),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    api<State>("consents")
      .then((value) => {
        if (active) {
          setState(value);
          setChoices(
            Object.fromEntries(
              value.choices.map((choice) => [choice.purpose, choice.allowed]),
            ),
          );
          setVisible(!value.has_choice);
        }
      })
      .catch(() => {
        if (active) {
          setVisible(true);
          setError("privacy_unavailable");
        }
      });
    const open = () => {
      setVisible(true);
      setExpanded(true);
    };
    window.addEventListener("privacy-settings", open);
    return () => {
      active = false;
      window.removeEventListener("privacy-settings", open);
    };
  }, []);
  async function choose(action: "accept" | "reject" | "custom") {
    setSaving(true);
    setError("");
    try {
      const value = await api<State>("consents", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: {
          policy_version: "2026-10-14",
          choices: PURPOSES.map((purpose) => ({
            purpose,
            decision:
              action === "reject"
                ? "reject"
                : action === "accept" || choices[purpose]
                  ? "grant"
                  : "withdraw",
          })),
        },
      });
      setState(value);
      setVisible(false);
    } catch {
      setError(
        t(
          "No se pudo guardar. Las funciones opcionales permanecen apagadas.",
          "Could not save. Optional features remain disabled.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }
  if (!visible) return null;
  return (
    <aside
      className="consent-panel"
      aria-label={t("Preferencias de privacidad", "Privacy preferences")}
    >
      <div className="consent-copy">
        <span className="eyebrow">{t("Tú decides", "Your choice")}</span>
        <h2>
          {t(
            "Un buen plan, con tu privacidad.",
            "A good plan, with your privacy.",
          )}
        </h2>
        <p>
          {t(
            "Solo usamos almacenamiento necesario. Mapas, redes sociales y analítica necesitan tu elección; están desactivados en esta demo.",
            "We only use necessary storage. Maps, social media and analytics need your choice; they are disabled in this demo.",
          )}{" "}
          <a href="/privacy">{t("Política de privacidad", "Privacy policy")}</a>
        </p>
        {(state?.gpc || state?.dnt) && (
          <p>
            {t(
              "Respetamos tu señal de no seguimiento: analítica y marketing permanecen rechazados.",
              "We honor your privacy signal: analytics and marketing stay rejected.",
            )}
          </p>
        )}
      </div>
      {expanded && (
        <fieldset className="consent-options">
          <legend>{t("Elegir por finalidad", "Choose by purpose")}</legend>
          {PURPOSES.map((purpose) => (
            <label key={purpose}>
              <input
                type="checkbox"
                checked={!!choices[purpose]}
                disabled={
                  !!(state?.gpc || state?.dnt) &&
                  ["analytics", "marketing_email"].includes(purpose)
                }
                onChange={(event) =>
                  setChoices({ ...choices, [purpose]: event.target.checked })
                }
              />
              {t(...names[purpose])}
            </label>
          ))}
        </fieldset>
      )}
      <div className="consent-actions">
        <button
          className="button button-outline"
          disabled={saving}
          onClick={() => choose("reject")}
        >
          {t("Rechazar todo", "Reject all")}
        </button>
        <button
          className="button button-outline"
          disabled={saving}
          onClick={() => choose("accept")}
        >
          {t("Aceptar todo", "Accept all")}
        </button>
        <button
          className="text-button"
          disabled={saving}
          onClick={() => (expanded ? choose("custom") : setExpanded(true))}
        >
          {expanded
            ? t("Guardar selección", "Save choices")
            : t("Personalizar", "Customize")}
        </button>
      </div>
      <p role="status" className="form-error">
        {error}
      </p>
    </aside>
  );
}
