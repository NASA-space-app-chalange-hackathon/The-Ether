import { describe, expect, it } from "vitest";
import en from "@/lib/i18n/en.json";
import { DEMO_STEPS, scrubPath } from "./demo";

describe("demo story", () => {
  it("hits the storyline days 1 → 40 → 70 → 95 and ends on the end card", () => {
    expect(DEMO_STEPS.filter((s) => s.mode === "space").map((s) => s.day).slice(0, 4)).toEqual([1, 40, 70, 95]);
    expect(DEMO_STEPS.at(-1)?.caption).toBe("demo.end");
    for (const s of DEMO_STEPS) expect(en).toHaveProperty(s.caption);
  });
  it("fits a ~30 s video", () => {
    const total = DEMO_STEPS.reduce((ms, s) => ms + s.holdMs, 0);
    expect(total).toBeLessThanOrEqual(30_000);
  });
  it("scrubs monotonically to the target", () => {
    const p = scrubPath(1, 40);
    expect(p.at(-1)).toBe(40);
    expect([...p].sort((a, b) => a - b)).toEqual(p);
  });
});
