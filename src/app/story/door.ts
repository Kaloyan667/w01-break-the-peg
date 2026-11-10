// How much the fee climbs when a rush tries to leave, from Terra's own pool rules.

import history from "@/data/may-2022.json";
import { BLOCKS_PER_DAY, MAY_2022_MARKET, computeSwap } from "@/engine/market";

export const DOOR_MIN_USD = 100e6;
export const DOOR_MAX_USD = 5e9;

/** How much the supply of UST shrank between the snapshots of May 9 and May 10. */
export const MAY_9_OUTFLOW_USD = history.days[2].ustSupply - history.days[3].ustSupply;

/**
 * The fee once `usd` a day has been flowing steadily. Each block adds a swap and forgets 1/P of the
 * pool, so the pool settles at P-1 swaps away from its resting size.
 */
export function feeForDailyOutflow(usd: number, params = MAY_2022_MARKET): number {
  const perBlockUsd = usd / BLOCKS_PER_DAY;
  const settledDelta = (perBlockUsd / params.usdPerSdr) * (params.poolRecoveryBlocks - 1);
  return computeSwap({ delta: settledDelta, params, offer: "ust", amount: perBlockUsd, lunaPriceUsd: 1 }).spread;
}

const SPAN = Math.log(DOOR_MAX_USD / DOOR_MIN_USD);

/** The slider is logarithmic: from 0 to 1 it multiplies the outflow, it does not add to it. */
export const outflowAt = (position: number) => DOOR_MIN_USD * Math.exp(position * SPAN);
export const doorPosition = (usd: number) => Math.log(usd / DOOR_MIN_USD) / SPAN;
