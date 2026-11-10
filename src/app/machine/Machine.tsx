"use client";

import { useMemo, useState } from "react";
import { LAST_BLOCK, MACHINE_SCENARIO, NEUTRAL_DIALS, machineAt, momentsOf, withDials, type Dials, type MachineState } from "@/engine/machine";
import { BLOCKS_PER_DAY } from "@/engine/market";
import { ToolNav } from "../ToolNav";
import { coins, money, percent, price, ratio } from "../lab/format";
import { blockSteps, timeOfBlock, type Step } from "./steps";

const HOUR = BLOCKS_PER_DAY / 24;
const SECOND_WAVE = Math.round(MACHINE_SCENARIO.shocks[1].day * BLOCKS_PER_DAY);

const DIALS: { key: keyof Dials; label: string }[] = [
  { key: "depth", label: "How much UST the market can absorb" },
  { key: "anchorFlight", label: "How fast deposits leave Anchor" },
  { key: "panicThreshold", label: "How large a discount it takes for full panic" },
];

const button =
  "rounded-[10px] border border-line px-3 py-2 text-sm font-[510] transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:opacity-50";

function Hidden({ label, value, note, alert = false }: { label: string; value: string; note: string; alert?: boolean }) {
  return (
    <div>
      <p className="text-sm text-fg-2">{label}</p>
      <p className={`mt-1 text-2xl font-[510] tracking-[-0.02em] tabular-nums ${alert ? "text-signal" : "text-fg"}`}>{value}</p>
      <p className="mt-1 text-sm text-fg-3 text-pretty">{note}</p>
    </div>
  );
}

function Loop({ name, cells, end }: { name: string; cells: [string, string][]; end: string }) {
  return (
    <div>
      <h3 className="font-[510]">{name}</h3>
      <ol className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
        {cells.map(([label, value], index) => (
          <li key={label} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden className="text-fg-3">→</span>}
            <span className="rounded-lg border border-line bg-surface px-2.5 py-1.5">
              <span className="text-fg-2">{label} </span>
              <span className="font-[510] tabular-nums">{value}</span>
            </span>
          </li>
        ))}
        <li className="text-fg-3">{end}</li>
      </ol>
    </div>
  );
}

function Loops({ state }: { state: MachineState }) {
  const { world, trace, cover } = state;
  return (
    <section aria-label="The two loops" className="grid gap-5 border-b border-line py-5">
      <Loop name="The bank run" cells={[["UST price", price(trace.priceClose)], ["Panic", percent(world.panic)], ["UST for sale", money(world.unsold)]]} end="and back to the price" />
      <Loop
        name="The printing press"
        cells={[
          ["UST burned so far", coins(world.ustBurned)],
          ["LUNA supply", coins(world.lunaSupply)],
          ["LUNA value", money(world.lunaPrice * world.lunaSupply)],
          ["Cover", percent(cover)],
          ["Market depth", money(trace.depthUsd)],
        ]}
        end="and back to the price"
      />
    </section>
  );
}

function StepRow({ step, number }: { step: Step; number: number }) {
  return (
    <li className="grid grid-cols-[1.5rem_1fr] gap-x-2 border-t border-line py-3 first:border-t-0">
      <span className="text-sm text-fg-3 tabular-nums">{number}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="font-[510]">{step.title}</h3>
          <span className={`text-sm ${step.source === "Assumption" ? "text-fg-3" : "text-signal"}`}>{step.source}</span>
        </div>
        <p className="mt-1 font-mono text-[13px] break-words text-fg-2">{step.formula}</p>
        <p className="font-mono text-[13px] break-words text-fg-3">{step.numbers}</p>
        <p className="mt-1 text-sm text-pretty">{step.result}</p>
      </div>
    </li>
  );
}

