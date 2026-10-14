import type { Metadata } from "next";
import { headers } from "next/headers";
import { LocaleProvider } from "../lib/i18n";
import { Header, Footer } from "../components/shell";
import { Consent } from "../components/consent";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Aroundate · Encuentra tu próximo plan",
    template: "%s · Aroundate",
  },
  description:
    "Explora planes para compartir en Costa Rica. Demostración con lugares ficticios y privacidad por defecto.",
};
export const dynamic = "force-dynamic";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const request = await headers();
  const initial = request.get("x-language") === "en" ? "en" : "es-CR";
  return (
    <html lang={initial}>
      <body>
        <LocaleProvider initial={initial}>
          <a className="skip-link" href="#main">
            {initial === "en" ? "Skip to content" : "Saltar al contenido"}
          </a>
          <Header />
          {children}
          <Footer />
          <Consent />
        </LocaleProvider>
      </body>
    </html>
  );
}
