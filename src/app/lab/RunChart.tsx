"use client";

import { useState } from "react";
import history from "@/data/may-2022.json";
import type { Point } from "@/engine/simulate";
import { useElementWidth } from "../useElementWidth";
import { price } from "./format";

const HEIGHT = 150;
const MARGIN = { top: 12, right: 44, bottom: 24, left: 44 };
const LAST_HOUR = 168;
const TOP_PRICE = 1.05;
const GRID_PRICES = [0, 0.5, 1];
const AXIS_HOURS = [0, 72, 168];
const TOOLTIP_WIDTH = 150;

const REAL = history.days.map(({ day, ustPrice }) => ({ hour: day * 24, usd: ustPrice }));
const dateAt = (hour: number) => `May ${7 + Math.round(hour / 24)}`;

/** The player's UST against the real one. It is redrawn hour by hour as a day plays out. */
export function RunChart({ points }: { points: Point[] }) {
  const [box, width] = useElementWidth(440);
  const [hover, setHover] = useState<number | null>(null);

  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 1);
  const x = (hour: number) => MARGIN.left + (hour / LAST_HOUR) * plotWidth;
  const y = (usd: number) => MARGIN.top + ((TOP_PRICE - usd) / TOP_PRICE) * (HEIGHT - MARGIN.top - MARGIN.bottom);
  const line = (series: { hour: number; usd: number }[]) => series.map(({ hour, usd }, i) => `${i === 0 ? "M" : "L"}${x(hour).toFixed(1)} ${y(usd).toFixed(1)}`).join("");

  const you = points.map(({ hour, ustPrice }) => ({ hour, usd: ustPrice }));
  const now = you[you.length - 1];
  const lastReal = REAL[REAL.length - 1];
  const hoveredYou = hover === null ? undefined : you[hover];
  const hoveredReal = hover === null ? undefined : REAL[Math.round(hover / 24)];

  const moveHover = (event: React.PointerEvent<SVGSVGElement>) => {
    const left = event.currentTarget.getBoundingClientRect().left;
    const hour = Math.round(((event.clientX - left - MARGIN.left) / plotWidth) * LAST_HOUR);
    setHover(Math.max(0, Math.min(LAST_HOUR, hour)));
  };

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-2">
        <span className="font-[510] text-fg">UST price</span>
        <span className="flex items-center gap-1.5">
          <svg aria-hidden width="20" height="4">
            <line x1="0" x2="20" y1="2" y2="2" stroke="var(--text)" strokeWidth="2" />
          </svg>
          You
        </span>
        <span className="flex items-center gap-1.5">
          <svg aria-hidden width="20" height="4">
            <line x1="0" x2="20" y1="2" y2="2" stroke="var(--signal)" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          What really happened
        </span>
      </div>

      <div ref={box} className="relative overflow-hidden">
        <svg
          role="img"
          aria-label={`UST at ${price(now.usd)} in your game on ${dateAt(now.hour)}. In 2022 it ended the week at ${price(lastReal.usd)}.`}
          width={width}
          height={HEIGHT}
          onPointerMove={moveHover}
          onPointerLeave={() => setHover(null)}
          className="block touch-pan-y"
        >
          {GRID_PRICES.map((usd) => (
            <g key={usd}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(usd)} y2={y(usd)} stroke="var(--line)" />
              <text x={MARGIN.left - 8} y={y(usd) + 4} textAnchor="end" fontSize={12} fill="var(--text-3)">
                ${usd.toFixed(2)}
              </text>
            </g>
          ))}
          {AXIS_HOURS.map((hour) => (
            <text key={hour} x={x(hour)} y={HEIGHT - 6} textAnchor={hour === 0 ? "start" : hour === LAST_HOUR ? "end" : "middle"} fontSize={12} fill="var(--text-3)">
              {dateAt(hour)}
            </text>
          ))}

          <path d={line(REAL)} fill="none" stroke="var(--signal)" strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
          <text x={x(lastReal.hour) + 6} y={y(lastReal.usd) + 4} fontSize={12} fill="var(--text-2)">
            2022
          </text>

          <path d={line(you)} fill="none" stroke="var(--text)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={x(now.hour)} cy={y(now.usd)} r={4} fill="var(--text)" stroke="var(--surface)" strokeWidth={2} />

          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke="var(--text-3)" />}
        </svg>

        {hover !== null && (
          <div className="pointer-events-none absolute top-1 rounded-lg border border-line bg-surface p-2.5 text-sm shadow-lg" style={{ width: TOOLTIP_WIDTH, left: Math.max(0, Math.min(width - TOOLTIP_WIDTH, x(hover) + 10)) }}>
            <p className="font-[510]">{dateAt(hover)}</p>
            <p className="flex justify-between tabular-nums">
              <span className="text-fg-2">You</span>
              <span>{hoveredYou ? price(hoveredYou.usd) : "Not yet"}</span>
            </p>
            {hoveredReal && (
              <p className="flex justify-between tabular-nums">
                <span className="text-fg-2">2022</span>
                <span>{price(hoveredReal.usd)}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
