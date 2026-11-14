import { describe, expect, it } from "vitest";
import { REGION_IDS } from "@/lib/engine/regions";
import { SOURCES } from "@/lib/engine/sources";
import { HAZARDS, REGION_CONTENT } from "./risks";

describe("content/risks", () => {
  it("lists NASA HRP's five hazards", () => {
    expect(HAZARDS.map((h) => h.name)).toEqual([
      "Space Radiation",
      "Isolation and Confinement",
      "Distance from Earth",
      "Gravity Fields",
      "Hostile/Closed Environments",
    ]);
  });
  it("every body region has content and at least one HRP risk link", () => {
    for (const id of REGION_IDS) {
      expect(REGION_CONTENT[id].risks.length).toBeGreaterThan(0);
      expect(REGION_CONTENT[id].function.length).toBeGreaterThan(10);
    }
  });
  it("every non-demo source has an https URL", () => {
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https:\/\//);
  });
});
