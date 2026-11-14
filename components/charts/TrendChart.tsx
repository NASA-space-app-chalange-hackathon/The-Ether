"use client";

import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MissionEvent } from "@/lib/data/dataset";
import type { SeriesPoint } from "@/lib/engine/evaluate";
import { INDICATORS } from "@/lib/engine/indicators";
import type { IndicatorId } from "@/lib/engine/types";
import { useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";

export interface TrendChartProps {
  indicator: IndicatorId;
  series: readonly SeriesPoint[];
  from: number;
  to: number;
  today: number;
  events?: readonly MissionEvent[];
  height?: number;
  compact?: boolean;
}

interface Row {
  day: number;
  value: number | null;
  band: [number, number] | null;
}

/** Indicator over time with the personal baseline band (mean ± 2 SD), event markers, and a "today" line. */
export function TrendChart({ indicator, series, from, to, today, events = [], height = 220, compact = false }: TrendChartProps) {
  const t = useT();
  const labels = useLabels();
  const meta = INDICATORS[indicator];
  const rows: Row[] = series
    .filter((p) => p.day >= from && p.day <= to)
    .map((p) => ({
      day: p.day,
      value: p.value,
      band: p.center !== null && p.spread !== null ? [p.center - 2 * p.spread, p.center + 2 * p.spread] : null,
    }));
  const fmt = (v: number) => v.toFixed(meta.decimals);

  return (
    <div style={{ height }} className="w-full" data-testid={`trend-${indicator}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 18, right: 12, bottom: 0, left: compact ? -16 : 0 }}>
          <XAxis
            dataKey="day"
            type="number"
            domain={[from, to]}
            allowDataOverflow
            tick={{ fill: "#8b98b8", fontSize: 11 }}
            stroke="#1e2a47"
            tickCount={compact ? 4 : 8}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#8b98b8", fontSize: 11 }}
            stroke="#1e2a47"
            width={compact ? 44 : 52}
            tickFormatter={fmt}
          />
          <Area
            dataKey="band"
            name={t("chart.baseline")}
            stroke="none"
            fill="#38bdf8"
            fillOpacity={0.14}
            isAnimationActive={false}
            connectNulls={false}
          />
          {events
            .filter((e) => e.day >= from && e.day <= to)
            .map((e) => (
              <ReferenceLine
                key={`${e.kind}-${e.day}`}
                x={e.day}
                stroke="#64748b"
                strokeDasharray="3 3"
                label={{ value: e.icon, position: "top", fontSize: 12 }}
              />
            ))}
          <ReferenceLine x={today} stroke="#38bdf8" strokeWidth={1.5} label={compact ? undefined : { value: t("chart.today"), position: "insideTopRight", fill: "#38bdf8", fontSize: 11 }} />
          <Line
            dataKey="value"
            name={labels.indicator(indicator)}
            stroke="#e6ecf8"
            strokeWidth={1.75}
            dot={rows.length < 40 ? { r: 2.5, fill: "#e6ecf8" } : false}
            isAnimationActive={false}
            connectNulls
          />
          <Tooltip
            contentStyle={{ background: "#0b1326", border: "1px solid #1e2a47", borderRadius: 8, color: "#e6ecf8" }}
            labelFormatter={(d) => t("clock.dayOf", { day: Number(d), max: to })}
            formatter={(value, name) =>
              Array.isArray(value)
                ? [`${fmt(Number(value[0]))} – ${fmt(Number(value[1]))} ${meta.unit}`, name]
                : [`${fmt(Number(value))} ${meta.unit}`, name]
            }
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
