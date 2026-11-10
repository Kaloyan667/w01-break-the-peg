// The game, played one day at a time on top of the engine. A day is 14,400 real blocks of simulate.ts:
// the player only changes the three things below, and whether the peg holds is the engine's answer.

import { BLOCKS_PER_DAY, MAY_2022_MARKET, PROPOSAL_1164_MARKET, dailyBurnCapacityUsd } from "./market";
import { SCENARIOS } from "./scenarios";
import { createWorld, heldThePeg, runBlock, type Point, type Scenario, type World } from "./simulate";

export const GAME_DAYS = 7;
/** One press of the defend button. */
export const DEFEND_STEP_USD = 500e6;
/** The chain was stopped on 13 May, because of the collapse: it only happens here once the spiral has started. */
const CHAIN_HALT_DAY = 6;
/**
 * ASSUMPTION, made up for the game and not measured: the share of Anchor's withdrawals that the first,
 * second and third bluff hold back for a day. A market stops believing the same promise.
 */
const BLUFF_STRENGTHS = [0.5, 0.25, 0.1];

const asHappened = SCENARIOS.asHappened.scenario;

export const GAME_SCENARIO: Scenario = {
  ...asHappened,
  days: GAME_DAYS,
  chainHaltDay: null,
  // "About $3 billion" held: https://www.theblock.co/linked/147014. The player decides when it is spent.
  reserve: { ...asHappened.reserve, usd: 3e9, maxSpendPerDayUsd: 0 },
};

/** What the player has decided for the coming day. */
export type Plan = { defendUsd: number; mint: boolean; bluff: boolean };

export type DayResult = {
  day: number;
  plan: Plan;
  spentUsd: number;
  burnedUst: number;
  printedLuna: number;
  limitUsd: number;
  /** LUNA stopped covering UST during this day. */
  spiralStarted: boolean;
};

export type Game = {
  scenario: Scenario;
  world: World;
  /** One point per hour since the start. */
  points: Point[];
  /** Days already played: 0 on the first morning, GAME_DAYS when the week is over. */
  day: number;
  plan: Plan;
  bluffsPlayed: number;
  results: DayResult[];
};

export type Status = "playing" | "spiral" | "over";

export type CrashReport = {
  outcome: "spiral" | "held" | "limped";
  /** Hours until all the LUNA was worth less than all the UST, or the whole week if that never came. */
  hoursHeld: number;
  capitalErasedUsd: number;
  reserveSpentUsd: number;
  last: Point;
};

const NO_PLAN: Plan = { defendUsd: 0, mint: false, bluff: false };

export function newGame(scenario: Scenario = GAME_SCENARIO): Game {
  const world = createWorld(scenario);
  const points: Point[] = [];
  runBlock(world, scenario, points, 0);
  return { scenario, world, points, day: 0, plan: NO_PLAN, bluffsPlayed: 0, results: [] };
}

export function status(game: Game): Status {
  if (game.day >= GAME_DAYS) return "over";
  return game.world.spiralHour === null ? "playing" : "spiral";
}

/** Adds one step to the day's budget. The reserve only pays when UST falls under the trigger price. */
export function defend(game: Game): Game {
  const free = game.world.reserveUsd - game.plan.defendUsd;
  if (status(game) !== "playing" || free <= 0) return game;
  return { ...game, plan: { ...game.plan, defendUsd: game.plan.defendUsd + Math.min(DEFEND_STEP_USD, free) } };
}

export function toggleMint(game: Game): Game {
  if (status(game) !== "playing") return game;
  return { ...game, plan: { ...game.plan, mint: !game.plan.mint } };
}

export function toggleBluff(game: Game): Game {
  if (status(game) !== "playing") return game;
  return { ...game, plan: { ...game.plan, bluff: !game.plan.bluff } };
}

/** The share of Anchor's withdrawals the next bluff would hold back. */
export function bluffStrength(game: Game): number {
  return BLUFF_STRENGTHS[game.bluffsPlayed] ?? 0;
}

/** How much UST the chain can turn into LUNA per day, with or without Proposal 1164. */
export function dailyLimitUsd(mint: boolean): number {
  return dailyBurnCapacityUsd(mint ? PROPOSAL_1164_MARKET : MAY_2022_MARKET);
}

/** The rules in force today: the player's choices, applied to the unchanged scenario. */
function rulesForToday(game: Game): Scenario {
  const { scenario, plan, world } = game;
  const heldBack = plan.bluff ? bluffStrength(game) : 0;
  return {
    ...scenario,
    market: plan.mint ? PROPOSAL_1164_MARKET : scenario.market,
    behavior: { ...scenario.behavior, anchorFleePerDay: scenario.behavior.anchorFleePerDay * (1 - heldBack) },
    chainHaltDay: world.spiralHour === null ? null : CHAIN_HALT_DAY,
  };
}

export function nextDay(game: Game): Game {
  if (status(game) === "over") return game;
  const { plan } = game;
  const today = rulesForToday(game);
  const world: World = { ...game.world };
  const points = [...game.points];

  let budgetUsd = plan.defendUsd;
  let spentUsd = 0;
  for (let i = 0; i < BLOCKS_PER_DAY; i++) {
    const spent = runBlock(world, today, points, budgetUsd);
    budgetUsd -= spent;
    spentUsd += spent;
  }

  const result: DayResult = {
    day: game.day,
    plan,
    spentUsd,
    burnedUst: world.ustBurned - game.world.ustBurned,
    printedLuna: world.lunaSupply - game.world.lunaSupply,
    limitUsd: dailyLimitUsd(plan.mint),
    spiralStarted: game.world.spiralHour === null && world.spiralHour !== null,
  };
  return {
    ...game,
    world,
    points,
    day: game.day + 1,
    plan: NO_PLAN,
    bluffsPlayed: game.bluffsPlayed + (plan.bluff ? 1 : 0),
    results: [...game.results, result],
  };
}

export function crashReport(game: Game): CrashReport {
  const first = game.points[0];
  const last = game.points[game.points.length - 1];
  const { spiralHour } = game.world;
  const value = (point: Point) => point.ustPrice * point.ustSupply + point.lunaMarketCap;
  const held = heldThePeg(game.world, last, game.scenario.hardBackingShare);
  return {
    outcome: spiralHour !== null ? "spiral" : held ? "held" : "limped",
    hoursHeld: spiralHour ?? last.hour,
    capitalErasedUsd: value(first) - value(last),
    reserveSpentUsd: first.reserveUsd - last.reserveUsd,
    last,
  };
}
