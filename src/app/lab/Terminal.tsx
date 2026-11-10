import { useEffect, useRef } from "react";
import type { DayResult } from "@/engine/game";
import type { Point } from "@/engine/simulate";
import { money, percent } from "./format";
import { dayLines } from "./log";
import { TIMELINE, dayTitle } from "./timeline";

/** Above this the swap fee is worth mentioning: the chain is charging more than its usual minimum. */
const RAISED_FEE = 0.03;

function Bottleneck({ queueUst, limitUsd, fee }: { queueUst: number; limitUsd: number; fee: number }) {
  if (queueUst < 1e6) {
    return <p className="mt-5 text-sm text-fg-2">No UST is waiting to be sold. At its normal fee, the chain absorbs {money(limitUsd)} a day.</p>;
  }
  const share = Math.min(limitUsd / queueUst, 1);
  return (
    <div className="mt-5">
      <p className="text-sm text-fg-2">
        {money(queueUst)} of UST is waiting to be sold. At its normal fee, the chain absorbs {money(limitUsd)} a day.
        {fee > RAISED_FEE && <span className="text-signal"> The fee has climbed to {percent(fee)}.</span>}
      </p>
      <div aria-hidden className="mt-2 h-1.5 rounded-full bg-signal">
        <div className="h-full rounded-full bg-fg" style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}

/** One line of what happened that day, then the running account of the player's week. */
export function Terminal({
  day,
  point,
  limitUsd,
  results,
  points,
}: {
  day: number;
  point: Point;
  limitUsd: number;
  results: DayResult[];
  points: Point[];
}) {
  const event = TIMELINE[day];
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = log.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [results.length]);

  return (
    <section aria-label="Timeline" className="grid rounded-xl border border-line bg-surface lg:grid-cols-[1.15fr_1fr]">
      <div className="p-5">
        <h2 className="font-mono text-sm text-fg-2">{dayTitle(day)}</h2>
        <p className="mt-3 text-sm text-fg-3">That day in 2022</p>
        <p className="mt-1 text-xl font-[510] tracking-[-0.015em] text-pretty">{event.text}</p>
        <a href={event.source.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-fg-3 underline underline-offset-2 hover:text-fg-2">
          {event.source.label}
        </a>
        <Bottleneck queueUst={point.unsoldUst} limitUsd={limitUsd} fee={point.spread} />
      </div>
      <div ref={log} aria-live="polite" className="max-h-64 overflow-y-auto border-t border-line p-5 font-mono text-[13px] leading-6 text-fg-2 lg:h-60 lg:max-h-none lg:border-t-0 lg:border-l">
        {results.length === 0 ? (
          <p className="text-fg-3">Your week will be written here.</p>
        ) : (
          results.map((result) => (
            <div key={result.day} className="mb-4 last:mb-0">
              <h3 className="text-fg">{dayTitle(result.day)}</h3>
              {dayLines(result, points[(result.day + 1) * 24]).map((line) => (
                <p key={line} className={line.includes("death spiral") ? "text-signal" : undefined}>
                  {line}
                </p>
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
