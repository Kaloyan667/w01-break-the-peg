"use client";

import { useState } from "react";
import { HORIZON_DAYS } from "@/engine/crises";
import { price } from "../lab/format";
import { useElementWidth } from "../useElementWidth";

export type Series = { id: string; label: string; curve: number[]; returned: boolean };

const HEIGHT = 320;
const MARGIN = { top: 14, right: 18, bottom: 34, left: 46 };
const TOP_PRICE = 1.05;
const GRID_PRICES = [0, 0.25, 0.5, 0.75, 1];
const GRID_DAYS = [0, 7, 14, 21];
const TOOLTIP_WIDTH = 190;

/** Every coin's price, aligned on the day it broke. Colour says how the crisis ended. */
export function CrisisChart({
  series,
  selectedId,
  description = "Eight stablecoin prices over the three weeks after each broke its peg. The table below holds the same results.",
}: {
  series: Series[];
  selectedId: string;
  description?: string;
}) {
  const [box, width] = useElementWidth(720);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 1);
  const x = (day: number) => MARGIN.left + (day / HORIZON_DAYS) * plotWidth;
  const y = (usd: number) => MARGIN.top + ((TOP_PRICE - usd) / TOP_PRICE) * (HEIGHT - MARGIN.top - MARGIN.bottom);
  const path = (curve: number[]) => curve.map((usd, day) => `${day === 0 ? "M" : "L"}${x(day).toFixed(1)} ${y(usd).toFixed(1)}`).join("");

  const ordered = [...series].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId));
  const selected = series.find(({ id }) => id === selectedId)!;
  const lastDay = selected.curve.length - 1;
  const labelOnLeft = x(lastDay) > width - 110;

  const readings =
    hoverDay === null
      ? []
      : series.flatMap(({ id, label, curve, returned }) => (curve[hoverDay] === undefined ? [] : [{ id, label, returned, value: curve[hoverDay] }])).sort((a, b) => b.value - a.value);

  const moveHover = (event: React.PointerEvent<SVGSVGElement>) => {
    const left = event.currentTarget.getBoundingClientRect().left;
    const day = Math.round(((event.clientX - left - MARGIN.left) / plotWidth) * HORIZON_DAYS);
    setHoverDay(Math.max(0, Math.min(HORIZON_DAYS, day)));
  };

  return (
    <div ref={box} className="relative">
      <svg
        role="img"
        aria-label={description}
        width={width}
        height={HEIGHT}
        onPointerMove={moveHover}
        onPointerLeave={() => setHoverDay(null)}
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
        {GRID_DAYS.map((day) => (
          <text key={day} x={x(day)} y={HEIGHT - 12} textAnchor={day === 0 ? "start" : day === HORIZON_DAYS ? "end" : "middle"} fontSize={12} fill="var(--text-3)">
            {day === 0 ? "Day 0" : day === HORIZON_DAYS ? `+${day} days` : `+${day}`}
          </text>
        ))}

        {ordered.map(({ id, curve, returned }) => {
          const isSelected = id === selectedId;
          return (
            <path
              key={id}
              d={path(curve)}
              fill="none"
              stroke={returned ? "var(--text-2)" : "var(--signal)"}
              strokeWidth={isSelected ? 2.5 : 1.5}
              strokeOpacity={isSelected ? 1 : 0.45}
              strokeDasharray={returned ? "5 4" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        <text x={x(lastDay) + (labelOnLeft ? -2 : 6)} y={y(Math.max(...selected.curve.slice(-7))) - 9} textAnchor={labelOnLeft ? "end" : "start"} fontSize={13} fontWeight={510} fill="var(--text)">
          {selected.label}
        </text>

        {hoverDay !== null && <line x1={x(hoverDay)} x2={x(hoverDay)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke="var(--text-3)" />}
      </svg>

      {hoverDay !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-line bg-surface p-3 text-sm shadow-lg"
          style={{ width: TOOLTIP_WIDTH, left: Math.max(0, Math.min(width - TOOLTIP_WIDTH, x(hoverDay) + 12)) }}
        >
          <p className="font-[510]">{hoverDay === 0 ? "The day it broke" : `${hoverDay} days later`}</p>
          {readings.map(({ id, label, value }) => (
            <p key={id} className="mt-0.5 flex justify-between gap-3 tabular-nums">
              <span className={id === selectedId ? "text-fg" : "text-fg-2"}>{label}</span>
              <span>{price(value)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
