import { describe, expect, it } from "vitest";
import {
  burnToReachSpread,
  computeSwap,
  dailyBurnCapacityUsd,
  MAY_2022_MARKET,
  PROPOSAL_1164_MARKET,
  replenishPool,
  type MarketParams,
} from "./market";

// The worked example of Terra's market module spec: 1,000 / 1,000 pools, a swap of 100.
const SPEC_EXAMPLE: MarketParams = {
  basePoolSdr: 1000,
  poolRecoveryBlocks: 36,
  minSpread: 0.02,
  usdPerSdr: 1,
};

describe("computeSwap, UST to LUNA (a burn)", () => {
  it("matches the spec's constant-product example", () => {
    const swap = computeSwap({ delta: 0, params: SPEC_EXAMPLE, offer: "ust", amount: 100, lunaPriceUsd: 0.5 });
    expect(swap.spread).toBeCloseTo(1 - 90.90909 / 100, 4);
  });

  it("pays a dollar of LUNA per UST, minus the spread, whatever UST trades at", () => {
    const swap = computeSwap({ delta: 0, params: SPEC_EXAMPLE, offer: "ust", amount: 100, lunaPriceUsd: 0.5 });
    expect(swap.out).toBeCloseTo((100 * (1 - swap.spread)) / 0.5, 6);
  });

  it("charges the minimum spread on a small swap", () => {
    const swap = computeSwap({ delta: 0, params: SPEC_EXAMPLE, offer: "ust", amount: 0.001, lunaPriceUsd: 1 });
    expect(swap.spread).toBe(0.02);
  });

  it("widens the spread when earlier burns have filled the pool", () => {
    const fresh = computeSwap({ delta: 0, params: SPEC_EXAMPLE, offer: "ust", amount: 50, lunaPriceUsd: 1 });
    const filled = computeSwap({ delta: 400, params: SPEC_EXAMPLE, offer: "ust", amount: 50, lunaPriceUsd: 1 });
    expect(filled.spread).toBeGreaterThan(fresh.spread);
  });

  it("adds the whole offer, in SDR, to the pool delta", () => {
    const params = { ...SPEC_EXAMPLE, usdPerSdr: 2 };
    const swap = computeSwap({ delta: 10, params, offer: "ust", amount: 100, lunaPriceUsd: 1 });
    expect(swap.delta).toBeCloseTo(60, 9);
  });
});

describe("computeSwap, LUNA to UST (a mint)", () => {
  it("returns the LUNA's dollar value in UST, minus the spread", () => {
    const swap = computeSwap({ delta: 0, params: SPEC_EXAMPLE, offer: "luna", amount: 10, lunaPriceUsd: 10 });
    expect(swap.out).toBeCloseTo(100 * (1 - swap.spread), 6);
  });

  it("takes the UST paid out, after the spread, off the pool delta", () => {
    const swap = computeSwap({ delta: 0, params: SPEC_EXAMPLE, offer: "luna", amount: 10, lunaPriceUsd: 10 });
    expect(swap.delta).toBeCloseTo(-swap.out, 9);
  });
});

describe("replenishPool", () => {
  it("removes one recovery period's share of the delta each block", () => {
    expect(replenishPool(360, SPEC_EXAMPLE)).toBeCloseTo(350, 9);
  });
});

describe("burnToReachSpread", () => {
  it("returns the burn whose spread equals the target", () => {
    const amount = burnToReachSpread({ delta: 0, params: SPEC_EXAMPLE, targetSpread: 0.2 });
    const swap = computeSwap({ delta: 0, params: SPEC_EXAMPLE, offer: "ust", amount, lunaPriceUsd: 1 });
    expect(swap.spread).toBeCloseTo(0.2, 9);
  });

  it("returns nothing when the target is under the minimum spread", () => {
    expect(burnToReachSpread({ delta: 0, params: SPEC_EXAMPLE, targetSpread: 0.01 })).toBe(0);
  });

  it("returns nothing when the pool is already fuller than the target allows", () => {
    expect(burnToReachSpread({ delta: 900, params: SPEC_EXAMPLE, targetSpread: 0.05 })).toBe(0);
  });
});

describe("the limit announced during the crisis", () => {
  it("lands within 10% of the $293M a day quoted for May 2022", () => {
    const capacity = dailyBurnCapacityUsd(MAY_2022_MARKET);
    expect(Math.abs(capacity - 293e6) / 293e6).toBeLessThan(0.1);
  });

  it("lands within 10% of the $1.2B a day quoted for proposal 1164", () => {
    const capacity = dailyBurnCapacityUsd(PROPOSAL_1164_MARKET);
    expect(Math.abs(capacity - 1.2e9) / 1.2e9).toBeLessThan(0.1);
  });
});
