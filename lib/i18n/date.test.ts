import { describe, expect, it } from "vitest";
import { formatDate } from "./date";

describe("formatDate", () => {
  it("formats English and Mongolian", () => {
    expect(formatDate("2026-12-28T08:00:00Z", "en")).toBe("Dec 28, 2026");
    expect(formatDate("2026-12-28T08:00:00Z", "mn")).toBe("2026 оны 12-р сарын 28");
  });
});
