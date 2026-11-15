import { expect, test, type Page } from "@playwright/test";
import { ROUTES } from "../components/ui/routes";
import { waitForData, watchForProblems } from "./helpers";

/** Latin words allowed in Mongolian UI: brand, acronyms, units, proper names. Citation links are excluded separately. */
const ALLOWED = new Set([
  "The", "Ether", "NASA", "Space", "Apps", "RMSSD", "mmHg", "SANS", "ORION", "DONKI", "GOES", "Horizons",
  "MOSFET", "EVARM", "Radi", "CANS", "Bubble", "Technology", "Industries", // CSA radiation instruments and contractor
]);

/** Visible text with external citation links removed. */
async function visibleText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('a[target="_blank"], script, style, [aria-hidden="true"]').forEach((n) => n.remove());
    document.body.appendChild(clone);
    clone.style.position = "absolute";
    const visible = clone.innerText;
    clone.remove();
    return visible;
  });
}

/** Mongolian UI: untranslated English words and raw i18n keys. */
async function untranslatedMn(page: Page): Promise<string[]> {
  const text = await visibleText(page);
  const rawKeys = text.match(/\b[a-z]+\.[a-zA-Z]+(\.[a-zA-Z]+)?\b/g)?.filter((k) => !/^\d/.test(k) && !k.includes("tel")) ?? [];
  // Case-insensitive: eyebrow headings are rendered in capitals ("HORIZONS").
  const allowed = new Set([...ALLOWED].map((w) => w.toUpperCase()));
  const english = (text.match(/[A-Za-z]{4,}/g) ?? []).filter((w) => !allowed.has(w.toUpperCase()));
  return [...new Set([...rawKeys, ...english])];
}

/** English UI: any Cyrillic left over. */
async function cyrillic(page: Page): Promise<string[]> {
  return [...new Set((await visibleText(page)).match(/[Ѐ-ӿ]+/g) ?? [])];
}

async function enterSteppe(page: Page) {
  await page.goto("/");
  await waitForData(page);
  await page.getByTestId("mode-steppe").click();
  await expect(page.getByTestId("mode-steppe")).toHaveAttribute("aria-pressed", "true");
}

test("Steppe works in English by default and in Mongolian via the language switch", async ({ page }) => {
  const problems = watchForProblems(page);
  await enterSteppe(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mission Home");
  await expect(page.getByTestId("steppe-care")).toContainText("103");
  await page.getByLabel("Mission day", { exact: true }).fill("27");
  await expect(page.getByTestId("home-alerts")).toContainText("Heart rate and blood pressure are above your normal");
  await expect(page.getByTestId("home-alerts")).toContainText("Soum hospital · 103");
  // Same Steppe body systems on Home as on the Body Map: cold exposure / skin, no eyes or radiation.
  const homeSystems = page.locator('a[href^="/body?region="]');
  await expect(homeSystems.filter({ hasText: "Cold exposure" })).toHaveCount(1);
  await expect(page.locator('a[href="/body?region=eyes"], a[href="/body?region=radiation"]')).toHaveCount(0);

  await page.getByTestId("lang-mn").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "mn");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Нүүр");
  await expect(page.getByTestId("home-alerts")).toContainText("Зүрхний цохилт, даралт хэвийнээс өндөр байна");
  await expect(page.getByTestId("home-alerts")).toContainText("Сумын эмнэлэг · 103");

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Биеийн зураг" }).click();
  await expect(page.locator('svg [data-region="cold"]').first()).toHaveAttribute("data-status", /watch|critical/);
  await expect(page.locator('svg [data-region="eyes"]')).toHaveCount(0);
  const systems = page.getByRole("list", { name: "Биеийн тогтолцоо" });
  await expect(systems.getByRole("button", { name: /Хүйтний нөлөө/ })).toBeVisible();
  await expect(systems.getByRole("button", { name: /Цацраг|SANS/ })).toHaveCount(0);

  // Space in Mongolian, then back to English.
  await page.getByTestId("mode-space").click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Нүүр" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Нүүр");
  await page.getByTestId("lang-en").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mission Home");
  expect(problems).toEqual([]);
});

for (const mode of ["space", "steppe"] as const) {
  for (const route of ROUTES) {
    test(`${mode} ${route.href}: fully Mongolian in MN, no Cyrillic in EN`, async ({ page }) => {
      await page.goto("/");
      await waitForData(page);
      await page.getByTestId(`mode-${mode}`).click();
      await page.locator('input[type="range"]').fill(mode === "space" ? "95" : "27");
      await page.getByTestId("lang-mn").click();
      await page.goto(route.href);
      await waitForData(page);
      await page.waitForTimeout(300);
      expect(await untranslatedMn(page)).toEqual([]);
      await page.getByTestId("lang-en").click();
      await page.waitForTimeout(300);
      expect(await cyrillic(page)).toEqual([]);
    });
  }
}
