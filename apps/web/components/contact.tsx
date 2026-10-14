"use client";
import { useState, type FormEvent } from "react";
import { api } from "../lib/client";
import { useLocale } from "../lib/i18n";
export function Contact({ report = false }: { report?: boolean }) {
  const { t } = useLocale();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const email = String(values.get("email") ?? ""),
        data = report
          ? {
              target_kind: "place",
              target_id: String(values.get("target_id")),
              reason: String(values.get("reason")),
              details: String(values.get("message")),
              ...(email ? { contact_email: email } : {}),
            }
          : {
              topic: String(values.get("topic")),
              message: String(values.get("message")),
              ...(email ? { email } : {}),
            };
      const receipt = await api<{ id: string }>(
        report ? "reports" : "contact",
        {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID() },
          body: data,
        },
      );
      setMessage(
        `${t("Registrado en memoria de la demo; no se envió a un equipo externo. Referencia:", "Recorded in demo memory; not sent to an external team. Reference:")} ${receipt.id}`,
      );
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "request_failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="content-page legal-page">
      <span className="eyebrow">
        {t("CANAL DE DEMOSTRACIÓN", "DEMONSTRATION CHANNEL")}
      </span>
      <h1>
        {report
          ? t("Reportar contenido", "Report content")
          : t("Hablemos", "Get in touch")}
      </h1>
      <p>
        {t(
          "Este formulario registra una solicitud local. Los contactos y plazos de producción están pendientes.",
          "This form records a local request. Production contacts and response deadlines are pending.",
        )}
      </p>
      <form className="contact-form" onSubmit={submit}>
        {report ? (
          <>
            <label>
              {t(
                "Identificador del lugar o contenido *",
                "Place or content identifier *",
              )}
              <input name="target_id" required maxLength={200} />
            </label>
            <label>
              {t("Motivo *", "Reason *")}
              <select name="reason">
                <option value="inaccurate">
                  {t("Información incorrecta", "Inaccurate information")}
                </option>
                <option value="copyright">
                  {t("Derechos de autor", "Copyright")}
                </option>
                <option value="abuse">{t("Abuso", "Abuse")}</option>
                <option value="suspicious_review">
                  {t("Reseña sospechosa", "Suspicious review")}
                </option>
                <option value="accessibility">
                  {t("Accesibilidad", "Accessibility")}
                </option>
                <option value="other">{t("Otro", "Other")}</option>
              </select>
            </label>
          </>
        ) : (
          <label>
            {t("Tema *", "Topic *")}
            <select name="topic">
              <option value="support">{t("Ayuda", "Support")}</option>
              <option value="privacy">{t("Privacidad", "Privacy")}</option>
              <option value="accessibility">
                {t("Accesibilidad", "Accessibility")}
              </option>
              <option value="security">{t("Seguridad", "Security")}</option>
              <option value="other">{t("Otro", "Other")}</option>
            </select>
          </label>
        )}
        <label>
          {t("Correo opcional para responder", "Optional email for a response")}
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
          />
        </label>
        <label>
          {t("Mensaje *", "Message *")}
          <textarea
            name="message"
            required
            minLength={1}
            maxLength={3000}
            rows={5}
          />
        </label>
        <p className="fine-print">
          <a href="/privacy">
            {t(
              "Cómo se tratarán los datos de esta solicitud",
              "How this request data will be handled",
            )}
          </a>{" "}
          ·{" "}
          {t(
            "No implica consentimiento de marketing.",
            "No marketing consent implied.",
          )}
        </p>
        <button className="button" disabled={busy}>
          {t("Registrar solicitud demo", "Record demo request")}
        </button>
        <p role="status">{message}</p>
      </form>
    </main>
  );
}
