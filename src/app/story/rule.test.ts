import { describe, expect, it } from "vitest";
import { quoteTrade } from "./rule";

describe("the trade that held the peg", () => {
  it("buys 1,000 UST at the market price", () => {
    expect(quoteTrade(0.95).costUsd).toBeCloseTo(950);
  });

  it("pays a dollar of LUNA per UST, minus Terra's 2% fee", () => {
    const { fee, soldUsd, lunaOut } = quoteTrade(0.95);
    expect(fee).toBeCloseTo(0.02);
    expect(soldUsd).toBeCloseTo(980);
    expect(lunaOut).toBeCloseTo(980 / 78.55);
  });

  it("makes money when UST is cheaper than the fee allows", () => {
    expect(quoteTrade(0.95)).toMatchObject({ worthIt: true });
    expect(quoteTrade(0.95).profitUsd).toBeCloseTo(30);
  });

  it("is not worth doing once the fee eats the discount", () => {
    expect(quoteTrade(0.99)).toMatchObject({ worthIt: false });
    expect(quoteTrade(0.98)).toMatchObject({ worthIt: false });
  });
});
