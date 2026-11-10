import { describe, expect, it } from "vitest";
import history from "@/data/may-2022.json";
import { BLOCKS_PER_DAY, MAY_2022_MARKET } from "./market";
import { SCENARIOS, withOverrides } from "./scenarios";
import { buyUstBack, createWorld, findMinimumReserve, marketPrice, runBlock, simulate, type Point, type Scenario } from "./simulate";

const asHappened = SCENARIOS.asHappened.scenario;
const quiet: Scenario = { ...asHappened, shocks: [] };

describe("running the chain one block at a time", () => {
  const byHand = (scenario: Scenario) => {
    const world = createWorld(scenario);
    const points: Point[] = [];
    const perBlock = scenario.reserve.maxSpendPerDayUsd / BLOCKS_PER_DAY;
    for (let block = 0; block <= scenario.days * BLOCKS_PER_DAY; block++) runBlock(world, scenario, points, perBlock);
    return points;
  };

  it("gives exactly the points of a full run", () => {
    expect(byHand(asHappened)).toEqual(simulate(asHappened).points);
  });

  it("reports what the reserve spent in the block", () => {
    const world = createWorld(asHappened);
    world.unsold = 8e9;
    const spent = runBlock(world, asHappened, [], 1e6);
    expect(spent).toBeCloseTo(1e6, 0);
    expect(world.reserveUsd).toBeCloseTo(asHappened.reserve.usd - 1e6, 0);
  });

  it("spends nothing without a budget", () => {
    const world = createWorld(asHappened);
    world.unsold = 8e9;
    expect(runBlock(world, asHappened, [], 0)).toBe(0);
  });
});

describe("a calm market", () => {
  it("holds the peg when nobody sells", () => {
    expect(simulate(quiet).outcome.minUstPrice).toBeGreaterThan(0.999);
  });

  it("burns nothing when nobody sells", () => {
    expect(simulate(quiet).outcome.ustBurned).toBe(0);
  });
});

describe("the arbitrage", () => {
  const smallShock: Scenario = {
    ...quiet,
    shocks: [{ day: 0, ustSold: 1.5e9 }],
    behavior: { ...quiet.behavior, anchorFleePerDay: 0, walletFleePerDay: 0 },
  };

  it("restores the peg after a small sale", () => {
    expect(simulate(smallShock).outcome.finalUstPrice).toBeGreaterThan(0.97);
  });

  it("removes burned UST from the supply", () => {
    const { points, outcome } = simulate(smallShock);
    expect(smallShock.start.ustSupply - points.at(-1)!.ustSupply).toBeCloseTo(outcome.ustBurned, 0);
  });

  it("prints LUNA for every UST burned", () => {
    const { points } = simulate(smallShock);
    expect(points.at(-1)!.lunaSupply).toBeGreaterThan(points[0].lunaSupply);
  });

  it("burns more on the first day with a deeper virtual pool", () => {
    const bigShock: Scenario = { ...quiet, shocks: [{ day: 0, ustSold: 3e9 }], behavior: { ...quiet.behavior, anchorFleePerDay: 0, walletFleePerDay: 0 } };
    const deeper: Scenario = { ...bigShock, market: { ...MAY_2022_MARKET, basePoolSdr: 200e6 } };
    const firstDay = (scenario: Scenario) => simulate(scenario).points[24];
    expect(firstDay(deeper).ustSupply).toBeLessThan(firstDay(bigShock).ustSupply);
  });
});

describe("May 2022", () => {
  const { outcome, points } = simulate(asHappened);

  it("breaks the peg", () => {
    expect(outcome.finalUstPrice).toBeLessThan(0.4);
  });

  it("wipes LUNA out", () => {
    expect(outcome.finalLunaPrice).toBeLessThan(0.01);
  });

  it("prints LUNA by the trillion", () => {
    expect(points.at(-1)!.lunaSupply).toBeGreaterThan(1e12);
  });

  it("puts LUNA's value under UST's before the end", () => {
    expect(outcome.spiralHour).not.toBeNull();
  });

  it("spends the reserve", () => {
    expect(points.at(-1)!.reserveUsd).toBeLessThan(asHappened.reserve.usd * 0.05);
  });

  it.each(history.days.slice(0, 7))("stays near the real UST price on $date", ({ day, ustPrice }) => {
    expect(Math.abs(points[day * 24].ustPrice - ustPrice)).toBeLessThan(0.3);
  });

  it.each(history.days.slice(0, 7))("stays near the real supply on $date", ({ day, ustSupply }) => {
    expect(Math.abs(points[day * 24].ustSupply - ustSupply) / ustSupply).toBeLessThan(0.1);
  });
});

