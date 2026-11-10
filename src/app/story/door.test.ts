import { describe, expect, it } from "vitest";
import history from "@/data/may-2022.json";
import { BLOCKS_PER_DAY, MAY_2022_MARKET, computeSwap, dailyBurnCapacityUsd, replenishPool } from "@/engine/market";
import { DOOR_MAX_USD, DOOR_MIN_USD, MAY_9_OUTFLOW_USD, doorPosition, feeForDailyOutflow, outflowAt } from "./door";

describe("the fee for leaving in one day", () => {
  it("is the minimum fee while few people leave", () => {
    expect(feeForDailyOutflow(50e6)).toBe(MAY_2022_MARKET.minSpread);
  });

  it("is still the minimum fee at the limit the rules allow", () => {
    expect(feeForDailyOutflow(dailyBurnCapacityUsd(MAY_2022_MARKET))).toBeCloseTo(MAY_2022_MARKET.minSpread, 4);
  });

  it("climbs as more people try to leave", () => {
    expect(feeForDailyOutflow(1e9)).toBeGreaterThan(feeForDailyOutflow(500e6));
    expect(feeForDailyOutflow(5e9)).toBeGreaterThan(feeForDailyOutflow(1e9));
  });

  it("agrees with running the chain's pool block by block for a whole day", () => {
    const usd = 3e9;
    const perBlock = usd / BLOCKS_PER_DAY;
    let delta = 0;
    let spread = 0;
    for (let block = 0; block < BLOCKS_PER_DAY; block++) {
      const swap = computeSwap({ delta, params: MAY_2022_MARKET, offer: "ust", amount: perBlock, lunaPriceUsd: 1 });
      spread = swap.spread;
      delta = replenishPool(swap.delta, MAY_2022_MARKET);
    }
    expect(feeForDailyOutflow(usd)).toBeCloseTo(spread, 3);
  });
});

describe("the slider of the door", () => {
  it("runs from the smallest to the largest outflow", () => {
    expect(outflowAt(0)).toBeCloseTo(DOOR_MIN_USD);
    expect(outflowAt(1)).toBeCloseTo(DOOR_MAX_USD);
  });

  it("finds its way back from an outflow to a position", () => {
    expect(doorPosition(outflowAt(0.37))).toBeCloseTo(0.37);
  });
});

describe("the real outflow of May 9", () => {
  it("is how much the supply of UST shrank between the snapshots of May 9 and May 10", () => {
    const [may9, may10] = [history.days[2].ustSupply, history.days[3].ustSupply];
    expect(MAY_9_OUTFLOW_USD).toBe(may9 - may10);
  });
});
