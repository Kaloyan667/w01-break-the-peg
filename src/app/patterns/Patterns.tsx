"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { HORIZON_DAYS, curveOf, type Crisis } from "@/engine/crises";
import { ToolNav } from "../ToolNav";
import { percent, price } from "../lab/format";
import { CrisisChart, type Series } from "./CrisisChart";
import { crisisRows, findings, type Row } from "./findings";

const label = (crisis: Crisis) => `${crisis.name} ${crisis.when.split(" ").pop()}`;
const noSubscribe = () => () => {};
const hashOfPage = () => window.location.hash.slice(1);

const BACKING_KIND: Record<Crisis["backingKind"], string> = {
  own: "Its own token",
  part: "Partly its own token",
  outside: "Outside assets",
};

const returnText = (days: number | null) => (days === null ? "Never" : days === 1 ? "After 1 day" : `After ${days} days`);
const supplyText = (left: number | null) => (left === null ? "No data" : left < 0 ? `Grew ${percent(-left)}` : percent(left));

export function Patterns() {
  const rows = useMemo<Row[]>(() => crisisRows(), []);
  const series = useMemo<Series[]>(() => rows.map(({ crisis, measures }) => ({ id: crisis.id, label: label(crisis), curve: curveOf(crisis.days), returned: measures.daysToReturn !== null })), [rows]);

  const hash = useSyncExternalStore(noSubscribe, hashOfPage, () => "");
  const [picked, setPicked] = useState<string | null>(null);
  const selectedId = picked ?? (rows.some(({ crisis }) => crisis.id === hash) ? hash : "ust-2022");
  const selected = rows.find(({ crisis }) => crisis.id === selectedId)!.crisis;

  return (
    <main data-surface="terminal" className="mx-auto max-w-5xl px-6 pt-1 pb-24">
      <ToolNav />
      <h1 className="text-2xl font-[510] tracking-[-0.025em]">Eight times a dollar broke</h1>
      <p className="mt-1 mb-5 text-fg-2 text-pretty">The same three weeks, measured the same way, starting the first day each coin closed under 97 cents.</p>

      <section aria-label="The curves">
        <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-fg-2">
          <span className="flex items-center gap-2">
            <svg aria-hidden width="24" height="4">
              <line x1="0" x2="24" y1="2" y2="2" stroke="var(--signal)" strokeWidth="2" />
            </svg>
            Not back within three weeks
          </span>
          <span className="flex items-center gap-2">
            <svg aria-hidden width="24" height="4">
              <line x1="0" x2="24" y1="2" y2="2" stroke="var(--text-2)" strokeWidth="2" strokeDasharray="5 4" />
            </svg>
            Came back to 99 cents
          </span>
        </div>
        <CrisisChart series={series} selectedId={selectedId} />
      </section>

      <section aria-label="Selected crisis" className="mt-2 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-[510]">
          {selected.name}, {selected.when}
        </h2>
        <p className="mt-1 text-fg-2 text-pretty">{selected.story}</p>
        {selected.cover && (
          <p className="mt-1 text-pretty">
            LUNA&apos;s cover of UST {selected.cover.text}{" "}
            <a href={selected.cover.source.url} target="_blank" rel="noreferrer" className="text-sm text-fg-3 underline underline-offset-2 hover:text-fg-2">
              {selected.cover.source.label}
            </a>
          </p>
        )}
        <p className="mt-2 flex flex-wrap gap-x-3 text-sm text-fg-3">
          {selected.sources.map(({ label: name, url }) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg-2">
              {name}
            </a>
          ))}
        </p>
      </section>

      <section aria-label="The grid" className="mt-8">
        <h2 className="text-lg font-[510]">The same grid for all eight</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm tabular-nums">
            <thead>
              <tr className="text-fg-2">
                <th scope="col" className="py-2 pr-4 font-normal">Crisis</th>
                <th scope="col" className="py-2 pr-4 font-normal">Backed by</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">Lowest close</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">Days under 97¢</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">Back at 99¢</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">Backing token fell</th>
                <th scope="col" className="py-2 text-right font-normal">Supply gone</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ crisis, measures }) => (
                <tr key={crisis.id} aria-selected={crisis.id === selectedId} className={`border-t border-line ${crisis.id === selectedId ? "bg-fg/5" : ""}`}>
                  <th scope="row" className="py-2 pr-4 font-normal">
                    <button
                      type="button"
                      onClick={() => setPicked(crisis.id)}
                      className="rounded text-left font-[510] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                    >
                      {crisis.name}, {crisis.when}
                    </button>
                  </th>
                  <td className="py-2 pr-4 text-fg-2">
                    {BACKING_KIND[crisis.backingKind]}
                    {crisis.backingName && ` (${crisis.backingName})`}
                  </td>
                  <td className="py-2 pr-4 text-right">{price(measures.low)}</td>
                  <td className="py-2 pr-4 text-right">{measures.daysUnder}</td>
                  <td className={`py-2 pr-4 text-right ${measures.daysToReturn === null ? "text-signal" : ""}`}>{returnText(measures.daysToReturn)}</td>
                  <td className="py-2 pr-4 text-right">{measures.backingFell === null ? "No token" : percent(measures.backingFell)}</td>
                  <td className="py-2 text-right">{supplyText(measures.supplyLeft)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="What repeats" className="mt-8 max-w-[46em]">
        <h2 className="text-lg font-[510]">What repeats</h2>
        <ul className="mt-2 grid gap-2 text-pretty">
          {findings(rows).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <p className="mt-8 max-w-[52em] text-sm text-fg-3 text-pretty">
        Eight crises are too few for a rule: a ninth could break any line above. All of this looks only {HORIZON_DAYS} days past each break, and USDN later sank anyway. One price a day hides what happens inside the day: USDC traded below 87 cents on March 11, 2023.
        Daily prices and supply from DefiLlama. LUNA&apos;s value in May 2021 uses CoinMarketCap&apos;s weekly circulating supply, interpolated between snapshots.
      </p>
    </main>
  );
}
