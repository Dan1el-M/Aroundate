import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("consent denies third-party requests and stays changeable", async ({
  page,
}) => {
  const foreign: string[] = [];
  page.on("request", (request) => {
    if (!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))
      foreign.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Menos “¿qué hacemos?”. Más buenos momentos.",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rechazar todo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Rechazar todo", exact: true }),
  ).not.toBeVisible();
  expect(foreign).toEqual([]);
  await page
    .getByRole("button", { name: "Cambiar privacidad", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Guardar selección" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rechazar todo", exact: true })
    .click();
  const cookies = await page.context().cookies();
  await test.info().attach("cookie-audit.json", {
    body: JSON.stringify(
      cookies.map(({ name, domain, httpOnly, secure, sameSite, expires }) => ({
        name,
        domain,
        httpOnly,
        secure,
        sameSite,
        expires,
      })),
      null,
      2,
    ),
    contentType: "application/json",
  });
  expect(
    cookies.some(
      (cookie) => cookie.name === "aroundate_proof" && cookie.httpOnly,
    ),
  ).toBe(true);
});
test("filters rank reorder bilingual UI detail and reflow", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Rechazar todo", exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveCount(7);
  await page.locator("#radius").focus();
  await page.locator("#radius").press("End");
  await expect(page.getByRole("article")).toHaveCount(8);
  await page.getByRole("button", { name: "Cafés", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Subir Distancia", exact: true })
    .click();
  await expect(page.locator(".priority-list li").first()).toContainText(
    "Distancia",
  );
  await page.getByLabel("Cómo comparar").selectOption("weighted");
  await expect(page.getByLabel("Cómo comparar")).toHaveValue("weighted");
  await page.getByRole("button", { name: "Cambiar a inglés" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Find your next plan" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Jardín de papel", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Jardín de papel", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Opinions by source" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("demo login saves user-owned plans and blocks CSRF", async ({ page }) => {
  await page.goto("/account");
  await page
    .getByRole("button", { name: "Rechazar todo", exact: true })
    .click();
  const csrf = await page.request.post("/auth/demo", {
    data: { adult: true, terms_version: "2026-10-14", terms_accepted: true },
  });
  expect(csrf.status()).toBe(403);
  await page.getByLabel("Confirmo que tengo al menos 18 años.").check();
  await page.getByLabel("Acepto el borrador de términos de la demo.").check();
  await page
    .getByRole("button", { name: "Entrar a la demo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cerrar sesión", exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Guardar Jardín de papel", exact: true })
    .click();
  await page.goto("/account");
  await expect(
    page.getByRole("link", { name: "Jardín de papel", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Entrar a la demo", exact: true }),
  ).toBeVisible();
});
test("automated accessibility and visual artifact", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Rechazar todo", exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveCount(7);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({
    path: `test-results/aroundate-${test.info().project.name}.png`,
    fullPage: true,
  });
});
