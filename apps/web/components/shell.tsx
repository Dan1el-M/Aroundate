"use client";
import Link from "next/link";
import { useLocale } from "../lib/i18n";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Aroundate — inicio">
      <span aria-hidden="true" className="brand-mark">
        a<span>↗</span>
      </span>
      aroundate<span className="brand-dot">.</span>
    </Link>
  );
}
export function Header() {
  const { locale, setLocale, t } = useLocale();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav aria-label={t("Navegación principal", "Main navigation")}>
          <Link href="/">{t("Explorar", "Explore")}</Link>
          <Link href="/account">{t("Mis planes", "My plans")}</Link>
        </nav>
        <div className="header-actions">
          <button
            className="language-button"
            aria-label={t("Cambiar a inglés", "Switch to Spanish")}
            onClick={() => setLocale(locale === "en" ? "es-CR" : "en")}
          >
            {locale === "en" ? "ES" : "EN"} <span aria-hidden="true">◎</span>
          </button>
          <Link className="button button-small" href="/account">
            {t("Guardar un plan", "Save a plan")}{" "}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
const pages = [
  ["privacy", "Privacidad", "Privacy"],
  ["cookies", "Cookies", "Cookies"],
  ["terms", "Términos", "Terms"],
  ["refunds", "Reembolsos", "Refunds"],
  ["accessibility", "Accesibilidad", "Accessibility"],
  ["business-information", "Información legal", "Business information"],
  ["contact", "Contacto", "Contact"],
  ["report", "Reportar contenido", "Report content"],
] as const;
export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="site-footer">
      <div>
        <Brand />
        <p>
          {t(
            "Más tiempo juntos. Un plan a la vez.",
            "More time together. One plan at a time.",
          )}
        </p>
        <p className="fine-print">
          {t(
            "Demostración · lugares ficticios · servicio para mayores de 18 años",
            "Demo · fictional places · service for adults 18 and older",
          )}
        </p>
      </div>
      <nav
        aria-label={t("Información y políticas", "Information and policies")}
      >
        {pages.map(([slug, es, en]) => (
          <Link key={slug} href={`/${slug}`}>
            {t(es, en)}
          </Link>
        ))}
        <button
          className="text-button"
          onClick={() => window.dispatchEvent(new Event("privacy-settings"))}
        >
          {t("Cambiar privacidad", "Change privacy choices")}
        </button>
      </nav>
    </footer>
  );
}
