import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Crisis } from "@/engine/crises";
import type { CrashReport } from "@/engine/game";
import { held, money, price, supply } from "./format";
import { shareUrl } from "./share";

const VERDICT: Record<CrashReport["outcome"], string> = {
  spiral: "before all the LUNA was worth less than all the UST.",
  held: "and at the end UST was back at its peg, with LUNA still covering it.",
  limped: "and LUNA still covers UST, but UST never got back to a dollar.",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-2.5">
      <dt className="text-fg-2">{label}</dt>
      <dd className="font-[510] tabular-nums">{value}</dd>
    </div>
  );
}

export function CrashCard({ report, modelHours, closest, onRestart }: { report: CrashReport; modelHours: number | null; closest: Crisis | null; onRestart: () => void }) {
  const card = useRef<HTMLElement>(null);

  useEffect(() => {
    card.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <article ref={card} aria-label="Crash report" className="mt-4 grid gap-8 rounded-xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-2">
      <div className="flex flex-col">
        <h2 className="text-fg-2">Crash report</h2>
        <p className="mt-4 text-6xl font-[510] tracking-[-0.03em] tabular-nums">{held(report.hoursHeld)}</p>
        <p className="mt-3 text-lg text-pretty">{VERDICT[report.outcome]}</p>
        {modelHours !== null && <p className="mt-3 text-sm text-fg-3">In this model, the real May 2022 lasted {held(modelHours)}.</p>}
        {closest && (
          <p className="mt-1 text-sm text-fg-3">
            Your curve looks most like{" "}
            <Link href={`/patterns#${closest.id}`} className="text-fg-2 underline underline-offset-2 hover:text-fg">
              {closest.name}, {closest.when}
            </Link>
            . That compares shapes and predicts nothing.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 lg:mt-auto lg:pt-6">
          <a
            href={shareUrl(report)}
            target="_blank"
            rel="noreferrer"
            className="rounded-[10px] bg-fg px-4 py-2.5 font-[510] text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            Share on X
          </a>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-[10px] border border-line px-4 py-2.5 font-[510] transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            Play again
          </button>
        </div>
      </div>
      <div>
        <dl className="border-b border-line">
          <Row label="Value erased" value={money(Math.max(report.capitalErasedUsd, 0))} />
          <Row label="Bitcoin spent" value={money(report.reserveSpentUsd)} />
          <Row label="UST closed at" value={price(report.last.ustPrice)} />
          <Row label="LUNA closed at" value={price(report.last.lunaPrice)} />
          <Row label="LUNA supply" value={supply(report.last.lunaSupply)} />
        </dl>
        <p className="mt-3 text-sm text-fg-3">Every figure on this card comes from your simulated week.</p>
      </div>
    </article>
  );
}
