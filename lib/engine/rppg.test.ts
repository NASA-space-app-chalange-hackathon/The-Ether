import { describe, expect, it } from "vitest";
import { estimateHeartRate, liveWaveform, MIN_QUALITY, resample, type Sample } from "./rppg";
import { rng } from "./testUtils";

/** Synthetic camera trace: pulse sine + slow lighting drift + noise, with jittery frame timing. */
function trace(hz: number, seconds: number, opts: { amp?: number; noise?: number; seed?: number } = {}): Sample[] {
  const r = rng(opts.seed ?? 1);
  const out: Sample[] = [];
  let t = 0;
  while (t < seconds * 1000) {
    const s = t / 1000;
    const g = 120 + 4 * Math.sin(2 * Math.PI * 0.05 * s) + (opts.amp ?? 0.6) * Math.sin(2 * Math.PI * hz * s) + (r() - 0.5) * (opts.noise ?? 0.4);
    out.push({ t, g });
    t += 1000 / 30 + (r() - 0.5) * 8; // ~30 fps with jitter
  }
  return out;
}

describe("rPPG pipeline", () => {
  it("1.2 Hz synthetic pulse → 72 ± 2 bpm with good quality", () => {
    const e = estimateHeartRate(trace(1.2, 30));
    expect(e.bpm).not.toBeNull();
    expect(Math.abs(e.bpm! - 72)).toBeLessThanOrEqual(2);
    expect(e.quality).toBeGreaterThan(MIN_QUALITY);
  });

  it("tracks other rates (50 and 110 bpm)", () => {
    expect(Math.abs(estimateHeartRate(trace(50 / 60, 30, { seed: 2 })).bpm! - 50)).toBeLessThanOrEqual(2);
    expect(Math.abs(estimateHeartRate(trace(110 / 60, 30, { seed: 3 })).bpm! - 110)).toBeLessThanOrEqual(2);
  });

  it("pure noise → low quality (falls back to manual)", () => {
    const e = estimateHeartRate(trace(1.2, 30, { amp: 0, noise: 3, seed: 4 }));
    expect(e.quality).toBeLessThan(MIN_QUALITY);
  });

  it("too short → no estimate", () => expect(estimateHeartRate(trace(1.2, 4)).bpm).toBeNull());

  it("resamples onto a uniform grid and produces a live waveform", () => {
    const s = trace(1.2, 10);
    expect(resample(s).length).toBeGreaterThan(290);
    expect(liveWaveform(s).length).toBeGreaterThan(150);
  });
});
