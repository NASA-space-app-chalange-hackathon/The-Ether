import { describe, expect, it } from "vitest";
import { mad, mean, median } from "./stats";

describe("stats", () => {
  it("median handles odd, even, and unsorted input", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
  it("mad is the median absolute deviation", () => {
    expect(mad([1, 2, 3, 4, 100])).toBe(1);
  });
  it("mean", () => expect(mean([1, 2, 3])).toBe(2));
  it("empty input → NaN", () => {
    expect(median([])).toBeNaN();
    expect(mad([])).toBeNaN();
    expect(mean([])).toBeNaN();
  });
});
