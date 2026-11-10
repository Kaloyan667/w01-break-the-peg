// A played day in plain words, for someone who has never heard of LUNA.

import type { DayResult } from "@/engine/game";
import type { Point } from "@/engine/simulate";
import { money, percent } from "./format";

/** Under this, the UST waiting for a buyer is not worth mentioning. */
const NOTABLE_QUEUE = 1e6;

function growth(open: number, close: number): string {
  const ratio = close / open;
  if (ratio >= 1000) return "exploded";
  if (ratio >= 2) return `was multiplied by ${ratio.toFixed(1)}`;
  return `grew ${percent(ratio - 1)}`;
}

export function explainDay({ spentUsd, burnedUst }: DayResult, open: Point, close: Point): string {
  const parts: string[] = [];

  if (spentUsd > 0) parts.push(`Your bitcoin spent ${money(spentUsd)} buying UST off the market.`);

  if (burnedUst > 0) {
    parts.push(
      `UST was cheap, so traders swapped it for newly printed LUNA and sold that LUNA. Its supply ${growth(open.lunaSupply, close.lunaSupply)} and its price fell ${percent(1 - close.lunaPrice / open.lunaPrice)}.`,
    );
    parts.push(`All the LUNA now covers ${percent(close.lunaMarketCap / close.ustSupply)} of all the UST.`);
  } else if (close.unsoldUst > NOTABLE_QUEUE) {
    parts.push(`${money(close.unsoldUst)} of UST is looking for a buyer, but the price barely moved, so nobody has a reason to swap it for LUNA yet.`);
  } else if (spentUsd === 0) {
    parts.push("A quiet day: nobody is selling, and the price holds.");
  }

  return parts.join(" ");
}
