// The terminal's account of a day that has just been played.

import { GAME_SCENARIO, dailyLimitUsd, type DayResult } from "@/engine/game";
import type { Point } from "@/engine/simulate";
import { coins, money, price, supply } from "./format";

export const TRIGGER_CENTS = Math.round(GAME_SCENARIO.reserve.triggerPrice * 100);

export function dayLines(result: DayResult, close: Point): string[] {
  const { plan, spentUsd, burnedUst, printedLuna, spiralStarted } = result;
  const lines: string[] = [];

  if (plan.defendUsd > 0) {
    lines.push(
      spentUsd > 0
        ? `Bitcoin spent buying UST: ${money(spentUsd)} of ${money(plan.defendUsd)} committed.`
        : `${money(plan.defendUsd)} committed, none spent: UST stayed above ${TRIGGER_CENTS} cents.`,
    );
  }
  if (plan.mint) lines.push(`Proposal 1164 applied: the limit was ${money(dailyLimitUsd(true))} today.`);
  if (plan.bluff) lines.push("Yield raised: fewer deposits left Anchor today.");
  lines.push(burnedUst > 0 ? `The chain burned ${coins(burnedUst)} UST and printed ${supply(printedLuna).replace("Over", "over")} LUNA.` : "No UST was burned today.");
  lines.push(`Close: UST ${price(close.ustPrice)}, LUNA ${price(close.lunaPrice)}.`);
  if (spiralStarted) lines.push("All the LUNA is now worth less than all the UST. The death spiral has started.");

  return lines;
}
