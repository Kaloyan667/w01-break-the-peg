// The world around Terra's rules: who sells, who arbitrages, and what that does to the two prices.
//
// market.ts is what the chain enforced. Everything in `Behavior` is an assumption about people, tuned
// to May 2022 and not measured. The simulation advances block by block, like the chain did.

import { BLOCKS_PER_DAY, burnToReachSpread, computeSwap, replenishPool, type MarketParams } from "./market";

const BLOCKS_PER_HOUR = BLOCKS_PER_DAY / 24;

/** Assumptions about people and markets, not chain rules. */
export type Behavior = {
  /** UST the open market can absorb before the price gives way, in dollars. */
  marketDepthUsd: number;
  /** Share of Anchor deposits leaving per day at full panic. */
  anchorFleePerDay: number;
  /** Share of UST held elsewhere leaving per day at full panic. */
  walletFleePerDay: number;
  /** The UST discount nobody reacts to. */
  ignoredDiscount: number;
  /** The UST discount at which panic is total. */
  fullPanicDiscount: number;
  /** Blocks panic takes to catch up with the price. */
  panicLagBlocks: number;
  /** How much harder people run once LUNA is worth less than the UST it stands behind. */
  undercollateralizedFear: number;
  /** How fast buyers vanish as LUNA stops covering UST: 0 never, 1 in proportion. */
  confidenceSensitivity: number;
  /** Dollars of LUNA value destroyed per dollar of LUNA sold. */
  lunaSellImpact: number;
};

export type Scenario = {
  market: MarketParams;
  behavior: Behavior;
  days: number;
  start: {
    ustSupply: number;
    anchorDeposits: number;
    lunaSupply: number;
    lunaPriceUsd: number;
  };
  /**
   * Sales forced on the market at a given time, in a single block. Past about twice the market's depth
   * the model stops being credible: nobody really dumps billions at 3 cents and waits to be bought out.
   */
  shocks: { day: number; ustSold: number }[];
  reserve: {
    usd: number;
    /** It starts buying when UST falls under this price. */
    triggerPrice: number;
    maxSpendPerDayUsd: number;
  };
  /** The day the chain stops: no swap can happen after it. Null keeps it running. */
  chainHaltDay: number | null;
  /** A share of UST redeemable for a dollar, at any time, whatever the market says. */
  hardBackingShare: number;
};

/** The state of the world, one point per hour of simulated time. */
export type Point = {
  hour: number;
  ustPrice: number;
  lunaPrice: number;
  ustSupply: number;
  lunaSupply: number;
  lunaMarketCap: number;
  anchorDeposits: number;
  reserveUsd: number;
  /** The fee the chain charges right now to burn UST. */
  spread: number;
  panic: number;
  /** UST looking for a buyer. */
  unsoldUst: number;
};

export type Outcome = {
  /** UST is back at its peg and all the LUNA is still worth at least all the UST. */
  survived: boolean;
  minUstPrice: number;
  finalUstPrice: number;
  finalLunaPrice: number;
  ustBurned: number;
  /** First hour UST trades under 95 cents. */
  breakHour: number | null;
  /** First hour all the LUNA in existence is worth less than all the UST. */
  spiralHour: number | null;
};

export type SimulationResult = { points: Point[]; outcome: Outcome };

/** Above this at the end of the run, the peg counts as held. */
const SURVIVAL_PRICE = 0.97;
/** LUNA never prints a price of zero: under this, a swap would mint an absurd number of coins. */
const LUNA_PRICE_FLOOR = 1e-6;

/**
 * The open market for UST, as a price that depends on the UST waiting to be sold. Like a Curve pool
 * it stays flat near $1 and then gives way all at once.
 */
export function marketPrice(unsoldUst: number, depthUsd: number): number {
  return 1 / (1 + (unsoldUst / depthUsd) ** 3);
}

/** How finely a large purchase is cut up: enough for the price to move smoothly under it. */
const BUYBACK_SLICES = 64;

/**
 * Buying UST back along the market curve: each purchase lifts the price the next one pays, and the
 * buyer stops at `stopPrice` because above it the peg no longer needs defending.
 */
