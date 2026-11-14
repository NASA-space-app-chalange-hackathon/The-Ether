/**
 * Capture a screenshot of the running app (used for the README and design checks).
 *   node scripts/screenshot.mts <url> <out.png> [day] [member-callsign] [width] [height]
 */
import { chromium } from "@playwright/test";

const [, , url, out, day, member, w = "1280", h = "720"] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
await page.goto(url);
await page.getByTestId("clock-day").waitFor();
if (member) await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: new RegExp(member) }).click();
if (day) await page.getByLabel("Mission day").fill(day);
await page.waitForTimeout(1200);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
