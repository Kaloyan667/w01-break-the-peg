// Eight real crises read with the same grid. Everything here is computed from src/data/crises.json,
// which holds one price a day: intraday lows do not show.

import data from "@/data/crises.json";
import { curveDistance } from "./curveDistance";
import type { Point } from "./simulate";

export type CrisisDay = { day: string; price: number; backing: number | null; supply: number | null };
export type Source = { label: string; url: string };

export type Crisis = {
  id: string;
  name: string;
  when: string;
  backingName: string | null;
  /** Whether the coin leans on a token of its own, partly, or on assets from outside. */
  backingKind: "own" | "part" | "outside";
  story: string;
  sources: Source[];
  cover: { text: string; source: Source } | null;
  days: CrisisDay[];
};

export type Measures = {
  low: number;
  daysUnder: number;
  /** Days from the break until the coin closes at 99 cents again, or null if it never did. */
  daysToReturn: number | null;
  /** The share of the backing token's value lost, from just before the break to its lowest. */
  backingFell: number | null;
  /** The share of the supply gone by the end of the window. Negative when the supply grew. */
  supplyLeft: number | null;
};

export const CRISES = data.crises as unknown as Crisis[];

/** A coin has broken its peg the first day it closes under this. */
export const BREAK_PRICE = 0.97;
const RETURN_PRICE = 0.99;
/** Every measure looks this many days past the break, so that each crisis gets the same window. */
export const HORIZON_DAYS = 21;
const LOOKBACK_DAYS = 3;
const DAY_MS = 86_400_000;

const breakIndex = (days: CrisisDay[]) => days.findIndex((d) => d.price < BREAK_PRICE);

/** The coin's price every day from the break on. A missing day repeats the last known price. */
export function curveOf(days: CrisisDay[]): number[] {
  const breakAt = breakIndex(days);
  if (breakAt < 0) return [];
  const start = Date.parse(days[breakAt].day);
  const end = Date.parse(days[days.length - 1].day);
  const curve: number[] = [];
  let next = breakAt;
  let last = days[breakAt].price;
  for (let t = 0; t <= HORIZON_DAYS && start + t * DAY_MS <= end; t++) {
    while (next < days.length && Date.parse(days[next].day) <= start + t * DAY_MS) last = days[next++].price;
    curve.push(last);
  }
  return curve;
}

export function measure({ days }: Crisis): Measures {
  const curve = curveOf(days);
  const breakAt = breakIndex(days);
  const window = days.slice(breakAt, breakAt + HORIZON_DAYS + 1);
  const returned = curve.findIndex((price, day) => day > 0 && price >= RETURN_PRICE);

  const before = days.slice(Math.max(0, breakAt - LOOKBACK_DAYS), breakAt + 1).flatMap((d) => (d.backing === null ? [] : [d.backing]));
  const during = window.flatMap((d) => (d.backing === null ? [] : [d.backing]));
  const backingFell = before.length && during.length ? 1 - Math.min(...during) / Math.max(...before) : null;

  const supplies = window.flatMap((d) => (d.supply === null ? [] : [d.supply]));
  const supplyLeft = supplies.length > 1 ? 1 - supplies[supplies.length - 1] / supplies[0] : null;

  return {
    low: Math.min(...curve),
    daysUnder: curve.filter((price) => price < BREAK_PRICE).length,
    daysToReturn: returned < 0 ? null : returned,
    backingFell,
    supplyLeft,
  };
}

/** A player's week as a curve like the crises': one price a day from the moment UST broke. */
export function runCurve(points: Point[]): number[] | null {
  const breakAt = points.findIndex((p) => p.ustPrice < BREAK_PRICE);
  if (breakAt < 0) return null;
  const curve: number[] = [];
  for (let i = breakAt; i < points.length; i += 24) curve.push(points[i].ustPrice);
  return curve;
}

export function closestCrisis(curve: number[], crises: Crisis[]): Crisis {
  const distance = (crisis: Crisis) => curveDistance(curve, curveOf(crisis.days));
  return crises.reduce((best, crisis) => (distance(crisis) < distance(best) ? crisis : best));
}
