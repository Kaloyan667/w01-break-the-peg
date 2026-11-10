"use client";

import { useEffect, useMemo, useState } from "react";
import { SCENARIOS } from "@/engine/scenarios";
import { simulate } from "@/engine/simulate";
import { percent, price } from "../lab/format";
import { PRESS } from "./copy";
import { allDigits, clockOf, coverOf, pressWindow } from "./press";
import { BUTTON, PANEL, Scene, Sources } from "./Scene";

/** How long one simulated hour stays on screen. */
const TICK_MS = 80;

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-line pt-3">
      <p className="text-sm text-fg-2">{label}</p>
      <p className="mt-1 text-xl font-[510] tabular-nums">{value}</p>
    </div>
  );
}

export function ThePress() {
  const points = useMemo(() => simulate(SCENARIOS.asHappened.scenario).points, []);
  const { first, last } = useMemo(() => pressWindow(points), [points]);
  const [hour, setHour] = useState(first);
  const [running, setRunning] = useState(false);

  const finished = hour >= last;
  const active = running && !finished;

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setHour((current) => Math.min(current + 1, last)), TICK_MS);
    return () => clearInterval(timer);
  }, [active, last]);

  const press = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHour(last);
      return;
    }
    if (finished) setHour(first);
    setRunning(finished || !running);
  };

  const label = finished ? PRESS.again : active ? PRESS.pause : hour > first ? PRESS.resume : PRESS.start;
  const point = points[hour];
  const crossed = coverOf(point) < 1;
  const lit = active ? (hour % PRESS.loop.length) : -1;

  return (
    <Scene title={PRESS.title} paragraphs={PRESS.paragraphs}>
      <div className={PANEL}>
        <ol className="flex flex-wrap gap-1.5 text-sm" aria-hidden="true">
          {PRESS.loop.map((step, index) => (
            <li key={step} className={`rounded-lg px-2.5 py-1 transition-colors ${index === lit ? "bg-signal text-bg" : "bg-fg/5 text-fg-2"}`}>
              {step}
            </li>
          ))}
        </ol>

        <p className="mt-6 text-fg-2">{PRESS.supplyLabel}</p>
        <p className="press-digits mt-1">{allDigits(point.lunaSupply)}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Reading label={PRESS.priceLabel} value={price(point.lunaPrice)} />
          <Reading label={PRESS.coverLabel} value={`${percent(coverOf(point))} of all UST`} />
          <Reading label={PRESS.clockLabel} value={clockOf(point.hour)} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button type="button" onClick={press} className={BUTTON}>
            {label}
          </button>
          {crossed && (
            <p role="status" className="text-lg font-[510] text-signal">
              {PRESS.crossed}
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 max-w-[52em] text-sm text-fg-3 text-pretty">{PRESS.note}</p>
      <Sources sources={PRESS.sources} />
    </Scene>
  );
}