export function Machine() {
  const [dials, setDials] = useState(NEUTRAL_DIALS);
  const [block, setBlock] = useState(SECOND_WAVE);

  const scenario = useMemo(() => withDials(MACHINE_SCENARIO, dials), [dials]);
  const moments = useMemo(() => momentsOf(scenario), [scenario]);
  const state = useMemo(() => machineAt(scenario, block), [scenario, block]);
  const steps = useMemo(() => blockSteps(state.trace, scenario), [state, scenario]);

  const crossing = moments.find(({ label }) => label.includes("100%"));
  const go = (next: number) => setBlock(Math.max(0, Math.min(LAST_BLOCK, next)));

  return (
    <main data-surface="terminal" className="mx-auto max-w-5xl px-6 pt-1 pb-24">
      <ToolNav />
      <h1 className="text-2xl font-[510] tracking-[-0.025em]">What the chain does every six seconds</h1>
      <p className="mt-1 mb-4 text-fg-2 text-pretty">A holder only ever sees the price. Underneath, the same nine steps repeat 14,400 times a day.</p>

      <section aria-label="Time" className="flex flex-wrap items-center gap-2 border-y border-line py-3">
        <p className="mr-2 font-mono text-sm">
          Block {block.toLocaleString("en-US")}, {timeOfBlock(block)}
        </p>
        <button type="button" className={button} onClick={() => go(block - 1)} disabled={block === 0}>
          Previous block
        </button>
        <button type="button" className={button} onClick={() => go(block + 1)} disabled={block === LAST_BLOCK}>
          Next block
        </button>
        <button type="button" className={button} onClick={() => go(block + HOUR)} disabled={block === LAST_BLOCK}>
          One hour
        </button>
        <button type="button" className={button} onClick={() => go(block + BLOCKS_PER_DAY)} disabled={block === LAST_BLOCK}>
          One day
        </button>
      </section>

      <section aria-label="Moments" className="flex flex-wrap gap-2 py-3">
        {moments.map((moment) => (
          <button key={moment.label} type="button" onClick={() => go(moment.block)} aria-pressed={block === moment.block} className={`${button} ${block === moment.block ? "bg-fg/10" : ""}`}>
            {moment.label}
          </button>
        ))}
      </section>

      <section aria-label="What a holder does not see" className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-line py-4 lg:grid-cols-5">
        <Hidden label="UST price" value={price(state.trace.priceClose)} note="All a holder sees" alert={state.trace.priceClose < 0.97} />
        <Hidden label="UST for sale" value={money(state.world.unsold)} note="Looking for a buyer" />
        <Hidden label="Next swap's fee" value={percent(state.fee)} note="What the next UST burned would pay" alert={state.fee > 0.03} />
        <Hidden label="LUNA per UST burned" value={ratio(state.lunaPerUst)} note="New coins for each UST" />
        <Hidden label="LUNA cover" value={percent(state.cover)} note="All the LUNA against all the UST" alert={state.cover < 1} />
      </section>

      <Loops state={state} />

      <div className="grid gap-8 pt-5 lg:grid-cols-[1.6fr_1fr]">
        <section aria-label="This block, step by step">
          <h2 className="text-lg font-[510]">This block, step by step</h2>
          <ol className="mt-1">
            {steps.map((step, index) => (
              <StepRow key={step.title} step={step} number={index + 1} />
            ))}
          </ol>
        </section>

        <section aria-label="Assumptions">
          <h2 className="text-lg font-[510]">Change the assumptions</h2>
          <p className="mt-1 text-sm text-fg-2 text-pretty">These are guesses about people. Terra&apos;s rules are not on the dials.</p>
          <div className="mt-4 grid gap-4">
            {DIALS.map(({ key, label }) => (
              <label key={key} className="block text-sm">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-fg-2">{label}</span>
                  <span className="font-[510] tabular-nums">×{dials[key].toFixed(2)}</span>
                </span>
                <input type="range" min={0.25} max={3} step={0.05} value={dials[key]} onChange={(event) => setDials({ ...dials, [key]: Number(event.target.value) })} className="mt-1 w-full accent-[var(--signal)]" />
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm" role="status">
            {crossing ? `With these assumptions, LUNA falls under 100% of UST on ${timeOfBlock(crossing.block)}.` : "With these assumptions, LUNA keeps covering UST all week."}
          </p>
          <button type="button" className={`${button} mt-3`} onClick={() => setDials(NEUTRAL_DIALS)}>
            Reset the assumptions
          </button>
        </section>
      </div>

      <p className="mt-8 max-w-[52em] text-sm text-fg-3 text-pretty">
        Steps tagged in orange are Terra&apos;s own code and the reserve, whose total is real but whose pace is tuned. Steps tagged in grey are assumptions tuned to the daily data of May 2022. The 2% minimum fee is the default in
        Terra&apos;s code, with no dated record for May 2022.
      </p>
    </main>
  );
}