export function buyUstBack({
  unsold,
  budgetUsd,
  depthUsd,
  stopPrice,
}: {
  unsold: number;
  budgetUsd: number;
  depthUsd: number;
  stopPrice: number;
}): { boughtUst: number; spentUsd: number } {
  const slice = unsold / BUYBACK_SLICES;
  let remaining = unsold;
  let spentUsd = 0;
  for (let i = 0; i < BUYBACK_SLICES; i++) {
    if (marketPrice(remaining, depthUsd) >= stopPrice) break;
    const sliceCost = slice * marketPrice(remaining - slice / 2, depthUsd);
    if (spentUsd + sliceCost >= budgetUsd) {
      remaining -= (budgetUsd - spentUsd) / marketPrice(remaining, depthUsd);
      spentUsd = budgetUsd;
      break;
    }
    spentUsd += sliceCost;
    remaining -= slice;
  }
  return { boughtUst: unsold - remaining, spentUsd };
}

/**
 * Burning 1 UST pays a dollar of LUNA, so a buyer of UST is really trusting LUNA. Once all the LUNA is
 * worth less than all the UST, the depth of the market shrinks with that cover.
 */
export function confidentDepth(behavior: Behavior, lunaMarketCap: number, ustSupply: number): number {
  const cover = Math.min(lunaMarketCap / ustSupply, 1);
  return behavior.marketDepthUsd * cover ** behavior.confidenceSensitivity;
}

/** Everything that changes from one block to the next. */
export type World = {
  /** The next block to run. */
  block: number;
  /** TerraPoolDelta, see market.ts. */
  delta: number;
  ustSupply: number;
  anchor: number;
  wallets: number;
  lunaSupply: number;
  lunaPrice: number;
  /** UST looking for a buyer. */
  unsold: number;
  reserveUsd: number;
  panic: number;
  ustBurned: number;
  minUstPrice: number;
  breakHour: number | null;
  spiralHour: number | null;
};

export function createWorld({ start, reserve }: Scenario): World {
  return {
    block: 0,
    delta: 0,
    ustSupply: start.ustSupply,
    anchor: start.anchorDeposits,
    wallets: start.ustSupply - start.anchorDeposits,
    lunaSupply: start.lunaSupply,
    lunaPrice: start.lunaPriceUsd,
    unsold: 0,
    reserveUsd: reserve.usd,
    panic: 0,
    ustBurned: 0,
    minUstPrice: 1,
    breakHour: null,
    spiralHour: null,
  };
}

/** Every intermediate number of one block, for the page that shows the machine at work. */
export type BlockTrace = {
  block: number;
  waveUst: number;
  unsoldOpen: number;
  depthUsd: number;
  priceOpen: number;
  discount: number;
  targetPanic: number;
  panic: number;
  fearMultiple: number;
  leftAnchorUst: number;
  leftWalletsUst: number;
  priceAfterRun: number;
  reserveSpentUsd: number;
  reserveBoughtUst: number;
  priceAfterReserve: number;
  burnableUst: number;
  burnedUst: number;
  fee: number;
  printedLuna: number;
  lunaPriceOpen: number;
  lunaSoldUsd: number;
  lunaCapOpen: number;
  lunaCapClose: number;
  lunaPriceClose: number;
  priceClose: number;
  deltaBeforeRecovery: number;
  deltaClose: number;
};

export const emptyTrace = (): BlockTrace => ({
  block: 0,
  waveUst: 0,
  unsoldOpen: 0,
  depthUsd: 0,
  priceOpen: 0,
  discount: 0,
  targetPanic: 0,
  panic: 0,
  fearMultiple: 0,
  leftAnchorUst: 0,
  leftWalletsUst: 0,
  priceAfterRun: 0,
  reserveSpentUsd: 0,
  reserveBoughtUst: 0,
  priceAfterReserve: 0,
  burnableUst: 0,
  burnedUst: 0,
  fee: 0,
  printedLuna: 0,
  lunaPriceOpen: 0,
  lunaSoldUsd: 0,
  lunaCapOpen: 0,
  lunaCapClose: 0,
  lunaPriceClose: 0,
  priceClose: 0,
  deltaBeforeRecovery: 0,
  deltaClose: 0,
});

