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
    expect(s.introDismissed).toEqual({ space: false, steppe: false });
    expect(s.locale).toBe("en");
  });
  it("first visit opens on day 70 with ORION-B; a dismissed banner stays dismissed", () => {
    expect(DEFAULT_STATE.day.space).toBe(70);
    expect(DEFAULT_STATE.memberId.space).toBe("orion-b");
    // Older saves stored one boolean; it now applies to both modes' intros.
    expect(parseStored(JSON.stringify({ introDismissed: true })).introDismissed).toEqual({ space: true, steppe: true });
    expect(parseStored(JSON.stringify({ introDismissed: { space: true } })).introDismissed).toEqual({ space: true, steppe: false });
  });
  it("language is independent of mode and defaults to English", () => {
    expect(DEFAULT_STATE.locale).toBe("en");
    expect(parseStored(JSON.stringify({ mode: "steppe" })).locale).toBe("en");
    expect(parseStored(JSON.stringify({ mode: "space", locale: "mn" })).locale).toBe("mn");
    expect(parseStored(JSON.stringify({ locale: "fr" })).locale).toBe("en");
  });
});
