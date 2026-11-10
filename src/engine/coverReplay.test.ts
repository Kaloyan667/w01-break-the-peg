import { describe, expect, it } from "vitest";
import history from "@/data/may-2022.json";
import { COLUMNS, coverRows, toCsv, type HistoryDay } from "./coverReplay";
import { SCENARIOS } from "./scenarios";
import { simulate, type Point } from "./simulate";

const daily = (days: [number, number][]): Point[] =>
  days.flatMap(([lunaMarketCap, ustSupply], day) =>
    Array.from({ length: 24 }, (_, h) => ({ hour: day * 24 + h, lunaMarketCap, ustSupply, ustPrice: 1, lunaPrice: 2, lunaSupply: 3 }) as Point),
  );
const past = (n: number): HistoryDay[] => Array.from({ length: n }, (_, day) => ({ date: `2022-05-0${day + 1}`, day, ustPrice: 0.9, lunaPrice: 50, ustSupply: 7 }));

describe("c and k for each day", () => {
  const rows = coverRows(daily([[30, 20], [24, 18], [12, 15]]), past(3));

  it("divides all the LUNA by all the UST", () => {
    expect(rows.map((r) => r.c)).toEqual([1.5, 24 / 18, 12 / 15]);
  });

  it("divides the fall in LUNA's value by the fall in the UST supply, day on day", () => {
    expect(rows[1].k).toBe(6 / 2);
    expect(rows[2].k).toBe(12 / 3);
  });

  it("has no k on the first day", () => {
    expect(rows[0].k).toBeNull();
  });

  it("has no k when the UST supply did not fall", () => {
    expect(coverRows(daily([[30, 20], [24, 20]]), past(2))[1].k).toBeNull();
  });

  it("flags every day where k is above c", () => {
    const mixed = coverRows(daily([[30, 20], [29.9, 19], [24, 18]]), past(3));
    expect(mixed[1].kAboveC).toBe(false);
    expect(mixed[2].kAboveC).toBe(true);
  });

  it("marks only the first of those days", () => {
    expect(rows.map((r) => r.firstKAboveC)).toEqual([false, true, false]);
  });

  it("copies the real data next to the model's", () => {
    expect(rows[1]).toMatchObject({ realUstPrice: 0.9, realLunaPrice: 50, realUstSupply: 7, modelLunaCap: 24, modelUstSupply: 18 });
  });
});

describe("the replay of May 2022", () => {
  const rows = coverRows(simulate(SCENARIOS.asHappened.scenario).points, history.days);

  it("has one row per day of the data", () => {
    expect(rows.map((r) => r.date)).toEqual(history.days.map((d) => d.date));
  });

  it("has a first day where k is above c", () => {
    expect(rows.filter((r) => r.firstKAboveC)).toHaveLength(1);
  });

  it("has k above c exactly on the days the cover ratio falls", () => {
    rows.slice(1).forEach((row, i) => {
      if (row.k !== null) expect(row.kAboveC).toBe(row.c < rows[i].c);
    });
  });
});

describe("the CSV", () => {
  const rows = coverRows(daily([[30, 20], [24, 18]]), past(2));
  const lines = toCsv(rows).trim().split("\n");

  it("has a header and one line per day", () => {
    expect(lines).toHaveLength(3);
    expect(lines[0].split(",")).toEqual(COLUMNS.map((c) => c.name));
  });

  it("leaves k empty when it is undefined", () => {
    const k = COLUMNS.findIndex((c) => c.name === "model_k");
    expect(lines[1].split(",")[k]).toBe("");
  });

  it("names each column after where it comes from", () => {
    for (const { name, origin } of COLUMNS) {
      if (origin === "real") expect(name.startsWith("real_")).toBe(true);
      if (origin === "model") expect(name.startsWith("model_")).toBe(true);
    }
  });

  it("says where every column comes from", () => {
    for (const { origin, detail } of COLUMNS) {
      expect(["real", "model", "index"]).toContain(origin);
      expect(detail.length).toBeGreaterThan(0);
    }
  });
});
