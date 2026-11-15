import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, parseStored } from "./store";

describe("parseStored", () => {
  it("falls back to defaults for missing or malformed data", () => {
    expect(parseStored(null)).toEqual(DEFAULT_STATE);
    expect(parseStored("{not json")).toEqual(DEFAULT_STATE);
  });
  it("keeps valid fields and repairs invalid ones", () => {
    const s = parseStored(JSON.stringify({ mode: "steppe", environment: "moon", day: { space: 95.4, steppe: -3 } }));
    expect(s.mode).toBe("steppe");
    expect(s.environment).toBe("transit");
    expect(s.day).toEqual({ space: 95, steppe: 0 });
    expect(s.memberId).toEqual(DEFAULT_STATE.memberId);
    expect(s.introDismissed).toBe(false);
  });
  it("first visit opens on day 70 with ORION-B; a dismissed banner stays dismissed", () => {
    expect(DEFAULT_STATE.day.space).toBe(70);
    expect(DEFAULT_STATE.memberId.space).toBe("orion-b");
    expect(parseStored(JSON.stringify({ introDismissed: true })).introDismissed).toBe(true);
  });
});
