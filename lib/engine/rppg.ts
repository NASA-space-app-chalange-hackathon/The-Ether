/**
 * Remote photoplethysmography (rPPG) — heart rate from tiny skin-color changes.
 * Pipeline: per-frame green-channel mean of a forehead ROI → resample to FS →
 * normalize + detrend → band-pass 0.7–3.5 Hz (42–210 bpm) → Hann-windowed FFT →
 * spectral peak (parabolic interpolation) → bpm, with an SNR-based quality score.
 * Green carries the strongest pulse signal (Verkruysse et al., 2008).
 */

export interface Sample {
  /** Milliseconds (performance.now()). */
  t: number;
  /** Mean green value of the ROI (0–255). */
  g: number;
}

export const FS = 30;
export const BAND_LOW_HZ = 0.7;
export const BAND_HIGH_HZ = 3.5;
/** Below this the estimate is not trusted and the UI falls back to manual entry. Demo parameter. */
export const MIN_QUALITY = 0.3;
export const MIN_SECONDS = 8;

/** Linear-interpolate irregular samples onto a uniform FS grid. */
export function resample(samples: readonly Sample[], fs = FS): number[] {
  if (samples.length < 2) return [];
  const out: number[] = [];
  const t0 = samples[0].t;
  const t1 = samples[samples.length - 1].t;
  let j = 0;
  for (let t = t0; t <= t1; t += 1000 / fs) {
    while (j < samples.length - 2 && samples[j + 1].t < t) j++;
    const a = samples[j];
    const b = samples[j + 1];
    const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
    out.push(a.g + f * (b.g - a.g));
  }
  return out;
}

/** x/mean − 1, then subtract a centred moving average (~1 s) to remove slow lighting drift. */
export function detrend(x: readonly number[], fs = FS): number[] {
  if (x.length === 0) return [];
  const m = x.reduce((s, v) => s + v, 0) / x.length || 1;
  const n = x.map((v) => v / m - 1);
  const half = Math.round(fs / 2);
  return n.map((v, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(n.length - 1, i + half);
    let s = 0;
    for (let k = lo; k <= hi; k++) s += n[k];
    return v - s / (hi - lo + 1);
  });
}

/** 2nd-order Butterworth band-pass as high-pass + low-pass biquads (RBJ cookbook), run forward and backward (zero phase). */
export function bandpass(x: readonly number[], fs = FS, low = BAND_LOW_HZ, high = BAND_HIGH_HZ): number[] {
  const biquad = (input: number[], type: "hp" | "lp", f0: number) => {
    const w0 = (2 * Math.PI * f0) / fs;
    const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
    const cos = Math.cos(w0);
    const b = type === "lp" ? [(1 - cos) / 2, 1 - cos, (1 - cos) / 2] : [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
    const a0 = 1 + alpha;
    const a1 = -2 * cos;
    const a2 = 1 - alpha;
    const y: number[] = [];
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (const xn of input) {
      const yn = (b[0] * xn + b[1] * x1 + b[2] * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = xn; y2 = y1; y1 = yn;
      y.push(yn);
    }
    return y;
  };
  const once = (v: number[]) => biquad(biquad(v, "hp", low), "lp", high);
  return once(once([...x]).reverse()).reverse();
}

/** In-place iterative radix-2 FFT; returns power spectrum of length n/2. */
export function powerSpectrum(x: readonly number[], n: number): number[] {
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  const len = Math.min(x.length, n);
  for (let i = 0; i < len; i++) re[i] = x[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (len - 1))); // Hann
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const ang = (-2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < size / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const ar = re[i + k + size / 2] * wr - im[i + k + size / 2] * wi;
        const ai = re[i + k + size / 2] * wi + im[i + k + size / 2] * wr;
        re[i + k + size / 2] = re[i + k] - ar;
        im[i + k + size / 2] = im[i + k] - ai;
        re[i + k] += ar;
        im[i + k] += ai;
      }
    }
  }
  return Array.from({ length: n / 2 }, (_, i) => re[i] * re[i] + im[i] * im[i]);
}

export interface HeartRateEstimate {
  bpm: number | null;
  /** 0–1: share of in-band power at the peak (± 0.1 Hz) and its first harmonic. */
  quality: number;
  seconds: number;
}

export function estimateHeartRate(samples: readonly Sample[], fs = FS): HeartRateEstimate {
  const seconds = samples.length > 1 ? (samples[samples.length - 1].t - samples[0].t) / 1000 : 0;
  if (seconds < MIN_SECONDS) return { bpm: null, quality: 0, seconds };
  const signal = bandpass(detrend(resample(samples, fs), fs), fs);
  let n = 1;
  while (n < Math.max(signal.length, 2048)) n <<= 1;
  const p = powerSpectrum(signal, n);
  const hz = (i: number) => (i * fs) / n;
  const lo = Math.ceil((BAND_LOW_HZ * n) / fs);
  const hi = Math.floor((BAND_HIGH_HZ * n) / fs);
  let peak = lo;
  let total = 0;
  for (let i = lo; i <= hi; i++) {
    total += p[i];
    if (p[i] > p[peak]) peak = i;
  }
  if (total <= 0) return { bpm: null, quality: 0, seconds };
  // Parabolic interpolation around the peak bin.
  const [a, b, c] = [p[peak - 1] ?? p[peak], p[peak], p[peak + 1] ?? p[peak]];
  const offset = a - 2 * b + c === 0 ? 0 : (0.5 * (a - c)) / (a - 2 * b + c);
  const peakHz = hz(peak + offset);
  const near = (f: number) => {
    let s = 0;
    for (let i = Math.max(lo, Math.floor(((f - 0.1) * n) / fs)); i <= Math.min(hi, Math.ceil(((f + 0.1) * n) / fs)); i++) s += p[i];
    return s;
  };
  const quality = Math.min(1, (near(peakHz) + (2 * peakHz <= BAND_HIGH_HZ ? near(2 * peakHz) : 0)) / total);
  return { bpm: Math.round(peakHz * 60), quality, seconds };
}

/** Band-passed recent signal for the live waveform (last `windowS` seconds). */
export function liveWaveform(samples: readonly Sample[], windowS = 6, fs = FS): number[] {
  const end = samples.length ? samples[samples.length - 1].t : 0;
  const recent = samples.filter((s) => s.t >= end - windowS * 1000);
  if (recent.length < fs) return [];
  return bandpass(detrend(resample(recent, fs), fs), fs);
}
