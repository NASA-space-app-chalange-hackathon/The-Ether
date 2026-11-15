"use client";

import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EVENT_ICON } from "@/components/ui/icons";
import { THEME } from "@/components/ui/theme";
import type { MissionEvent } from "@/lib/data/dataset";
import type { SeriesPoint } from "@/lib/engine/evaluate";
import { INDICATORS } from "@/lib/engine/indicators";
import type { IndicatorId } from "@/lib/engine/types";
import { useAppState, useT } from "@/lib/state/useAppState";
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

const TICK = { fill: THEME.muted, fontSize: 10.5 };
const EVENT_ICON_SIZE = 12;

/** A small line icon above an event's reference line. */
function EventMarker({ viewBox, event, mode }: { viewBox?: unknown; event: MissionEvent; mode: "space" | "steppe" }) {
  const Icon = EVENT_ICON[mode][event.kind];
  const vb = viewBox as { x?: number; y?: number } | undefined;
  const x = (vb?.x ?? 0) - EVENT_ICON_SIZE / 2;
  const y = (vb?.y ?? 0) - EVENT_ICON_SIZE - 4;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <Icon width={EVENT_ICON_SIZE} height={EVENT_ICON_SIZE} color={THEME.muted} strokeWidth={2} />
    </g>
  );
}

/** Indicator over time with the personal baseline band (mean ± 2 SD), event markers, and a "today" line. */
export function TrendChart({ indicator, series, from, to, today, events = [], height = 220, compact = false }: TrendChartProps) {
  const t = useT();
  const labels = useLabels();
  const { mode } = useAppState();
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
        <ComposedChart data={rows} margin={{ top: 22, right: 12, bottom: 0, left: compact ? -16 : 0 }}>
          <XAxis
            dataKey="day"
            type="number"
            domain={[from, to]}
            allowDataOverflow
            tick={TICK}
            tickLine={false}
            stroke={THEME.line}
            tickCount={compact ? 4 : 8}
          />
          <YAxis domain={["auto", "auto"]} tick={TICK} tickLine={false} axisLine={false} width={compact ? 44 : 52} tickFormatter={fmt} />
          <Area dataKey="band" name={t("chart.baseline")} stroke="none" fill={THEME.accent} fillOpacity={0.1} isAnimationActive={false} connectNulls={false} />
          {events
            .filter((e) => e.day >= from && e.day <= to)
            .map((e) => (
              <ReferenceLine
                key={`${e.kind}-${e.day}`}
                x={e.day}
                stroke={THEME.lineStrong}
                strokeDasharray="2 3"
                label={{ position: "top", content: (props: { viewBox?: unknown }) => <EventMarker viewBox={props.viewBox} event={e} mode={mode} /> }}
              />
            ))}
          <ReferenceLine
            x={today}
            stroke={THEME.accent}
            strokeWidth={1}
            label={compact ? undefined : { value: t("chart.today"), position: "insideTopRight", fill: THEME.accent, fontSize: 10.5 }}
          />
          <Line
            dataKey="value"
            name={labels.indicator(indicator)}
            stroke={THEME.fg}
            strokeWidth={1.5}
            dot={rows.length < 40 ? { r: 2, fill: THEME.fg, strokeWidth: 0 } : false}
            activeDot={{ r: 3.5, fill: THEME.fg, stroke: THEME.bg, strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls
          />
          <Tooltip
            cursor={{ stroke: THEME.lineStrong, strokeWidth: 1 }}
            contentStyle={{
              background: THEME.panel,
              border: `1px solid ${THEME.lineStrong}`,
              borderRadius: 8,
              color: THEME.fg,
              fontSize: 12,
              boxShadow: "0 8px 24px rgb(0 0 0 / 0.45)",
            }}
            labelStyle={{ color: THEME.muted, marginBottom: 2 }}
            labelFormatter={(d) => t("clock.dayOf", { day: Number(d), max: to })}
            formatter={(value, name) =>
              Array.isArray(value) ? [`${fmt(Number(value[0]))} – ${fmt(Number(value[1]))} ${meta.unit}`, name] : [`${fmt(Number(value))} ${meta.unit}`, name]
            }
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
