import { expect, test, type Page } from "@playwright/test";

/** Collect console errors, hydration warnings, and uncaught exceptions on a page. */
function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" || /hydrat/i.test(text)) problems.push(`[console.${msg.type()}] ${text}`);
  });
  page.on("pageerror", (err) => problems.push(`[pageerror] ${err.message}`));
  return problems;
}

test("home opens with shell, disclaimer, and nav", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Not a medical device")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  expect(problems).toEqual([]);
});
