// One tuned world proves little: a spiral is too sensitive to its starting point. So we ask the
// question across many worlds, each with different assumptions about people, and keep only the ones
// where the May 2022 setup really does collapse. The chain's rules never change.

import { SCENARIOS, type ScenarioId } from "./scenarios";
import { simulate, type Scenario } from "./simulate";

/** How far each assumption may stray from its tuned value: up to 1.4 times, either way. */
const SPREAD = Math.log(1.4);

/** A small seeded generator, so that a rerun gives the same worlds. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same scenario with its assumptions about people redrawn. */
export function sampleWorld(scenario: Scenario, seed: number): Scenario {
  const random = seededRandom(seed);
  const stray = (value: number) => value * Math.exp((random() * 2 - 1) * SPREAD);
  const b = scenario.behavior;
  return {
    ...scenario,
    behavior: {
      marketDepthUsd: stray(b.marketDepthUsd),
      anchorFleePerDay: stray(b.anchorFleePerDay),
      walletFleePerDay: stray(b.walletFleePerDay),
      ignoredDiscount: stray(b.ignoredDiscount),
      fullPanicDiscount: stray(b.fullPanicDiscount),
      panicLagBlocks: stray(b.panicLagBlocks),
      undercollateralizedFear: stray(b.undercollateralizedFear),
      confidenceSensitivity: stray(b.confidenceSensitivity),
      lunaSellImpact: stray(b.lunaSellImpact),
    },
    shocks: scenario.shocks.map((shock, index) =>
      index === 0 ? shock : { ...shock, ustSold: stray(shock.ustSold) },
    ),
  };
}

/** Same people, other choices: moves one world's assumptions onto a what-if. */
function inWorld(world: Scenario, whatIf: Scenario): Scenario {
  return { ...whatIf, behavior: world.behavior, shocks: world.shocks };
}

/** A world counts only if the real setup collapses in it, as it did. */
function collapsesLikeMay2022(world: Scenario): boolean {
  const { outcome } = simulate(world);
  return !outcome.survived && outcome.finalUstPrice < 0.6 && outcome.finalLunaPrice < 1;
}

export type RescueOdds = {
  worldsTried: number;
  worldsKept: number;
  /** For each what-if, the share of kept worlds where the peg holds. */
  survivalShare: Record<ScenarioId, number>;
};

export function rescueOdds(worldsTried: number): RescueOdds {
  const base = SCENARIOS.asHappened.scenario;
  const ids = Object.keys(SCENARIOS) as ScenarioId[];
  const kept: Scenario[] = [];
  for (let seed = 1; seed <= worldsTried; seed++) {
    const world = sampleWorld(base, seed);
    if (collapsesLikeMay2022(world)) kept.push(world);
  }
  const survivalShare = Object.fromEntries(
    ids.map((id) => {
      const saved = kept.filter((world) => simulate(inWorld(world, SCENARIOS[id].scenario)).outcome.survived);
      return [id, kept.length === 0 ? 0 : saved.length / kept.length];
    }),
  ) as Record<ScenarioId, number>;
  return { worldsTried, worldsKept: kept.length, survivalShare };
}
