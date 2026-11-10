// The trade that held UST at a dollar, priced with Terra's real swap.

import history from "@/data/may-2022.json";
import { MAY_2022_MARKET, computeSwap } from "@/engine/market";

export const TRADE_UST = 1000;
const LUNA_PRICE = history.days[0].lunaPrice;
/** Under this, a profit is only rounding. */
const SMALLEST_PROFIT_USD = 0.005;

export function quoteTrade(ustPrice: number) {
  const { out: lunaOut, spread: fee } = computeSwap({
    delta: 0,
    params: MAY_2022_MARKET,
    offer: "ust",
    amount: TRADE_UST,
    lunaPriceUsd: LUNA_PRICE,
  });
  const costUsd = TRADE_UST * ustPrice;
  const soldUsd = lunaOut * LUNA_PRICE;
  const profitUsd = soldUsd - costUsd;
  return { costUsd, fee, lunaOut, soldUsd, profitUsd, worthIt: profitUsd > SMALLEST_PROFIT_USD };
}
