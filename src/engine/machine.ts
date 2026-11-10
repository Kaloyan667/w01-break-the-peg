// The engine seen from inside: the state of the chain at any block, and every number of that block.

import { BLOCKS_PER_DAY, computeSwap } from "./market";
import { SCENARIOS } from "./scenarios";
import { createWorld, emptyTrace, runBlock, simulate, type BlockTrace, type Point, type Scenario, type World } from "./simulate";

const HOUR = BLOCKS_PER_DAY / 24;

export const MACHINE_SCENARIO = SCENARIOS.asHappened.scenario;
export const LAST_BLOCK = MACHINE_SCENARIO.days * BLOCKS_PER_DAY;

/** Multiples of three assumptions about people. Terra's rules are not on the dials. */
export type Dials = { depth: number; anchorFlight: number; panicThreshold: number };

export const NEUTRAL_DIALS: Dials = { depth: 1, anchorFlight: 1, panicThreshold: 1 };

export function withDials(scenario: Scenario, { depth, anchorFlight, panicThreshold }: Dials): Scenario {
  const { behavior } = scenario;
  return {
    ...scenario,
    behavior: {
      ...behavior,
      marketDepthUsd: behavior.marketDepthUsd * depth,
      anchorFleePerDay: behavior.anchorFleePerDay * anchorFlight,
      fullPanicDiscount: behavior.fullPanicDiscount * panicThreshold,
    },
  };
}

export type MachineState = {
  world: World;
  trace: BlockTrace;
  /** What burning one UST would pay right now, in LUNA. */
  lunaPerUst: number;
  /** The fee the chain would charge right now. */
  fee: number;
  /** All the LUNA, as a multiple of all the UST. */
  cover: number;
};

/** The chain just after `block`, replayed from the start so the dials always apply to the whole run. */
export function machineAt(scenario: Scenario, block: number): MachineState {
  const world = createWorld(scenario);
  const trace = emptyTrace();
  const unused: Point[] = [];
  const perBlock = scenario.reserve.maxSpendPerDayUsd / BLOCKS_PER_DAY;
  for (let current = 0; current <= block; current++) {
    runBlock(world, scenario, unused, perBlock, current === block ? trace : undefined);
  }
  const quote = computeSwap({ delta: world.delta, params: scenario.market, offer: "ust", amount: 1, lunaPriceUsd: world.lunaPrice });
  return { world, trace, lunaPerUst: quote.out, fee: quote.spread, cover: (world.lunaPrice * world.lunaSupply) / world.ustSupply };
}

export type Moment = { label: string; block: number };

/** The blocks worth stopping at. The crossing moves with the dials, and may not happen at all. */
export function momentsOf(scenario: Scenario): Moment[] {
  const [first, second] = scenario.shocks;
  const { spiralHour } = simulate(scenario).outcome;
  const moments: Moment[] = [
    { label: "A quiet block", block: 3000 },
    { label: "The first sale", block: Math.round(first.day * BLOCKS_PER_DAY) },
    { label: "The second wave", block: Math.round(second.day * BLOCKS_PER_DAY) },
  ];
  if (spiralHour !== null) moments.push({ label: "LUNA falls under 100%", block: spiralHour * HOUR });
  return moments.sort((a, b) => a.block - b.block);
}
