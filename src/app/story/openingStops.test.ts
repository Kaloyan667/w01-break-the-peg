import { describe, expect, it } from "vitest";
import history from "@/data/may-2022.json";
import { MAY_9_LOW, STOPS, readOpening } from "./openingStops";

const snapshots = history.days.map((day) => day.ustPrice);

describe("the stops of the opening", () => {
  it("starts on the real price of May 7 and ends on the real price of May 14", () => {
    expect(STOPS[0].price).toBe(snapshots[0]);
    expect(STOPS.at(-1)!.price).toBe(snapshots[7]);
  });

  it("only rests on real prices: a daily snapshot, or the low CoinDesk reported on May 9", () => {
    for (const stop of STOPS) expect([...snapshots, MAY_9_LOW]).toContain(stop.price);
  });

  it("walks through the eight days in order", () => {
    const ticks = STOPS.map((stop) => stop.tick);
    expect(ticks).toEqual([...ticks].sort((a, b) => a - b));
    expect(new Set(ticks).size).toBe(8);
  });

  it("gives every stop a sentence and a source", () => {
    for (const stop of STOPS) {
      expect(stop.text.length).toBeGreaterThan(0);
      expect(stop.source.url).toMatch(/^https:/);
    }
  });
});

describe("reading the scroll", () => {
  it("rests on the first stop at the top of the page", () => {
    expect(readOpening(0)).toEqual({ price: STOPS[0].price, stop: 0 });
  });

  it("rests on the last stop at the bottom of the scene", () => {
    expect(readOpening(1)).toEqual({ price: STOPS.at(-1)!.price, stop: STOPS.length - 1 });
  });

  it("holds exactly still on a stop, so a real price is what stays on screen", () => {
    const justAfterStop3 = (3 + 0.2) / (STOPS.length - 0.6);
    expect(readOpening(justAfterStop3)).toEqual({ price: STOPS[3].price, stop: 3 });
  });

  it("moves between two stops", () => {
    const halfway = (3 + 0.75) / (STOPS.length - 0.6);
    const { price } = readOpening(halfway);
    expect(price).toBeGreaterThan(Math.min(STOPS[3].price, STOPS[4].price));
    expect(price).toBeLessThan(Math.max(STOPS[3].price, STOPS[4].price));
  });

  it("ignores scrolling past either end", () => {
    expect(readOpening(-1)).toEqual(readOpening(0));
    expect(readOpening(2)).toEqual(readOpening(1));
  });
});
