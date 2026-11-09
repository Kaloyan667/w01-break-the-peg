// Terra's on-chain swap, ported from the module that ran it:
// https://github.com/terra-money/classic-core/blob/main/x/market/keeper/swap.go
//
// This file holds the real rules and no assumptions. The virtual pool does not hold any money: it
// only meters how much UST can be swapped for LUNA before the fee, called the spread, gets punishing.

export type MarketParams = {
  /** BasePool: the size of each virtual pool, in SDR. */
  basePoolSdr: number;
  /** PoolRecoveryPeriod: how many blocks the pool takes to forget past swaps. */
  poolRecoveryBlocks: number;
  /** MinStabilitySpread: the smallest fee a swap can pay. */
  minSpread: number;
  /** Dollars per SDR, the currency basket the pools are counted in. */
  usdPerSdr: number;
};

/** core.BlocksPerDay in Terra's code: one block every six seconds. */
export const BLOCKS_PER_DAY = 14_400;

/**
 * The market as it stood when the run began.
 * BasePool and recovery: Do Kwon's proposal of 11 May 2022, quoted by CoinGecko,
 * https://www.coingecko.com/learn/ust-depegged-terra-s-biggest-test
 * Spread: DefaultMinStabilitySpread in Terra's params.go. No dated on-chain record confirms it for May
 * 2022, but 2% is the value that reproduces the quoted $293M a day (see dailyBurnCapacityUsd).
 * SDR: IMF illustrative rate of 27 May 2022, a three-month average rather than a daily fixing,
 * https://www.imf.org/en/Topics/special-drawing-right/sdr-valuation-basket/Issues/2022/052722
 */
export const MAY_2022_MARKET: MarketParams = {
  basePoolSdr: 50_000_000,
  poolRecoveryBlocks: 36,
  minSpread: 0.02,
  usdPerSdr: 1.349154,
};

/** Proposal 1164, the emergency change voted during the crash: a pool twice as deep, twice as fast. */
export const PROPOSAL_1164_MARKET: MarketParams = {
  ...MAY_2022_MARKET,
  basePoolSdr: 100_000_000,
  poolRecoveryBlocks: 18,
};

export type SwapRequest = {
  /** TerraPoolDelta: how far the UST pool sits from its resting size, in SDR. */
  delta: number;
  params: MarketParams;
  /** Which coin the trader hands over. */
  offer: "ust" | "luna";
  /** How many of that coin. */
  amount: number;
  /** The oracle's LUNA price. The oracle counts 1 UST as $1, even when the market does not. */
  lunaPriceUsd: number;
};

export type SwapResult = {
  /** How many of the other coin the trader receives, after the spread. */
  out: number;
  /** The fee as a share of the swap, from 0 to 1. */
  spread: number;
  /** TerraPoolDelta after the swap. */
  delta: number;
};

/** ComputeSwap and ApplySwapToPool from swap.go, for the two swaps that involve LUNA. */
export function computeSwap({ delta, params, offer, amount, lunaPriceUsd }: SwapRequest): SwapResult {
  const { basePoolSdr: base, minSpread, usdPerSdr } = params;
  const constantProduct = base * base;
  const terraPool = base + delta;
  const lunaPool = constantProduct / terraPool;

  const offerUsd = offer === "ust" ? amount : amount * lunaPriceUsd;
  const offerSdr = offerUsd / usdPerSdr;
  const [offerPool, askPool] = offer === "ust" ? [terraPool, lunaPool] : [lunaPool, terraPool];

  const askSdr = askPool - constantProduct / (offerPool + offerSdr);
  const spread = Math.max((offerSdr - askSdr) / offerSdr, minSpread);
  const paidUsd = offerUsd * (1 - spread);

  if (offer === "ust") {
    return { out: paidUsd / lunaPriceUsd, spread, delta: delta + offerSdr };
  }
  return { out: paidUsd, spread, delta: delta - paidUsd / usdPerSdr };
}

/** ReplenishPools, run at the end of every block: the pool forgets a slice of past swaps. */
export function replenishPool(delta: number, params: MarketParams): number {
  return delta - delta / params.poolRecoveryBlocks;
}

/**
 * The most UST that can be burned in one swap before the spread reaches a target. It is ComputeSwap's
 * spread solved for the amount. An arbitrageur stops there: with UST at 80 cents, a spread above 20%
 * leaves no profit.
 */
export function burnToReachSpread({
  delta,
  params,
  targetSpread,
}: {
  delta: number;
  params: MarketParams;
  targetSpread: number;
}): number {
  if (targetSpread < params.minSpread) return 0;
  const { basePoolSdr: base, usdPerSdr } = params;
  const terraPool = base + delta;
  const burnSdr = (base * base) / ((1 - targetSpread) * terraPool) - terraPool;
  return Math.max(burnSdr, 0) * usdPerSdr;
}

/**
 * The famous limit: how many dollars of UST can be burned per day, forever, at the minimum spread.
 * Each block adds a swap of `a` and then forgets 1/P of the pool, so the delta settles at a(P-1).
 * Setting the spread to its minimum gives a quadratic in `a`.
 */
export function dailyBurnCapacityUsd(params: MarketParams): number {
  const { basePoolSdr: base, poolRecoveryBlocks: period, minSpread, usdPerSdr } = params;
  const quadratic = period * (period - 1);
  const linear = base * (2 * period - 1);
  const constant = base * base - (base * base) / (1 - minSpread);
  const perBlockSdr = (-linear + Math.sqrt(linear * linear - 4 * quadratic * constant)) / (2 * quadratic);
  return perBlockSdr * BLOCKS_PER_DAY * usdPerSdr;
}
