"use client";

import { useState } from "react";
import { CRISES, curveOf, measure } from "@/engine/crises";
import { percent } from "../lab/format";
import { CrisisChart, type Series } from "../patterns/CrisisChart";
import { BREAKING_POINT } from "./copy";
import { PANEL, Scene, Sources } from "./Scene";

const years = ["ust-2021", "ust-2022"].map((id) => {
  const crisis = CRISES.find((candidate) => candidate.id === id)!;
  return { crisis, measures: measure(crisis) };
});

const series: Series[] = years.map(({ crisis, measures }) => ({
  id: crisis.id,
  label: `UST ${crisis.when.split(" ").pop()}`,
  curve: curveOf(crisis.days),
  returned: measures.daysToReturn !== null,
}));

function outcome(daysToReturn: number | null): string {
  return daysToReturn === null ? "Not back after three weeks" : `Back at 99 cents after ${daysToReturn} days`;
}

export function BreakingPoint() {
  const [selectedId, setSelectedId] = useState("ust-2021");
  const { crisis, measures } = years.find((year) => year.crisis.id === selectedId)!;

  return (
    <Scene title={BREAKING_POINT.title} paragraphs={BREAKING_POINT.paragraphs}>
      <div className={PANEL}>
        <div role="group" aria-label="Pick a year" className="flex gap-1 text-sm">
          {years.map((year) => {
            const selected = year.crisis.id === selectedId;
            return (
              <button
                key={year.crisis.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedId(year.crisis.id)}
                className={`rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${selected ? "bg-fg/10 font-[510] text-fg" : "text-fg-2 hover:text-fg"}`}
              >
                {year.crisis.when}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <CrisisChart series={series} selectedId={selectedId} description="UST's price over the three weeks after it broke, in May 2021 and in May 2022." />
        </div>

        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="border-t border-line pt-3">
            <dt className="text-sm text-fg-2">The price</dt>
            <dd className="mt-1 text-lg font-[510] text-pretty">{outcome(measures.daysToReturn)}</dd>
          </div>
          <div className="border-t border-line pt-3">
            <dt className="text-sm text-fg-2">LUNA lost</dt>
            <dd className="mt-1 text-lg font-[510] tabular-nums">{percent(measures.backingFell ?? 0)} of its value</dd>
          </div>
          <div className="border-t border-line pt-3">
            <dt className="text-sm text-fg-2">All the LUNA against all the UST</dt>
            <dd className="mt-1 text-lg font-[510] text-pretty first-letter:uppercase">{crisis.cover?.text}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 text-sm text-fg-3">{BREAKING_POINT.note}</p>
      <Sources sources={[...crisis.sources, ...(crisis.cover ? [crisis.cover.source] : [])]} />
    </Scene>
  );
}
