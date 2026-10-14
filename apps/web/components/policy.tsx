"use client";
import { policies, policyVersion } from "../lib/policies";
import { useLocale } from "../lib/i18n";
export function Policy({ slug }: { slug: string }) {
  const { t } = useLocale();
  const page = policies[slug];
  if (!page) return null;
  return (
    <main id="main" className="content-page legal-page">
      <span className="eyebrow">
        {t("BORRADOR · PARA REVISIÓN LEGAL", "DRAFT · FOR LEGAL REVIEW")}
      </span>
      <h1>{t(...page.title)}</h1>
      <p className="draft-notice">
        {t(
          "Este texto no es asesoría legal ni un documento aprobado para producción.",
          "This is not legal advice or a production-approved document.",
        )}{" "}
        {t("Versión", "Version")}: {policyVersion}.
      </p>
      {page.sections.map((section, index) => (
        <section key={index}>
          <h2>{t(...section.heading)}</h2>
          <p>{t(...section.text)}</p>
        </section>
      ))}
    </main>
  );
}
