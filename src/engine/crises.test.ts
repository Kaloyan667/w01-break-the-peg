import { describe, expect, it } from "vitest";
import { CRISES, closestCrisis, curveOf, measure, runCurve, type Crisis, type CrisisDay } from "./crises";
import { curveDistance } from "./curveDistance";
import type { Point } from "./simulate";

const dayAt = (offset: number) => new Date(Date.UTC(2022, 0, 1 + offset)).toISOString().slice(0, 10);
const series = (prices: number[], extra: Partial<CrisisDay>[] = []): CrisisDay[] =>
  prices.map((price, i) => ({ day: dayAt(i), price, backing: null, supply: null, ...extra[i] }));
const crisis = (days: CrisisDay[], id = "x"): Crisis => ({
  id,
  name: "X",
  when: "Now",
  backingName: null,
  backingKind: "outside",
  story: "",
  sources: [],
  cover: null,
  days,
});

describe("the curve of a crisis", () => {
  it("starts the first day the coin closes under 97 cents", () => {
    expect(curveOf(series([1, 1, 0.9, 0.8]))).toEqual([0.9, 0.8]);
  });

  it("carries the last price over a missing day", () => {
    const days = series([0.9, 0.8, 0.7]).filter((_, i) => i !== 1);
    expect(curveOf(days)).toEqual([0.9, 0.9, 0.7]);
  });

  it("stops three weeks after the break", () => {
    expect(curveOf(series(Array(40).fill(0.5)))).toHaveLength(22);
  });

  it("is empty for a coin that never broke", () => {
    expect(curveOf(series([1, 0.99, 1]))).toEqual([]);
  });
});

describe("the measures of a crisis", () => {
  it("finds the lowest price after the break", () => {
    expect(measure(crisis(series([1, 0.9, 0.6, 0.8]))).low).toBe(0.6);
  });

  it("counts the days under 97 cents", () => {
    expect(measure(crisis(series([1, 0.9, 0.96, 0.98, 0.5]))).daysUnder).toBe(3);
  });

  it("counts the days until the coin is back at 99 cents", () => {
    expect(measure(crisis(series([1, 0.9, 0.95, 0.99, 1]))).daysToReturn).toBe(2);
  });

  it("says when the coin never came back", () => {
    expect(measure(crisis(series([1, 0.9, 0.5, 0.2]))).daysToReturn).toBeNull();
  });

  it("measures how far the backing token fell, from its level just before the break", () => {
    const days = series([1, 1, 0.9, 0.8], [{ backing: 100 }, { backing: 80 }, { backing: 50 }, { backing: 20 }]);
    expect(measure(crisis(days)).backingFell).toBeCloseTo(0.8, 10);
  });

  it("has no backing drop without a backing token", () => {
    expect(measure(crisis(series([1, 0.9]))).backingFell).toBeNull();
  });

  it("measures the share of the supply that left", () => {
    const days = series([1, 0.9, 0.9], [{ supply: 10 }, { supply: 10 }, { supply: 4 }]);
    expect(measure(crisis(days)).supplyLeft).toBeCloseTo(0.6, 10);
  });

  it("has no supply figure without a supply series", () => {
    expect(measure(crisis(series([1, 0.9]))).supplyLeft).toBeNull();
  });
});

describe("the eight crises", () => {
  const byId = (id: string) => measure(CRISES.find((c) => c.id === id)!);

  it("are all there, each with a source", () => {
    expect(CRISES).toHaveLength(8);
    for (const c of CRISES) expect(c.sources[0].url).toMatch(/^https:\/\//);
  });

  it("give a source for every statement about LUNA's cover", () => {
    const covered = CRISES.filter((c) => c.cover);
    expect(covered).toHaveLength(2);
    for (const c of covered) expect(c.cover!.source.url).toMatch(/^https:\/\//);
  });

  it("each broke the 97-cent line", () => {
    for (const c of CRISES) expect(curveOf(c.days).length).toBeGreaterThan(0);
  });

  it("show UST never coming back in 2022", () => {
    expect(byId("ust-2022").daysToReturn).toBeNull();
    expect(byId("ust-2022").low).toBeLessThan(0.2);
  });

  it("show the same machine coming back in 2021", () => {
    expect(byId("ust-2021").daysToReturn).not.toBeNull();
    expect(byId("ust-2021").low).toBeCloseTo(0.953, 2);
  });
});

describe("comparing curves", () => {
  const a = [0.9, 0.7, 0.5];
  const b = [0.95, 0.9, 0.99];

  it("finds no distance between a curve and itself", () => {
    expect(curveDistance(a, a)).toBe(0);
  });

  it("is the same in both directions", () => {
    expect(curveDistance(a, b)).toBe(curveDistance(b, a));
  });

  it("is never negative", () => {
    expect(curveDistance(a, b)).toBeGreaterThanOrEqual(0);
  });

  it.todo("tells apart two curves with the same low but a different path");
});

describe("your run against the crises", () => {
  const point = (hour: number, ustPrice: number) => ({ hour, ustPrice }) as Point;
  const hourly = (daily: number[]) => daily.flatMap((p, d) => Array.from({ length: 24 }, (_, h) => point(d * 24 + h, p)));

  it("starts at the hour UST first falls under 97 cents, then reads one price a day", () => {
    expect(runCurve(hourly([1, 0.9, 0.8]))).toEqual([0.9, 0.8]);
  });

  it("is null when the peg never broke", () => {
    expect(runCurve(hourly([1, 0.99, 1]))).toBeNull();
  });

  it("finds the crisis whose curve it copies", () => {
    const crises = [crisis(series([1, 0.9, 0.2]), "dead"), crisis(series([1, 0.96, 0.95]), "back")];
    expect(closestCrisis([0.9, 0.2], crises).id).toBe("dead");
  });
});
