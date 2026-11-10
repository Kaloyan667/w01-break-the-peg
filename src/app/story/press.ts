// The stretch of the simulated week when the printing press runs, and how to write its numbers.

import type { Point } from "@/engine/simulate";

/** The press starts counting once the supply of LUNA has grown by this much. */
const NOTICEABLE_GROWTH = 1.01;
const RUN_START = Date.UTC(2022, 4, 7);
const HOUR_MS = 3_600_000;

/** From the last calm hour to the hour the supply of LUNA stops growing. */
export function pressWindow(points: Point[]): { first: number; last: number } {
  const start = points[0].lunaSupply;
  const first = points.findIndex((point) => point.lunaSupply >= start * NOTICEABLE_GROWTH) - 1;
  const top = Math.max(...points.map((point) => point.lunaSupply));
  return { first, last: points.findIndex((point) => point.lunaSupply === top) };
}

export const allDigits = (n: number) => Math.round(n).toLocaleString("en-US");

export function clockOf(hour: number): string {
  const time = new Date(RUN_START + hour * HOUR_MS);
  return `May ${time.getUTCDate()}, ${String(time.getUTCHours()).padStart(2, "0")}:00 UTC`;
}

export const coverOf = ({ lunaMarketCap, ustSupply }: Point) => lunaMarketCap / ustSupply;
