import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/engine/scenarios";
import { simulate, type Point } from "@/engine/simulate";
import { allDigits, clockOf, coverOf, pressWindow } from "./press";

const { points } = simulate(SCENARIOS.asHappened.scenario);

describe("the stretch of the run the press shows", () => {
  const { first, last } = pressWindow(points);

  it("opens just before the first new LUNA matters", () => {
    expect(points[first].lunaSupply).toBeLessThan(points[0].lunaSupply * 1.01);
    expect(points[first + 1].lunaSupply).toBeGreaterThanOrEqual(points[0].lunaSupply * 1.01);
  });

  it("closes when the supply has stopped growing", () => {
    const top = Math.max(...points.map((point) => point.lunaSupply));
    expect(points[last].lunaSupply).toBe(top);
    expect(points[last - 1].lunaSupply).toBeLessThan(top);
  });
});

describe("how the press writes its numbers", () => {
  it("spells out every digit", () => {
    expect(allDigits(345e6)).toBe("345,000,000");
    expect(allDigits(7.02e12)).toBe("7,020,000,000,000");
  });

  it("reads an hour of the run as a date in May 2022", () => {
    expect(clockOf(0)).toBe("May 7, 00:00 UTC");
    expect(clockOf(85)).toBe("May 10, 13:00 UTC");
    expect(clockOf(168)).toBe("May 14, 00:00 UTC");
  });

  it("measures how much of the UST all the LUNA could back", () => {
    expect(coverOf({ lunaMarketCap: 9e9, ustSupply: 18e9 } as Point)).toBe(0.5);
  });
});
