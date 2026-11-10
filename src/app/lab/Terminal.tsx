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
    return <p className="mt-4 text-sm text-fg-2">No UST is waiting to be sold. At its normal fee, the chain absorbs {money(limitUsd)} a day.</p>;
  }
  const share = Math.min(limitUsd / queueUst, 1);
  return (
    <div className="mt-4">
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

/** The day: what really happened that day, and what has just happened in the player's own week. */
export function Story({ day, point, limitUsd, explanation }: { day: number; point: Point; limitUsd: number; explanation: string | null }) {
  const event = TIMELINE[day];
  return (
    <div className="p-5">
      <h2 className="font-mono text-sm text-fg-2">{dayTitle(day)}</h2>
      {explanation && (
        <>
          <p className="mt-3 text-sm text-fg-3">What just happened in your game</p>
          <p className="mt-1 text-pretty">{explanation}</p>
        </>
      )}
      <p className="mt-3 text-sm text-fg-3">That day in 2022</p>
      <p className="mt-1 font-[510] tracking-[-0.011em] text-pretty">
        {event.text}{" "}
        <a href={event.source.url} target="_blank" rel="noreferrer" className="text-sm font-normal text-fg-3 underline underline-offset-2 hover:text-fg-2">
          {event.source.label}
        </a>
      </p>
      <Bottleneck queueUst={point.unsoldUst} limitUsd={limitUsd} fee={point.spread} />
    </div>
  );
}

/** The running account of the player's week, in the numbers. */
export function WeekLog({ results, points }: { results: DayResult[]; points: Point[] }) {
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = log.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [results.length]);

  if (results.length === 0) return null;

  return (
    <section aria-label="Your week" className="mt-4 rounded-xl border border-line bg-surface">
      <h2 className="px-5 pt-4 font-[510]">Your week, day by day</h2>
      <div ref={log} aria-live="polite" className="max-h-56 overflow-y-auto px-5 pt-2 pb-4 font-mono text-[13px] leading-6 text-fg-2">
        {results.map((result) => (
          <div key={result.day} className="mb-4 last:mb-0">
            <h3 className="text-fg">{dayTitle(result.day)}</h3>
            {dayLines(result, points[(result.day + 1) * 24]).map((line) => (
              <p key={line} className={line.includes("death spiral") ? "text-signal" : undefined}>
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
