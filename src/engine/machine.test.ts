import { describe, expect, it } from "vitest";
import { BLOCKS_PER_DAY } from "./market";
import { LAST_BLOCK, MACHINE_SCENARIO, NEUTRAL_DIALS, machineAt, momentsOf, withDials } from "./machine";
import { simulate } from "./simulate";

const HOUR = BLOCKS_PER_DAY / 24;

describe("the machine at a given block", () => {
  it("agrees with a full run of the engine", () => {
    const point = simulate(MACHINE_SCENARIO).points[60];
    const { world } = machineAt(MACHINE_SCENARIO, 60 * HOUR);
    expect(world.lunaPrice).toBe(point.lunaPrice);
    expect(world.ustSupply).toBe(point.ustSupply);
  });

  it("traces the block that was asked for", () => {
    expect(machineAt(MACHINE_SCENARIO, 1234).trace.block).toBe(1234);
  });

  it("has run the block once it reports it", () => {
    expect(machineAt(MACHINE_SCENARIO, 1234).world.block).toBe(1235);
  });

  it("measures how much of UST the LUNA still covers", () => {
    const { world, cover } = machineAt(MACHINE_SCENARIO, 0);
    expect(cover).toBeCloseTo((world.lunaPrice * world.lunaSupply) / world.ustSupply, 10);
  });

  it("prints more LUNA per UST as LUNA falls", () => {
    const early = machineAt(MACHINE_SCENARIO, 0).lunaPerUst;
    const late = machineAt(MACHINE_SCENARIO, 5 * BLOCKS_PER_DAY).lunaPerUst;
    expect(late).toBeGreaterThan(early);
  });
});

describe("the dials", () => {
  it("leave the scenario alone when neutral", () => {
    expect(withDials(MACHINE_SCENARIO, NEUTRAL_DIALS)).toEqual(MACHINE_SCENARIO);
  });

  it("scale the depth of the market", () => {
    const dialed = withDials(MACHINE_SCENARIO, { ...NEUTRAL_DIALS, depth: 2 });
    expect(dialed.behavior.marketDepthUsd).toBe(MACHINE_SCENARIO.behavior.marketDepthUsd * 2);
  });

  it("scale the flight from Anchor", () => {
    const dialed = withDials(MACHINE_SCENARIO, { ...NEUTRAL_DIALS, anchorFlight: 0.5 });
    expect(dialed.behavior.anchorFleePerDay).toBe(MACHINE_SCENARIO.behavior.anchorFleePerDay * 0.5);
  });

  it("scale the discount at which panic is total", () => {
    const dialed = withDials(MACHINE_SCENARIO, { ...NEUTRAL_DIALS, panicThreshold: 2 });
    expect(dialed.behavior.fullPanicDiscount).toBe(MACHINE_SCENARIO.behavior.fullPanicDiscount * 2);
  });

  it("change what happens", () => {
    const deep = withDials(MACHINE_SCENARIO, { ...NEUTRAL_DIALS, depth: 3 });
    expect(machineAt(deep, 4 * BLOCKS_PER_DAY).world.lunaPrice).toBeGreaterThan(machineAt(MACHINE_SCENARIO, 4 * BLOCKS_PER_DAY).world.lunaPrice);
  });
});

describe("the moments worth jumping to", () => {
  const moments = momentsOf(MACHINE_SCENARIO);

  it("are in the order they happened", () => {
    const blocks = moments.map(({ block }) => block);
    expect(blocks).toEqual([...blocks].sort((a, b) => a - b));
  });

  it("stay inside the run", () => {
    for (const { block } of moments) {
      expect(block).toBeGreaterThanOrEqual(0);
      expect(block).toBeLessThanOrEqual(LAST_BLOCK);
    }
  });

  it("include the block where LUNA stops covering UST", () => {
    const crossing = moments.find(({ label }) => label.includes("100%"))!;
    expect(crossing.block).toBe(simulate(MACHINE_SCENARIO).outcome.spiralHour! * HOUR);
  });

  it("leave out the crossing when the dials prevent it", () => {
    const safe = withDials(MACHINE_SCENARIO, { ...NEUTRAL_DIALS, depth: 40, anchorFlight: 0 });
    expect(simulate(safe).outcome.spiralHour).toBeNull();
    expect(momentsOf(safe).some(({ label }) => label.includes("100%"))).toBe(false);
  });
});
