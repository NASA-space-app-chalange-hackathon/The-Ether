import { describe, expect, it } from "vitest";
import en from "./en.json";
import mn from "./mn.json";
import { t } from "./index";

describe("i18n", () => {
  it("mn has every key that en has, with non-empty values", () => {
    for (const key of Object.keys(en)) {
      expect(mn, `missing mn key: ${key}`).toHaveProperty(key);
      expect((mn as Record<string, string>)[key].trim()).not.toBe("");
    }
  });

  it("t() returns the locale string", () => {
    expect(t("nav.home", "en")).toBe("Mission Home");
    expect(t("nav.home", "mn")).toBe(mn["nav.home"]);
  });
});
