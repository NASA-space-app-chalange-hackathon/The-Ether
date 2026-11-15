import { expect, test, type Page } from "@playwright/test";
import { ROUTES } from "../components/ui/routes";
import { waitForData, watchForProblems } from "./helpers";

/** Latin words allowed in Mongolian UI: brand, acronyms, units. Citation links are excluded separately. */
const ALLOWED = new Set(["The", "Ether", "NASA", "Space", "Apps", "RMSSD", "mmHg", "SANS"]); // "NASA Space Apps" is the event name

/** Visible text with external citation links removed; returns untranslated English words and raw i18n keys. */
async function untranslated(page: Page): Promise<string[]> {
  const text = await page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('a[target="_blank"], script, style, [aria-hidden="true"]').forEach((n) => n.remove());
    document.body.appendChild(clone);
    clone.style.position = "absolute";
    const visible = clone.innerText;
    clone.remove();
    return visible;
  });
  const rawKeys = text.match(/\b[a-z]+\.[a-zA-Z]+(\.[a-zA-Z]+)?\b/g)?.filter((k) => !/^\d/.test(k) && !k.includes("tel")) ?? [];
  const english = (text.match(/[A-Za-z]{4,}/g) ?? []).filter((w) => !ALLOWED.has(w));
  return [...new Set([...rawKeys, ...english])];
}

async function enterSteppe(page: Page) {
  await page.goto("/");
  await waitForData(page);
  await page.getByTestId("mode-steppe").click();
  await expect(page.getByTestId("mode-steppe")).toHaveAttribute("aria-pressed", "true");
}

test("Steppe toggle: Mongolian UI, herder data, Earth ladder, soum hospital card", async ({ page }) => {
  const problems = watchForProblems(page);
  await enterSteppe(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "mn");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Нүүр");
  await expect(page.getByTestId("steppe-care")).toContainText("103");
  await page.getByRole("slider", { name: "Өдөр" }).fill("27");
  await expect(page.getByTestId("home-alerts")).toContainText("Зүрх, даралтын өөрчлөлт");
  await expect(page.getByTestId("home-alerts")).toContainText("Сумын эмнэлэг · 103");

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Биеийн зураг" }).click();
  await expect(page.locator('svg [data-region="cold"]').first()).toHaveAttribute("data-status", /watch|critical/);
  await expect(page.locator('svg [data-region="eyes"]')).toHaveCount(0);
  const systems = page.getByRole("list", { name: "Биеийн тогтолцоо" });
  await expect(systems.getByRole("button", { name: /Хүйтний нөлөө/ })).toBeVisible();
  await expect(systems.getByRole("button", { name: /Цацраг|SANS/ })).toHaveCount(0);

  await page.getByTestId("mode-space").click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Mission Home" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mission Home");
  expect(problems).toEqual([]);
});

for (const route of ROUTES) {
  test(`Steppe ${route.href}: no untranslated text`, async ({ page }) => {
    await enterSteppe(page);
    await page.getByRole("slider", { name: "Өдөр" }).fill("27");
    await page.goto(route.href);
    await waitForData(page);
    await page.waitForTimeout(300);
    expect(await untranslated(page)).toEqual([]);
  });
}
