import { describe, expect, it } from "vitest";
import type { DayResult } from "@/engine/game";
import type { Point } from "@/engine/simulate";
import { explainDay } from "./explain";

const point = (over: Partial<Point>) => ({ ustPrice: 1, lunaPrice: 80, lunaSupply: 300e6, lunaMarketCap: 24e9, ustSupply: 18e9, unsoldUst: 0, ...over }) as Point;
const day = (over: Partial<DayResult>): DayResult => ({
  day: 0,
  plan: { defendUsd: 0, mint: false, bluff: false },
  spentUsd: 0,
  burnedUst: 0,
  printedLuna: 0,
  limitUsd: 278e6,
  spiralStarted: false,
  ...over,
});

describe("what just happened", () => {
  it("calls a day without selling quiet", () => {
    expect(explainDay(day({}), point({}), point({}))).toContain("quiet");
  });

  it("says when selling is waiting but nobody burns yet", () => {
    const text = explainDay(day({}), point({}), point({ unsoldUst: 375e6 }));
    expect(text).toContain("$375M");
    expect(text).toContain("buyer");
  });

  it("explains how burning dilutes LUNA", () => {
    const text = explainDay(day({ burnedUst: 2e9, printedLuna: 30e6 }), point({}), point({ lunaPrice: 60, lunaSupply: 330e6, lunaMarketCap: 19.8e9, ustSupply: 16e9 }));
    expect(text).toContain("10%");
    expect(text).toContain("25%");
  });

  it("gives the cover left after a day of burning", () => {
    const text = explainDay(day({ burnedUst: 2e9 }), point({}), point({ lunaMarketCap: 16e9, ustSupply: 16e9 }));
    expect(text).toContain("100%");
  });

  it("does not print an absurd percentage when the supply explodes", () => {
    const text = explainDay(day({ burnedUst: 2e9 }), point({ lunaSupply: 1e9 }), point({ lunaSupply: 2e15, lunaPrice: 0.000001 }));
    expect(text).not.toMatch(/\d{5,}%/);
  });

  it("credits the bitcoin that was spent", () => {
    expect(explainDay(day({ spentUsd: 1.2e9 }), point({}), point({}))).toContain("$1.2B");
  });
});
