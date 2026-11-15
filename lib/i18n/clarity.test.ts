import { describe, expect, it } from "vitest";
import { GLOSSARY } from "@/content/glossary";
import { RULES_MN } from "@/content/rules-mn";
import { HEADLINES, RULES_SPACE_MN, RULES_STEPPE_EN, ruleText } from "@/content/rules-text";
import { expandReadings, type MissionDataset } from "@/lib/data/dataset";
import { RULES, type RuleId } from "@/lib/engine/escalation";
import { evaluateMember } from "@/lib/engine/evaluate";
import { SNAPSHOT_FEEDS } from "@/lib/nasa/feeds";
import mission from "@/public/data/mission.json";
import { alertSummary, localizeAlert } from "./alerts";
import en from "./en.json";
import mn from "./mn.json";

const LATIN_WORD = /[A-Za-z]{4,}/g;
/** Proper names and units that stay Latin in Mongolian text. */
const LATIN_OK = new Set(["NASA", "SANS", "DONKI", "GOES", "RMSSD", "mmHg", "ORION", "Horizons"]);
const latinWords = (s: string) => (s.match(LATIN_WORD) ?? []).filter((w) => !LATIN_OK.has(w));
const CYRILLIC = /[Ѐ-ӿ]/;

const readings = expandReadings(mission as unknown as MissionDataset);
const sep = SNAPSHOT_FEEDS.spaceWeather.data.events.map((e) => ({ day: e.missionDay, realDate: e.realDate, url: e.link, highEnergy: e.highEnergy }));

describe("alert text for every mode × language", () => {
  const sets = { "space·mn": RULES_SPACE_MN, "steppe·en": RULES_STEPPE_EN, "steppe·mn": RULES_MN };
  it("every set covers every rule with the engine's number of steps", () => {
    for (const [name, set] of Object.entries(sets)) {
      for (const [id, rule] of Object.entries(RULES)) {
        const text = set[id as RuleId];
        expect(text, `${name} ${id}`).toBeDefined();
        expect(text.steps, `${name} ${id}`).toHaveLength(rule.steps.length);
        expect(text.title.length * text.why.length, `${name} ${id}`).toBeGreaterThan(0);
      }
    }
  });
  it("Mongolian text has no untranslated English; English text has no Cyrillic", () => {
    for (const id of Object.keys(RULES) as RuleId[]) {
      for (const text of [RULES_SPACE_MN[id], RULES_MN[id]]) expect(latinWords([text.title, text.why, ...text.steps].join(" ")), id).toEqual([]);
      for (const text of [RULES_STEPPE_EN[id], ruleText(id, "space", "en")]) expect([text.title, text.why, ...text.steps].join(" "), id).not.toMatch(CYRILLIC);
      expect(HEADLINES[id].en).not.toMatch(CYRILLIC);
      expect(latinWords(HEADLINES[id].mn), id).toEqual([]);
    }
  });
  it("Space speaks of the crew doctor and Earth; Steppe of the family doctor and the soum hospital", () => {
    const drift = evaluateMember("orion-b", readings, 70).alerts.find((a) => a.ruleId === "behavioral-drift")!;
    expect(localizeAlert(drift, "en", "space")).toBe(drift);
    expect(localizeAlert(drift, "mn", "space").doNow.map((s) => s.text).join(" ")).toContain("Багийн эмч");
    expect(localizeAlert(drift, "en", "steppe").doNow.map((s) => s.text).join(" ")).toContain("family doctor");
    expect(localizeAlert(drift, "mn", "steppe").doNow.map((s) => s.text).join(" ")).toContain("Өрхийн эмч");
  });
  it("Space · Mongolian: alerts built from facts (radiation, exercise) are fully Mongolian", () => {
    const d40 = evaluateMember("orion-a", readings, 40, { priorDose: 20, spaceWeather: sep }).alerts.find((a) => a.ruleId === "radiation-event")!;
    expect(latinWords(localizeAlert(d40, "mn", "space").whatChanged)).toEqual([]);
    const d170 = evaluateMember("orion-d", readings, 170, { priorDose: 10 }).alerts;
    for (const a of d170) expect(latinWords(localizeAlert(a, "mn", "space").whatChanged), a.ruleId).toEqual([]);
  });
});

describe("plain alert summaries (headline + short bullets)", () => {
  it("hidden fatigue: plain headline, sleep and reaction lines, and the 'mood says fine' line", () => {
    const drift = evaluateMember("orion-b", readings, 70).alerts.find((a) => a.ruleId === "behavioral-drift")!;
    const s = alertSummary(drift, "en", "space");
    expect(s.headline).toBe("You may be more tired than you feel");
    expect(s.bullets).toHaveLength(3);
    expect(s.bullets[0]).toMatch(/^Sleep duration: 5\.4 h on average \(normal 7\.0 h\)$/);
    expect(s.bullets[2]).toContain("fine");
    const m = alertSummary(drift, "mn", "space");
    expect(m.bullets.every((b) => latinWords(b).length === 0)).toBe(true);
  });
  it("solar storm: names the real NASA event and says to stay in the shelter", () => {
    const d40 = evaluateMember("orion-a", readings, 40, { priorDose: 20, spaceWeather: sep }).alerts.find((a) => a.ruleId === "radiation-event")!;
    const s = alertSummary(d40, "en", "space");
    expect(s.headline).toBe("Solar storm: go to the shelter now");
    expect(s.bullets[0]).toContain("Jun 8, 2024");
    expect(s.bullets.at(-1)).toContain("shelter");
  });
  it("never more than 3 bullets, for every alert in the story", () => {
    for (const id of ["orion-a", "orion-b", "orion-c", "orion-d"]) {
      for (const day of [40, 70, 95, 170]) {
        for (const a of evaluateMember(id, readings, day, { spaceWeather: sep }).alerts) expect(alertSummary(a, "en", "space").bullets.length).toBeLessThanOrEqual(3);
      }
    }
  });
});

describe("glossary and UI strings", () => {
  it("every glossary term is explained in both languages", () => {
    for (const g of GLOSSARY) for (const l of ["en", "mn"] as const) expect(g.term[l].length * g.short[l].length, g.id).toBeGreaterThan(0);
  });
  it("Mongolian UI strings contain no untranslated English words", () => {
    const allowed = new Set([...LATIN_OK, "Ether", "Space", "Apps", "JPL", "SpO"]);
    const bad = Object.entries(mn).flatMap(([k, v]) => ((v as string).replace(/\{\w+\}/g, "").match(LATIN_WORD) ?? []).filter((w) => !allowed.has(w)).map((w) => `${k}: ${w}`));
    expect(bad).toEqual([]);
  });
  it("English UI strings contain no Cyrillic", () => {
    expect(Object.entries(en).filter(([, v]) => CYRILLIC.test(v as string)).map(([k]) => k)).toEqual([]);
  });
});
