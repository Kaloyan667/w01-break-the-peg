// The opening scene: the screen is a tank, and scrolling drains it along UST's real price.

import history from "@/data/may-2022.json";
import { OPENING_LINES } from "./copy";

/** The low of May 9, reported by CoinDesk. The daily snapshots miss it: they are taken near midnight. */
export const MAY_9_LOW = 0.65;

const snapshot = (day: number) => history.days[day].ustPrice;
const dateOf = (day: number) => `May ${7 + day}, 2022`;

const PATH = [
  { tick: 0, date: dateOf(0), price: snapshot(0) },
  { tick: 0, date: dateOf(0), price: snapshot(0) },
  { tick: 1, date: dateOf(1), price: snapshot(1) },
  { tick: 2, date: dateOf(2), price: MAY_9_LOW },
  { tick: 3, date: dateOf(3), price: snapshot(3) },
  { tick: 4, date: dateOf(4), price: snapshot(4) },
  { tick: 5, date: dateOf(5), price: snapshot(5) },
  { tick: 6, date: dateOf(6), price: snapshot(6) },
  { tick: 7, date: dateOf(7), price: snapshot(7) },
];

export const STOPS = PATH.map((stop, index) => ({ ...stop, ...OPENING_LINES[index] }));

/** The share of each step spent resting on a real price before moving to the next one. */
const HOLD = 0.45;
/** Extra scrolling, in steps, that keeps the last stop on screen before the scene leaves. */
const END_PAUSE = 0.4;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** What the screen shows when the reader is `progress` of the way through the scene, from 0 to 1. */
export function readOpening(progress: number): { price: number; stop: number } {
  const last = STOPS.length - 1;
  const position = Math.min(clamp(progress, 0, 1) * (last + END_PAUSE), last);
  const index = Math.floor(position);
  const next = Math.min(index + 1, last);
  const moved = smooth(clamp((position - index - HOLD) / (1 - HOLD), 0, 1));
  return {
    price: STOPS[index].price + (STOPS[next].price - STOPS[index].price) * moved,
    stop: moved > 0.5 ? next : index,
  };
}
