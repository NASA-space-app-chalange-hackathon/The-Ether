/** Capture the README screenshots (1280×720) from a running production server: node scripts/readme-shots.mts [baseUrl] */
import { chromium, type Page } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3200";
const shots: { file: string; path: string; member?: string; day: string; steppe?: boolean; then?: (p: Page) => Promise<void> }[] = [
  { file: "home-day70.png", path: "/", member: "ORION-B", day: "70" },
  { file: "body-day95.png", path: "/body?region=heart", member: "ORION-C", day: "95" },
  { file: "alerts-day95.png", path: "/alerts", member: "ORION-C", day: "95", then: (p) => p.locator('[data-rule="cardiovascular"]').scrollIntoViewIfNeeded() },
  { file: "trends-day95.png", path: "/trends", member: "ORION-C", day: "95" },
  { file: "check-pvt.png", path: "/check", member: "ORION-A", day: "60", then: async (p) => { await p.getByRole("button", { name: /Reaction test/ }).click(); } },
  { file: "quests-day130.png", path: "/quests", member: "ORION-D", day: "130" },
  { file: "crew-day70.png", path: "/crew", day: "70", then: async (p) => { await p.getByRole("radio", { name: "Crew Medical Officer" }).click(); } },
  { file: "steppe-home.png", path: "/", day: "27", steppe: true },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(base + "/");
  await page.getByTestId("clock-day").waitFor();
  if (s.steppe) await page.getByTestId("mode-steppe").click();
  await page.goto(base + s.path);
  await page.getByTestId("clock-day").waitFor();
  if (s.member) await page.getByRole("group").filter({ hasText: s.member }).first().getByRole("button", { name: new RegExp(s.member) }).click();
  await page.getByRole("slider").fill(s.day);
  if (s.then) await s.then(page);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `docs/screenshots/${s.file}` });
  await page.close();
  console.log("captured", s.file);
}
await browser.close();
