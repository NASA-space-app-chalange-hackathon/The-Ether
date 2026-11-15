import { expect, test, type Page } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

async function at(page: Page, path: string, member: string | null, day: string) {
  await page.goto(path);
  await waitForData(page);
  if (member) await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: new RegExp(member) }).click();
  await page.getByLabel("Mission day").fill(day);
}

test("server routes serve parsed NASA data (live or committed snapshot), never an API key", async ({ request }) => {
  const sw = await (await request.get("/api/nasa/space-weather")).json();
  expect(["live", "snapshot"]).toContain(sw.status);
  expect(sw.data.events.map((e: { missionDay: number }) => e.missionDay)).toContain(40);
  const lt = await (await request.get("/api/nasa/light-time")).json();
  expect(lt.data.rows).toHaveLength(180);
  const w = await (await request.get("/api/nasa/weather")).json();
  expect(w.data.days).toHaveLength(30);
  expect(JSON.stringify([sw.requests, lt.requests, w.requests])).not.toMatch(/api_key/i);
});

test("DONKI replay: markers on the clock, real event on Home, shelter alert with CMO dose check", async ({ page }) => {
  const problems = watchForProblems(page);
  await at(page, "/", "ORION-A", "40");
  await expect(page.locator('[data-real="DONKI"]')).toHaveCount(6);
  await expect(page.getByRole("button", { name: /Jump to day 40: Real NASA DONKI event from Jun 8, 2024/ })).toBeVisible();
  const donki = page.getByTestId("donki-event");
  await expect(donki).toContainText("Jun 8, 2024");
  await expect(donki.getByTestId("real-data-badge")).toContainText("Real NASA data");

  await page.goto("/alerts");
  await waitForData(page);
  const card = page.locator('[data-testid="alert-card"][data-rule="radiation-event"]');
  await expect(card).toContainText("replayed on mission day 40");
  await expect(card).toContainText("Real NASA data");
  await expect(card.getByRole("link", { name: /NASA DONKI — Solar energetic particle event/ })).toHaveAttribute("href", /ccmc\.gsfc\.nasa\.gov\/DONKI/);
  await expect(card.locator('[aria-current="step"]')).toContainText("Crew doctor");
  await expect(card).toContainText("dosimeter");
  await expect(card.getByTestId("hazard-tags")).toContainText("Space Radiation");
  expect(problems).toEqual([]);
});

test("JPL Horizons: real light time drives Signal to Earth and 'CMO acts first' on Earth alerts", async ({ page }) => {
  const problems = watchForProblems(page);
  await at(page, "/", null, "0");
  await page.getByRole("radio", { name: "Mars base" }).click();
  await expect(page.getByTestId("signal-delay")).toContainText("13 min 18 s");
  await expect(page.getByTestId("signal-delay")).toContainText("JPL Horizons");
  await page.getByRole("radio", { name: "Mars transit" }).click();
  await expect(page.getByTestId("signal-delay")).toContainText("approx., from JPL Horizons");

  await at(page, "/alerts", "ORION-C", "95");
  const card = page.locator('[data-testid="alert-card"][data-rule="cardiovascular"]');
  await expect(card.getByTestId("first-responder")).toContainText("The crew doctor (CMO) acts first");
  await expect(card.getByTestId("hazard-tags")).toContainText("Distance from Earth");

  // On the Moon, Earth answers in seconds: no override.
  await page.goto("/");
  await waitForData(page);
  await page.getByRole("radio", { name: "Lunar base" }).click();
  await page.goto("/alerts");
  await waitForData(page);
  await expect(card).toBeVisible();
  await expect(card.getByTestId("first-responder")).toHaveCount(0);
  await page.goto("/");
  await waitForData(page);
  await page.getByRole("radio", { name: "Mars transit" }).click();
  expect(problems).toEqual([]);
});

