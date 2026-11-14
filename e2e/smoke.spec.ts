import { expect, test } from "@playwright/test";
import { ROUTES } from "../components/ui/routes";
import { waitForData, watchForProblems } from "./helpers";

for (const route of ROUTES) {
  test(`route ${route.href} opens cleanly`, async ({ page }) => {
    const problems = watchForProblems(page);
    await page.goto(route.href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Not a medical device")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await waitForData(page);
    expect(problems).toEqual([]);
  });
}
