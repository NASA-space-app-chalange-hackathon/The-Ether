"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { CircleCheck, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { getDB, type GroundMessage } from "@/lib/db/schema";
import { arrivalTime, composeGroundMessage } from "@/lib/engine/message";
import { formatDelay } from "@/lib/engine/signal";
import { useSignalDelay } from "@/lib/state/NasaProvider";
import type { Alert } from "@/lib/engine/types";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";

/** Wall clock that ticks every second while any deadline is still in the future. */
function useNow(deadlines: readonly number[]): number {
  const [now, setNow] = useState(() => Date.now());
  const pending = deadlines.some((d) => d > now);
  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [pending]);
  return now;
}

function SentMessage({ msg, now }: { msg: GroundMessage; now: number }) {
  const t = useT();
  const remaining = Math.max(0, (msg.arrivesAt - Math.max(now, msg.sentAt)) / 1000);
  const total = Math.max(1, (msg.arrivesAt - msg.sentAt) / 1000);
  const time = new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <li className="space-y-2 rounded-lg border border-line bg-bg/60 p-3" data-testid="ground-sent">
      <p className="font-mono text-xs text-muted">{t("ground.sent", { time })}</p>
      {remaining > 0 ? (
        <>
          <p className="flex items-baseline gap-2">
            <span className="text-sm">{t("ground.arrivesIn")}</span>
            <span className="font-mono text-2xl font-medium tracking-tight text-accent" data-testid="ground-countdown">
              {formatDelay(remaining)}
            </span>
          </p>
          <div className="track h-1">
            <div
              className="absolute inset-0 origin-left bg-accent transition-transform duration-1000 ease-linear"
              style={{ transform: `scaleX(${Math.max(0, 1 - remaining / total)})` }}
            />
          </div>
        </>
      ) : (
        <p className="flex items-center gap-2 text-sm font-medium text-ok">
          <CircleCheck size={14} strokeWidth={2.25} />
          {t("ground.arrived")}
        </p>
      )}
    </li>
  );
}

export function MessageToGround({ alert, memberName, completed }: { alert: Alert; memberName: string; completed: readonly string[] }) {
  const t = useT();
  const { mode, locale } = useAppState();
  const labels = useLabels();
  const [draft, setDraft] = useState<string | null>(null);
  const composed = composeGroundMessage({ alert, memberName, completed, locale, label: labels.indicator });
  const delay = useSignalDelay(alert.day).oneWaySeconds;
  const sent = useLiveQuery(() => getDB().messages.where("alertId").equals(alert.id).sortBy("sentAt"), [alert.id]) ?? [];
  const now = useNow(sent.map((m) => m.arrivesAt));

  const send = async () => {
    const sentAt = Date.now();
    await getDB().messages.add({
      memberId: alert.memberId,
      alertId: alert.id,
      missionDay: alert.day,
      body: draft ?? composed,
      sentAt,
      arrivesAt: arrivalTime(sentAt, delay),
    });
    setDraft(null);
  };

  return (
    <section className="space-y-4 rounded-xl border border-accent/25 bg-accent/[0.04] p-4 sm:p-5" data-testid="ground-composer">
      <div className="space-y-1">
        <h4 className="flex items-center gap-2 font-medium text-accent">
          <Send size={15} strokeWidth={2} />
          {t(mode === "steppe" ? "ground.titleSteppe" : "ground.title")}
        </h4>
        {mode === "space" && <p className="text-sm text-fg/80">{t("ground.delayIfSent", { delay: formatDelay(delay), round: formatDelay(delay * 2) })}</p>}
      </div>
      <label className="block space-y-1.5">
        <span className="eyebrow">{t("ground.label")}</span>
        <textarea value={draft ?? composed} onChange={(e) => setDraft(e.target.value)} rows={8} className="field block w-full p-3 font-mono text-xs leading-relaxed" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={send} className="btn btn-primary">
          {t("ground.send")}
          <Send size={14} strokeWidth={2} />
        </button>
        <p className="text-xs text-muted">{t("ground.local")}</p>
      </div>
      {sent.length > 0 && (
        <ul className="space-y-2">
          {sent.map((m) => (
            <SentMessage key={m.id} msg={m} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}
