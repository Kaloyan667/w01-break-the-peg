"use client";

import { useMemo, useState } from "react";
import { money, percent } from "../lab/format";
import { useElementWidth } from "../useElementWidth";
import { DOOR } from "./copy";
import { MAY_9_OUTFLOW_USD, doorPosition, feeForDailyOutflow, outflowAt } from "./door";
import { PANEL, Scene, Sources } from "./Scene";

const HEIGHT = 250;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 42 };
const TOP_FEE = 0.3;
const GRID_FEES = [0, 0.1, 0.2, 0.3];
const GRID_OUTFLOWS = [100e6, 1e9, 5e9];
const STEPS = 80;
/** The slider's starting place: $293M a day, the limit Terra's proposal quoted. */
const START_POSITION = 0.275;

/** The server and the browser disagree on the last digits of a logarithm, and the page must match. */
const rounded = (n: number) => Number(n.toFixed(1));

function FeeChart({ position, onMove }: { position: number; onMove: (position: number) => void }) {
  const [box, width] = useElementWidth(640);
  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 1);
  const x = (at: number) => MARGIN.left + at * plotWidth;
  const y = (fee: number) => MARGIN.top + (1 - fee / TOP_FEE) * (HEIGHT - MARGIN.top - MARGIN.bottom);

  const path = useMemo(() => Array.from({ length: STEPS + 1 }, (_, step) => step / STEPS), []).map((at, step) => `${step === 0 ? "M" : "L"}${x(at).toFixed(1)} ${y(feeForDailyOutflow(outflowAt(at))).toFixed(1)}`).join("");

  const may9 = doorPosition(MAY_9_OUTFLOW_USD);
  const follow = (event: React.MouseEvent<SVGSVGElement>) => {
    const left = event.currentTarget.getBoundingClientRect().left;
    onMove(Math.max(0, Math.min(1, (event.clientX - left - MARGIN.left) / plotWidth)));
  };
  // Only a press moves the dot: a mouse resting on the chart must not change it while the page scrolls.
  const drag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.buttons > 0) follow(event);
  };

  return (
    <div ref={box}>
      <svg role="img" aria-label="The fee stays at 2% up to about 293 million dollars a day, then climbs to about 28% at 5 billion." width={width} height={HEIGHT} onPointerMove={drag} onClick={follow} className="block touch-pan-y">
        {GRID_FEES.map((fee) => (
          <g key={fee}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(fee)} y2={y(fee)} stroke="var(--line)" />
            <text x={MARGIN.left - 8} y={y(fee) + 4} textAnchor="end" fontSize={12} fill="var(--text-3)">
              {percent(fee)}
            </text>
          </g>
        ))}
        {GRID_OUTFLOWS.map((usd, index) => (
          <text key={usd} x={rounded(x(doorPosition(usd)))} y={HEIGHT - 8} textAnchor={index === 0 ? "start" : index === GRID_OUTFLOWS.length - 1 ? "end" : "middle"} fontSize={12} fill="var(--text-3)">
            {money(usd)}
          </text>
        ))}
        <path d={path} fill="none" stroke="var(--text-2)" strokeWidth={2} strokeLinejoin="round" />
        <circle cx={rounded(x(may9))} cy={rounded(y(feeForDailyOutflow(MAY_9_OUTFLOW_USD)))} r={5} fill="var(--text)" stroke="var(--surface)" strokeWidth={2} />
        <text x={rounded(x(may9) - 10)} y={rounded(y(feeForDailyOutflow(MAY_9_OUTFLOW_USD)) - 8)} textAnchor="end" fontSize={13} fill="var(--text)">
          {DOOR.may9}
        </text>
        <circle cx={rounded(x(position))} cy={rounded(y(feeForDailyOutflow(outflowAt(position))))} r={7} fill="var(--signal)" stroke="var(--surface)" strokeWidth={2} />
      </svg>
    </div>
  );
}

export function TheDoor() {
  const [position, setPosition] = useState(START_POSITION);
  const outflow = outflowAt(position);

  return (
    <Scene title={DOOR.title} paragraphs={DOOR.paragraphs}>
      <div className={`${PANEL} grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]`}>
        <div>
          <label className="block">
            <span className="block text-fg-2">{DOOR.slider}</span>
            <span className="mt-1 block text-3xl font-[510] tracking-[-0.025em] tabular-nums">{money(outflow)}</span>
            <input type="range" min={0} max={1} step={0.005} value={position} onChange={(event) => setPosition(Number(event.target.value))} className="mt-2 w-full accent-[var(--signal)]" />
          </label>
          <p className="mt-6 text-fg-2">{DOOR.feeLabel}</p>
          <p className="mt-1 text-6xl font-[510] tracking-[-0.03em] text-signal tabular-nums">{percent(feeForDailyOutflow(outflow))}</p>
        </div>
        <FeeChart position={position} onMove={setPosition} />
      </div>
      <p className="mt-4 text-sm text-fg-3">{DOOR.note}</p>
      <Sources sources={DOOR.sources} />
    </Scene>
  );
}
