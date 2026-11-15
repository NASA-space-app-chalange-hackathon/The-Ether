"use client";

import { Snowflake, ThermometerSnowflake, Wind } from "lucide-react";
import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RealDataBadge } from "@/components/ui/RealDataBadge";
import { THEME } from "@/components/ui/theme";
import { NASA_LINKS } from "@/lib/nasa/config";
import { formatDate } from "@/lib/i18n/date";
import { useMission } from "@/lib/state/DataProvider";
import { useNasa } from "@/lib/state/NasaProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { formatTemp } from "@/lib/state/useLabels";

const TICK = { fill: THEME.muted, fontSize: 10.5 };

function Source() {
  const { weather } = useNasa();
  const { locale } = useAppState();
  const t = useT();
  return (
    <div className="space-y-1">
      <RealDataBadge source="NASA POWER" href={NASA_LINKS.power} status={weather.status} />
      <p className="text-xs text-muted">
        {t("weather.site", {
          site: weather.data.site.name[locale],
          from: formatDate(weather.data.days[0]?.date ?? weather.data.replayStart, locale),
          to: formatDate(weather.data.days[weather.data.days.length - 1]?.date ?? weather.data.replayStart, locale),
        })}
      </p>
    </div>
  );
}

/** Steppe Home: today's real weather (NASA POWER, replayed) next to the herder's health. */
export function WeatherToday() {
  const t = useT();
  const { day } = useAppState();
  const { maxDay } = useMission();
  const { weather } = useNasa();
  const w = weather.data.days[Math.min(day, maxDay)];
  if (!w) return null;
  return (
    <div className="space-y-3" data-testid="steppe-weather">
      <p className="eyebrow flex items-center gap-1.5">
        <ThermometerSnowflake size={12} strokeWidth={2} />
        {t("weather.today")}
      </p>
      <dl className="grid grid-cols-3 gap-3">
        <div className="space-y-0.5">
          <dt className="text-xs text-muted">{t("weather.min")}</dt>
          <dd className="font-mono text-lg font-medium tracking-tight">{w.tMin === null ? "—" : `${formatTemp(w.tMin)} °C`}</dd>
        </div>
        <div className="space-y-0.5">
          <dt className="text-xs text-muted">{t("weather.max")}</dt>
          <dd className="font-mono text-lg font-medium tracking-tight">{w.tMax === null ? "—" : `${formatTemp(w.tMax)} °C`}</dd>
        </div>
        <div className="space-y-0.5">
          <dt className="flex items-center gap-1 text-xs text-muted">
            <Wind size={11} strokeWidth={2} />
            {t("weather.wind")}
          </dt>
          <dd className="font-mono text-lg font-medium tracking-tight">{w.wind === null ? "—" : `${w.wind.toFixed(1)} ${t("weather.windUnit")}`}</dd>
        </div>
      </dl>
      {w.tMin !== null && w.tMin <= -30 && (
        <p className="flex items-center gap-2 text-sm text-amber">
          <Snowflake size={14} strokeWidth={2} className="shrink-0" />
          {t("weather.deepCold")}
        </p>
      )}
      <Source />
    </div>
  );
}

/** Steppe Trends: real daily min/max temperature across the replayed winter, kept apart from the health charts. */
export function WeatherPanel({ from, to }: { from: number; to: number }) {
  const t = useT();
  const { weather } = useNasa();
  const { events } = useMission();
  const rows = weather.data.days
    .map((d, day) => ({ day, tMin: d.tMin, range: d.tMin !== null && d.tMax !== null ? ([d.tMin, d.tMax] as [number, number]) : null }))
    .filter((r) => r.day >= from && r.day <= to);
  const cold = events.find((e) => e.kind === "cold");
  return (
    <section className="surface space-y-3 p-4 sm:p-5" data-testid="weather-panel">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="font-medium">{t("weather.title")}</h2>
        <span className="font-mono text-xs text-muted">°C</span>
      </header>
      <div style={{ height: 180 }} className="w-full" data-testid="trend-weather">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 22, right: 12, bottom: 0, left: 0 }}>
            <XAxis dataKey="day" type="number" domain={[from, to]} allowDataOverflow tick={TICK} tickLine={false} stroke={THEME.line} tickCount={8} />
            <YAxis domain={["auto", "auto"]} tick={TICK} tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => formatTemp(v)} />
            <Area dataKey="range" name={t("weather.range")} stroke="none" fill={THEME.accent} fillOpacity={0.12} isAnimationActive={false} />
            {cold && cold.day >= from && cold.day <= to && <ReferenceLine x={cold.day} stroke={THEME.lineStrong} strokeDasharray="2 3" />}
            <ReferenceLine x={to} stroke={THEME.accent} strokeWidth={1} />
            <Line dataKey="tMin" name={t("weather.min")} stroke={THEME.fg} strokeWidth={1.5} dot={rows.length < 40 ? { r: 2, fill: THEME.fg, strokeWidth: 0 } : false} isAnimationActive={false} connectNulls />
            <Tooltip
              cursor={{ stroke: THEME.lineStrong, strokeWidth: 1 }}
              contentStyle={{ background: THEME.panel, border: `1px solid ${THEME.lineStrong}`, borderRadius: 8, color: THEME.fg, fontSize: 12 }}
              labelStyle={{ color: THEME.muted, marginBottom: 2 }}
              labelFormatter={(d) => t("clock.dayShort", { day: Number(d) })}
              formatter={(value, name) =>
                Array.isArray(value) ? [`${formatTemp(Number(value[0]))} … ${formatTemp(Number(value[1]))} °C`, name] : [`${formatTemp(Number(value))} °C`, name]
              }
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">{t("weather.note")}</p>
      <Source />
    </section>
  );
}
