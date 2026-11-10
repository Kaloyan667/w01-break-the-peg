import { describe, expect, it } from "vitest";
import { crashReport, newGame, nextDay, type DayResult } from "@/engine/game";
import type { Point } from "@/engine/simulate";
import { coins, held, money, price, ratio, supply } from "./format";
import { dayLines } from "./log";
import { shareText, shareUrl } from "./share";
import { TIMELINE, dayTitle } from "./timeline";

describe("money", () => {
  it.each([
    [3e9, "$3.0B"],
    [278e6, "$278M"],
    [45.9e9, "$45.9B"],
    [1.5e12, "$1.5T"],
    [12_345, "$12K"],
    [500, "$500"],
    [0, "$0"],
  ])("writes %d as %s", (usd, text) => {
    expect(money(usd)).toBe(text);
  });
});

describe("coins", () => {
  it.each([
    [345e6, "345M"],
    [7.02e12, "7.0T"],
  ])("writes %d as %s", (n, text) => {
    expect(coins(n)).toBe(text);
  });
});

describe("supply", () => {
  it("counts normally up to 10 trillion", () => {
    expect(supply(7.02e12)).toBe("7.0T");
  });

  it("stops counting past 10 trillion, where the number only reflects the model's price floor", () => {
    expect(supply(2.02e15)).toBe("Over 10T");
  });
});

describe("price", () => {
  it.each([
    [78.55, "$78.55"],
    [1, "$1.00"],
    [0.65, "$0.65"],
    [0.0012, "$0.0012"],
    [0.000001, "$0.000001"],
  ])("writes %d as %s", (usd, text) => {
    expect(price(usd)).toBe(text);
  });
});

describe("held", () => {
  it.each([
    [85, "3.5 days"],
    [168, "7 days"],
    [24, "1 day"],
    [6, "0.3 days"],
  ])("writes %d hours as %s", (hours, text) => {
    expect(held(hours)).toBe(text);
  });
});

describe("ratio", () => {
  it.each([
    [0.012713, "0.0127"],
    [3.2149, "3.21"],
    [980.4, "980"],
    [1_500_000, "2M"],
  ])("writes %d as %s", (n, text) => {
    expect(ratio(n)).toBe(text);
  });
});

describe("the timeline", () => {
  it("has a day for each day of the game", () => {
    expect(TIMELINE).toHaveLength(7);
  });

  it("gives a source for every event", () => {
    for (const { source } of TIMELINE) expect(source.url).toMatch(/^https:\/\//);
  });

  it("names the day and the date", () => {
    expect(dayTitle(0)).toBe("Day 1 — May 7, 2022");
    expect(dayTitle(6)).toBe("Day 7 — May 13, 2022");
  });
});

describe("the day's log", () => {
  const close = { ustPrice: 0.88, lunaPrice: 41.2 } as Point;
  const base: DayResult = {
    day: 2,
    plan: { defendUsd: 0, mint: false, bluff: false },
    spentUsd: 0,
    burnedUst: 278e6,
    printedLuna: 6.2e6,
    limitUsd: 278e6,
    spiralStarted: false,
  };

  it("says what the chain burned and printed", () => {
    expect(dayLines(base, close).join(" ")).toContain("278M UST");
    expect(dayLines(base, close).join(" ")).toContain("6M LUNA");
  });

  it("gives the closing prices", () => {
    expect(dayLines(base, close).join(" ")).toContain("UST $0.88");
  });

  it("says what the bitcoin bought", () => {
    const line = dayLines({ ...base, plan: { ...base.plan, defendUsd: 3e9 }, spentUsd: 2.2e9 }, close).join(" ");
    expect(line).toContain("$2.2B");
    expect(line).toContain("$3.0B");
  });

  it("says when the bitcoin stayed in reserve", () => {
    const line = dayLines({ ...base, plan: { ...base.plan, defendUsd: 5e8 } }, close).join(" ");
    expect(line).toContain("none spent");
  });

  it("announces the spiral", () => {
    expect(dayLines({ ...base, spiralStarted: true }, close).join(" ")).toContain("death spiral");
  });
});

describe("sharing on X", () => {
  let game = newGame();
  for (let i = 0; i < 7; i++) game = nextDay(game);
  const report = crashReport(game);

  it("fits in a post next to its link", () => {
    expect(shareText(report).length).toBeGreaterThan(0);
    expect(shareText(report).length).toBeLessThanOrEqual(256);
  });

  it("opens X with the text and the link to the game", () => {
    const url = new URL(shareUrl(report));
    expect(url.hostname).toBe("x.com");
    expect(url.searchParams.get("text")).toBe(shareText(report));
    expect(url.searchParams.get("url")).toBe("https://w01.hemera.one/lab");
  });
});