/**
 * Runs one block of the chain, changing `world` in place, and adds a point to `points` on the hour.
 * The reserve may spend up to `reserveBudgetUsd` in this block. Returns what it did spend.
 * Give it a `trace` to read every intermediate number afterwards.
 */
export function runBlock(world: World, scenario: Scenario, points: Point[], reserveBudgetUsd: number, trace?: BlockTrace): number {
  const { market, behavior, shocks, reserve, chainHaltDay, hardBackingShare } = scenario;
  const { block } = world;

  const shock = shocks.find(({ day }) => Math.round(day * BLOCKS_PER_DAY) === block)?.ustSold ?? 0;
  if (shock > 0) {
    const fromAnchor = Math.min(shock, world.anchor);
    world.anchor -= fromAnchor;
    world.wallets -= Math.min(shock - fromAnchor, world.wallets);
    world.unsold += shock;
  }

  const depth = () => confidentDepth(behavior, world.lunaPrice * world.lunaSupply, world.ustSupply);
  const quote = () => marketPrice(world.unsold, depth());
  let price = quote();
  const unsoldOpen = world.unsold;
  const depthOpen = depth();
  const priceOpen = price;
  const lunaPriceOpen = world.lunaPrice;

  // A hard-backed share is redeemed at a dollar: the market cannot fall through that floor for it.
  const backed = Math.min(world.unsold * hardBackingShare, world.unsold);
  world.unsold -= backed;
  world.ustSupply -= backed;

  // People run: the larger the discount, the larger the share of holders leaving.
  const lunaMarketCap = world.lunaPrice * world.lunaSupply;
  const discount = 1 - price;
  const targetPanic = Math.min(Math.max(discount - behavior.ignoredDiscount, 0) / behavior.fullPanicDiscount, 1);
  world.panic += (targetPanic - world.panic) / behavior.panicLagBlocks;
  const fearMultiple = lunaMarketCap < world.ustSupply ? 1 + behavior.undercollateralizedFear : 1;
  const fleeing = Math.min(world.panic * fearMultiple, 1) / BLOCKS_PER_DAY;
  const leftAnchor = world.anchor * behavior.anchorFleePerDay * fleeing;
  const leftWallets = world.wallets * behavior.walletFleePerDay * fleeing;
  world.anchor -= leftAnchor;
  world.wallets -= leftWallets;
  world.unsold += leftAnchor + leftWallets;

  // The reserve buys UST off the market while it has money left.
  price = quote();
  const priceAfterRun = price;
  const budgetUsd = Math.min(world.reserveUsd, reserveBudgetUsd);
  let spentThisBlock = 0;
  let boughtThisBlock = 0;
  if (price < reserve.triggerPrice && budgetUsd > 0 && world.unsold > 0) {
    const { boughtUst, spentUsd } = buyUstBack({
      unsold: world.unsold,
      budgetUsd,
      depthUsd: depth(),
      stopPrice: reserve.triggerPrice,
    });
    world.reserveUsd -= spentUsd;
    world.unsold -= boughtUst;
    spentThisBlock = spentUsd;
    boughtThisBlock = boughtUst;
    price = quote();
  }
  const priceAfterReserve = price;

  // Arbitrageurs buy cheap UST, burn it for a dollar of LUNA and sell the LUNA, until the spread
  // eats the discount.
  const chainRunning = chainHaltDay === null || block < chainHaltDay * BLOCKS_PER_DAY;
  const burnable = burnToReachSpread({ delta: world.delta, params: market, targetSpread: 1 - price });
  const burn = chainRunning ? Math.min(burnable, world.unsold) : 0;
  let fee = 0;
  let printedLuna = 0;
  let lunaSoldUsd = 0;
  let lunaCapClose = lunaMarketCap;
  if (burn > 0) {
    const swap = computeSwap({ delta: world.delta, params: market, offer: "ust", amount: burn, lunaPriceUsd: world.lunaPrice });
    world.delta = swap.delta;
    world.unsold -= burn;
    world.ustSupply -= burn;
    world.ustBurned += burn;

    const soldUsd = swap.out * world.lunaPrice;
    const capAfterSale = lunaMarketCap * Math.exp((-behavior.lunaSellImpact * soldUsd) / lunaMarketCap);
    world.lunaSupply += swap.out;
    world.lunaPrice = Math.max(capAfterSale / world.lunaSupply, LUNA_PRICE_FLOOR);
    price = quote();
    fee = swap.spread;
    printedLuna = swap.out;
    lunaSoldUsd = soldUsd;
    lunaCapClose = capAfterSale;
  }

  const deltaBeforeRecovery = world.delta;
  world.delta = replenishPool(world.delta, market);

  if (trace) {
    Object.assign(trace, {
      block,
      waveUst: shock,
      unsoldOpen,
      depthUsd: depthOpen,
      priceOpen,
      discount,
      targetPanic,
      panic: world.panic,
      fearMultiple,
      leftAnchorUst: leftAnchor,
      leftWalletsUst: leftWallets,
      priceAfterRun,
      reserveSpentUsd: spentThisBlock,
      reserveBoughtUst: boughtThisBlock,
      priceAfterReserve,
      burnableUst: burnable,
      burnedUst: burn,
      fee,
      printedLuna,
      lunaPriceOpen,
      lunaSoldUsd,
      lunaCapOpen: lunaMarketCap,
      lunaCapClose,
      lunaPriceClose: world.lunaPrice,
      priceClose: price,
      deltaBeforeRecovery,
      deltaClose: world.delta,
    } satisfies BlockTrace);
  }

  world.minUstPrice = Math.min(world.minUstPrice, price);
  if (block % BLOCKS_PER_HOUR === 0) {
    const hour = block / BLOCKS_PER_HOUR;
    const cap = world.lunaPrice * world.lunaSupply;
    if (world.breakHour === null && price < 0.95) world.breakHour = hour;
    if (world.spiralHour === null && cap < world.ustSupply) world.spiralHour = hour;
    points.push({
      hour,
      ustPrice: price,
      lunaPrice: world.lunaPrice,
      ustSupply: world.ustSupply,
      lunaSupply: world.lunaSupply,
      lunaMarketCap: cap,
      anchorDeposits: world.anchor,
      reserveUsd: world.reserveUsd,
      spread: computeSwap({ delta: world.delta, params: market, offer: "ust", amount: 1, lunaPriceUsd: world.lunaPrice }).spread,
      panic: world.panic,
      unsoldUst: world.unsold,
    });
  }

  world.block = block + 1;
  return spentThisBlock;
}