test("hidden-fatigue evidence: consistent decimals, signed units, labelled as 5-day averages", async ({ page }) => {
  await at(page, "/alerts", "ORION-B", "70");
  const drift = page.locator('[data-testid="alert-card"][data-rule="behavioral-drift"]');
  const table = drift.getByRole("table", { name: /triggered/ });
  await expect(table).toContainText("5-day avg");
  const lapses = table.getByRole("row", { name: /Attention lapses/ });
  await expect(lapses).toContainText("3.0");
  await expect(lapses).toContainText("0.4");
  await expect(lapses).toContainText("+2.6");
  // 1–5 scales always show one decimal and a signed change (e.g. "4.2 4.2 ±0.0").
  await expect(table.getByRole("row", { name: /Self-reported mood/ })).toContainText(/\d\.\d\s+\d\.\d\s+[±+−]\d\.\d/);
  await expect(drift.getByTestId("evidence-note")).toContainText("5-day averages");
  await expect(drift).toContainText("Attention lapses 3.0 vs. your normal 0.4");

  await page.goto("/trends");
  await waitForData(page);
  await page.locator("fieldset label", { hasText: "Sleep duration" }).waitFor();
  await expect(page.getByTestId("trend-latest-sleepHours")).toContainText("Today 5.1 h");
  await expect(page.getByTestId("trend-latest-sleepHours")).toContainText("5-day avg 5.4");
});

test("Steppe: real NASA POWER weather, and a 'Watch' explained by the trend", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/");
  await waitForData(page);
  await page.getByTestId("mode-steppe").click();
  await page.getByTestId("lang-mn").click();
  await page.getByRole("slider", { name: "Өдөр" }).fill("17");
  const weather = page.getByTestId("steppe-weather");
  await expect(weather).toContainText("−35.2 °C");
  await expect(weather.getByTestId("real-data-badge")).toContainText("NASA-гийн бодит мэдээ");

  await page.goto("/trends");
  await waitForData(page);
  await page.getByRole("slider", { name: "Өдөр" }).fill("24");
  await page.locator("fieldset label", { hasText: "Тэс хүйтэнд гадаа байсан цаг" }).click();
  await expect(page.getByTestId("trend-reason-coldExposure")).toContainText("сүүлийн 5 хоногийн 5-д нь хэвийнээс дээгүүр");
  await expect(page.getByTestId("trend-weather")).toBeVisible();
  await page.getByTestId("mode-space").click();
  expect(problems).toEqual([]);
});

test("Learn: group by hazard, CSA radiation + Earth notes, Data & sources tab", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/learn");
  await waitForData(page);
  await page.locator("#hazard-radiation").getByRole("button", { name: "Show what we track" }).click();
  const detail = page.getByTestId("hazard-detail");
  await expect(detail).toContainText("Radiation dose today");
  await expect(detail.getByRole("link", { name: /Risk of radiation-induced cancers/i })).toHaveAttribute("href", /nasa\.gov\/reference/);
  await expect(page.getByTestId("indicator-cards").locator(":scope > li")).toHaveCount(3);
  await expect(page.getByTestId("csa-radiation")).toContainText("about 30%");
  await expect(page.getByTestId("donki-list").locator("tbody tr")).toHaveCount(7);
  await expect(page.getByTestId("earth-benefits")).toContainText("accelerated aging");

  await page.getByRole("radio", { name: "Data & sources" }).click();
  await expect(page).toHaveURL(/#data$/);
  for (const id of ["donki", "horizons", "power", "hrpHazards", "hrpRisks", "hrpResearch", "csaRadiation", "csaScience"]) {
    await expect(page.getByTestId(`source-${id}`)).toBeVisible();
  }
  await expect(page.getByTestId("source-donki")).toContainText("/api/nasa/space-weather");
  await expect(page.getByTestId("simulated-note")).toContainText("Simulated");

  // A hazard tag on an alert deep-links here with that hazard open.
  await at(page, "/alerts", "ORION-B", "70");
  await page.locator('[data-rule="behavioral-drift"]').getByTestId("hazard-tags").getByRole("link", { name: "Isolation and Confinement" }).click();
  await expect(page).toHaveURL(/\/learn#hazard-isolation$/);
  await expect(page.getByTestId("hazard-detail")).toContainText("Isolation and Confinement");
  expect(problems).toEqual([]);
});
