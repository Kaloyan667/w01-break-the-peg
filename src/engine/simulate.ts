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

export function simulate(scenario: Scenario): SimulationResult {
  const { market, behavior, days, start, shocks, reserve, chainHaltDay, hardBackingShare } = scenario;
  const totalBlocks = days * BLOCKS_PER_DAY;
  const shockAtBlock = new Map(shocks.map(({ day, ustSold }) => [Math.round(day * BLOCKS_PER_DAY), ustSold]));

  let delta = 0;
  let ustSupply = start.ustSupply;
  let anchor = start.anchorDeposits;
  let wallets = start.ustSupply - start.anchorDeposits;
  let lunaSupply = start.lunaSupply;
  let lunaPrice = start.lunaPriceUsd;
  let unsold = 0;
  let reserveUsd = reserve.usd;
  let panic = 0;
  let ustBurned = 0;
  let breakHour: number | null = null;
  let spiralHour: number | null = null;
  let minUstPrice = 1;

  const reserveMaxPerBlock = reserve.maxSpendPerDayUsd / BLOCKS_PER_DAY;
  const haltBlock = chainHaltDay === null ? Infinity : chainHaltDay * BLOCKS_PER_DAY;
  const points: Point[] = [];

  for (let block = 0; block <= totalBlocks; block++) {
    const shock = shockAtBlock.get(block) ?? 0;
    if (shock > 0) {
      const fromAnchor = Math.min(shock, anchor);
      anchor -= fromAnchor;
      wallets -= Math.min(shock - fromAnchor, wallets);
      unsold += shock;
    }

    const quote = () => marketPrice(unsold, confidentDepth(behavior, lunaPrice * lunaSupply, ustSupply));
    let price = quote();

    // A hard-backed share is redeemed at a dollar: the market cannot fall through that floor for it.
    const backed = Math.min(unsold * hardBackingShare, unsold);
    unsold -= backed;
    ustSupply -= backed;

    // People run: the larger the discount, the larger the share of holders leaving.
    const lunaMarketCap = lunaPrice * lunaSupply;
    const discount = 1 - price;
    const targetPanic = Math.min(Math.max(discount - behavior.ignoredDiscount, 0) / behavior.fullPanicDiscount, 1);
    panic += (targetPanic - panic) / behavior.panicLagBlocks;
    const fearMultiple = lunaMarketCap < ustSupply ? 1 + behavior.undercollateralizedFear : 1;
    const fleeing = Math.min(panic * fearMultiple, 1) / BLOCKS_PER_DAY;
    const leftAnchor = anchor * behavior.anchorFleePerDay * fleeing;
    const leftWallets = wallets * behavior.walletFleePerDay * fleeing;
    anchor -= leftAnchor;
    wallets -= leftWallets;
    unsold += leftAnchor + leftWallets;

    // The reserve buys UST off the market while it has money left.
    price = quote();
    if (price < reserve.triggerPrice && reserveUsd > 0 && unsold > 0) {
      const { boughtUst, spentUsd } = buyUstBack({
        unsold,
        budgetUsd: Math.min(reserveUsd, reserveMaxPerBlock),
        depthUsd: confidentDepth(behavior, lunaPrice * lunaSupply, ustSupply),
        stopPrice: reserve.triggerPrice,
      });
      reserveUsd -= spentUsd;
      unsold -= boughtUst;
      price = quote();
    }

    // Arbitrageurs buy cheap UST, burn it for a dollar of LUNA and sell the LUNA, until the spread
    // eats the discount.
    const chainRunning = block < haltBlock;
    const burnable = burnToReachSpread({ delta, params: market, targetSpread: 1 - price });
    const burn = chainRunning ? Math.min(burnable, unsold) : 0;
    if (burn > 0) {
      const swap = computeSwap({ delta, params: market, offer: "ust", amount: burn, lunaPriceUsd: lunaPrice });
      delta = swap.delta;
      unsold -= burn;
      ustSupply -= burn;
      ustBurned += burn;

      const soldUsd = swap.out * lunaPrice;
      const capAfterSale = lunaMarketCap * Math.exp((-behavior.lunaSellImpact * soldUsd) / lunaMarketCap);
      lunaSupply += swap.out;
      lunaPrice = Math.max(capAfterSale / lunaSupply, LUNA_PRICE_FLOOR);
      price = quote();
    }

    delta = replenishPool(delta, market);

    minUstPrice = Math.min(minUstPrice, price);
    if (block % BLOCKS_PER_HOUR === 0) {
      const hour = block / BLOCKS_PER_HOUR;
      const cap = lunaPrice * lunaSupply;
      if (breakHour === null && price < 0.95) breakHour = hour;
      if (spiralHour === null && cap < ustSupply) spiralHour = hour;
      points.push({
        hour,
        ustPrice: price,
        lunaPrice,
        ustSupply,
        lunaSupply,
        lunaMarketCap: cap,
        anchorDeposits: anchor,
        reserveUsd,
        spread: computeSwap({ delta, params: market, offer: "ust", amount: 1, lunaPriceUsd: lunaPrice }).spread,
        panic,
      });
    }
  }

  const last = points[points.length - 1];
  return {
    points,
    outcome: {
      survived: last.ustPrice >= SURVIVAL_PRICE && minUstPrice > 0.5 && (hardBackingShare === 1 || last.lunaMarketCap >= last.ustSupply),
      minUstPrice,
      finalUstPrice: last.ustPrice,
      finalLunaPrice: last.lunaPrice,
      ustBurned,
      breakHour,
      spiralHour,
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
