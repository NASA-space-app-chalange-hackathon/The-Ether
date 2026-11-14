import type { Page } from "@playwright/test";

/** Collect console errors, hydration warnings, and uncaught exceptions on a page. */
export function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" || /hydrat/i.test(text)) problems.push(`[console.${msg.type()}] ${text}`);
  });
  page.on("pageerror", (err) => problems.push(`[pageerror] ${err.message}`));
  return problems;
}

/** Wait until the seeded data is loaded and the Mission Clock is showing. */
export async function waitForData(page: Page): Promise<void> {
  await page.getByTestId("clock-day").waitFor({ state: "visible", timeout: 15_000 });
}
