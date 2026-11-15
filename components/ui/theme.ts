/**
 * Hex mirror of the CSS tokens in app/globals.css, for SVG attributes and Recharts
 * (which can't read CSS custom properties reliably). Keep both in sync.
 */
export const THEME = {
  bg: "#0a0a0b",
  panel: "#111113",
  panel2: "#18181b",
  line: "#232327",
  lineStrong: "#34343a",
  fg: "#ededef",
  muted: "#8b8b93",
  accent: "#7c9cff",
  ok: "#3fcf8e",
  amber: "#f5a524",
  red: "#f26464",
  grey: "#7a7a83",
} as const;