/** UST ended the run at its peg, never collapsed on the way, and all the LUNA still covers all the UST. */
export function heldThePeg(world: World, last: Point, hardBackingShare: number): boolean {
  return last.ustPrice >= SURVIVAL_PRICE && world.minUstPrice > 0.5 && (hardBackingShare === 1 || last.lunaMarketCap >= last.ustSupply);
}

export function simulate(scenario: Scenario): SimulationResult {
  const world = createWorld(scenario);
  const points: Point[] = [];
  const reserveMaxPerBlock = scenario.reserve.maxSpendPerDayUsd / BLOCKS_PER_DAY;
  for (let block = 0; block <= scenario.days * BLOCKS_PER_DAY; block++) runBlock(world, scenario, points, reserveMaxPerBlock);

  const last = points[points.length - 1];
  return {
    points,
    outcome: {
      survived: heldThePeg(world, last, scenario.hardBackingShare),
      minUstPrice: world.minUstPrice,
      finalUstPrice: last.ustPrice,
      finalLunaPrice: last.lunaPrice,
      ustBurned: world.ustBurned,
      breakHour: world.breakHour,
      spiralHour: world.spiralHour,
    },
  };
}

/**
 * The smallest reserve that holds the peg, spent at the scenario's own pace, or null if even `maxUsd`
 * fails. The pace matters as much as the size: see the fastReserve scenario.
 */
export function findMinimumReserve(scenario: Scenario, maxUsd = 40e9): number | null {
  const holds = (usd: number) =>
    simulate({ ...scenario, reserve: { ...scenario.reserve, usd } }).outcome.survived;

  if (!holds(maxUsd)) return null;
  let low = 0;
  let high = maxUsd;
  while (high - low > 50e6) {
    const middle = (low + high) / 2;
    if (holds(middle)) high = middle;
    else low = middle;
  }
  return high;
}
