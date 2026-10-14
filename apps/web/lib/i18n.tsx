"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
export type Locale = "es-CR" | "en";
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: "es-CR", setLocale: () => {} });
export function LocaleProvider({
  initial,
  children,
}: {
  initial: Locale;
  children: ReactNode;
}) {
  const [locale, set] = useState(initial);
  function setLocale(value: Locale) {
    set(value);
    document.documentElement.lang = value;
    document.cookie = `aroundate_language=${value}; Path=/; SameSite=Lax; Max-Age=15552000${location.protocol === "https:" ? "; Secure" : ""}`;
  }
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
export function useLocale() {
  const context = useContext(LocaleContext);
  return {
    ...context,
    t: (es: string, en: string) => (context.locale === "en" ? en : es),
  };
}