describe("the end of the chain", () => {
  const collapse: Scenario = {
    ...asHappened,
    chainHaltDay: null,
    days: 30,
    shocks: [{ day: 0, ustSold: 15e9 }],
    behavior: { ...asHappened.behavior, lunaSellImpact: 1e6 },
  };

  it("stays a number when LUNA is worth almost nothing", () => {
    for (const point of simulate(collapse).points) {
      expect(Number.isFinite(point.lunaPrice)).toBe(true);
      expect(Number.isFinite(point.lunaSupply)).toBe(true);
    }
  });

  it("freezes the UST supply once the chain has halted", () => {
    const { points } = simulate({ ...collapse, chainHaltDay: 1 });
    const running = simulate(collapse).points;
    expect(points[3 * 24].ustSupply).toBe(points[25].ustSupply);
    expect(running[3 * 24].ustSupply).toBeLessThan(running[25].ustSupply);
  });
});

describe("the rescues", () => {
  it("a run is survived with every UST backed by a dollar", () => {
    expect(simulate(SCENARIOS.fullyBacked.scenario).outcome.survived).toBe(true);
  });

  it("a bigger reserve never leaves the peg lower", () => {
    const low = simulate({ ...asHappened, reserve: { ...asHappened.reserve, usd: 1e9 } });
    const high = simulate({ ...asHappened, reserve: { ...asHappened.reserve, usd: 8e9 } });
    expect(high.outcome.minUstPrice).toBeGreaterThanOrEqual(low.outcome.minUstPrice);
  });

  it("finds a reserve that saves the peg, and one just under it that does not", () => {
    const fast = SCENARIOS.fastReserve.scenario;
    const needed = findMinimumReserve(fast);
    expect(needed).not.toBeNull();
    const at = (usd: number) => simulate({ ...fast, reserve: { ...fast.reserve, usd } }).outcome.survived;
    expect(at(needed!)).toBe(true);
    expect(at(needed! * 0.9)).toBe(false);
  });
});

it("gives the same answer twice", () => {
  expect(simulate(asHappened)).toEqual(simulate(asHappened));
});

describe("withOverrides", () => {
  it("changes the reserve the reader picked", () => {
    expect(withOverrides(asHappened, { reserveUsd: 9e9 }).reserve.usd).toBe(9e9);
  });

  it("changes the pool the reader picked", () => {
    const changed = withOverrides(asHappened, { basePoolSdr: 75e6, poolRecoveryBlocks: 12 });
    expect(changed.market.basePoolSdr).toBe(75e6);
    expect(changed.market.poolRecoveryBlocks).toBe(12);
  });

  it("leaves everything else alone", () => {
    expect(withOverrides(asHappened, {})).toEqual(asHappened);
  });
});

describe("buyUstBack", () => {
  const depthUsd = 2e9;

  it("pays about the market price for a small purchase", () => {
    const price = marketPrice(3e9, depthUsd);
    const { boughtUst } = buyUstBack({ unsold: 3e9, budgetUsd: 1000, depthUsd, stopPrice: 1 });
    expect(boughtUst).toBeCloseTo(1000 / price, 0);
  });

  it("pays more as its own buying lifts the price", () => {
    const start = marketPrice(9e9, depthUsd);
    const { boughtUst } = buyUstBack({ unsold: 9e9, budgetUsd: 1e9, depthUsd, stopPrice: 1 });
    expect(boughtUst).toBeLessThan(1e9 / start);
  });

  it("never spends more than its budget", () => {
    expect(buyUstBack({ unsold: 9e9, budgetUsd: 1e9, depthUsd, stopPrice: 1 }).spentUsd).toBeCloseTo(1e9, 0);
  });

  it("stops once the price is back at its target", () => {
    const { boughtUst } = buyUstBack({ unsold: 3e9, budgetUsd: 50e9, depthUsd, stopPrice: 0.97 });
    expect(marketPrice(3e9 - boughtUst, depthUsd)).toBeCloseTo(0.97, 2);
  });
});

it("cannot absorb a wave larger than the reserve", () => {
  const fast = SCENARIOS.fastReserve.scenario;
  const largeWave: Scenario = { ...fast, shocks: [{ day: 1, ustSold: 3e9 }] };
  expect(simulate(largeWave).outcome.survived).toBe(false);
});

it("does not count a peg bought by destroying LUNA as a rescue", () => {
  const { outcome, points } = simulate(SCENARIOS.earlyProposal.scenario);
  const last = points.at(-1)!;
  expect(last.lunaMarketCap).toBeLessThan(last.ustSupply);
  expect(outcome.survived).toBe(false);
});
