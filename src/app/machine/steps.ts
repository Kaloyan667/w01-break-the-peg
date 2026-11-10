// One block of the chain, told step by step with its real numbers.

import type { BlockTrace, Scenario } from "@/engine/simulate";
import { coins, money, percent, price } from "../lab/format";

export type Step = {
  title: string;
  /** Who decides this step: the chain's code, or our guess about people. */
  source: "Terra's rule" | "Assumption" | "The reserve";
  formula: string;
  numbers: string;
  result: string;
};

const START_OF_RUN = Date.UTC(2022, 4, 7);
const SECONDS_PER_BLOCK = 6;

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" });

export function timeOfBlock(block: number): string {
  const parts = dateFormat.formatToParts(new Date(START_OF_RUN + block * SECONDS_PER_BLOCK * 1000));
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("month").slice(0, 3)} ${part("day")}, ${part("hour")}:${part("minute")} UTC`;
}

export function blockSteps(trace: BlockTrace, { behavior, market, reserve }: Scenario): Step[] {
  const left = trace.leftAnchorUst + trace.leftWalletsUst;
  return [
    {
      title: "Sellers show up",
      source: "Assumption",
      formula: "for sale = for sale + wave",
      numbers: `${money(trace.unsoldOpen - trace.waveUst)} + ${money(trace.waveUst)}`,
      result: trace.waveUst > 0 ? `A wave of ${money(trace.waveUst)} hits in this block.` : "No wave in this block.",
    },
    {
      title: "The market quotes a price",
      source: "Assumption",
      formula: "price = 1 ÷ (1 + (for sale ÷ depth)³)",
      numbers: `1 ÷ (1 + (${money(trace.unsoldOpen)} ÷ ${money(trace.depthUsd)})³)`,
      result: `UST is worth ${price(trace.priceOpen)}.`,
    },
    {
      title: "Panic catches up",
      source: "Assumption",
      formula: "panic = panic + (target − panic) ÷ lag",
      numbers: `target ${percent(trace.targetPanic)}, lag ${Math.round(behavior.panicLagBlocks)} blocks`,
      result: `Panic is at ${percent(trace.panic)}.`,
    },
    {
      title: "Holders run",
      source: "Assumption",
      formula: "leaving = deposits × flight × panic × fear ÷ 14,400",
      numbers: `Anchor ${money(trace.leftAnchorUst)}, wallets ${money(trace.leftWalletsUst)}, fear ×${trace.fearMultiple.toFixed(2)}`,
      result: `${money(left)} more UST goes up for sale.`,
    },
    {
      title: "The reserve buys",
      source: "The reserve",
      formula: `buy while price < ${price(reserve.triggerPrice)}`,
      numbers: `price ${price(trace.priceAfterRun)}`,
      result: trace.reserveSpentUsd > 0 ? `It spends ${money(trace.reserveSpentUsd)} and buys ${coins(trace.reserveBoughtUst)} UST.` : "Nothing: the price is high enough, or the money is gone.",
    },
    {
      title: "Arbitrageurs burn UST",
      source: "Terra's rule",
      formula: `fee = max((offer − ask) ÷ offer, ${percent(market.minSpread)})`,
      numbers: `burn until the fee eats the ${percent(1 - trace.priceAfterReserve)} discount`,
      result: trace.burnedUst > 0 ? `${coins(trace.burnedUst)} UST burned, paying ${percent(trace.fee)} on average.` : "Nothing: the discount is smaller than the fee.",
    },
    {
      title: "The chain prints LUNA",
      source: "Terra's rule",
      formula: "LUNA = UST × (1 − fee) ÷ LUNA price",
      numbers: `${coins(trace.burnedUst)} × (1 − ${percent(trace.fee)}) ÷ ${price(trace.lunaPriceOpen)}`,
      result: trace.printedLuna > 0 ? `${coins(trace.printedLuna)} new LUNA.` : "No new LUNA.",
    },
    {
      title: "The new LUNA is sold",
      source: "Assumption",
      formula: "value = value × e^(−impact × sold ÷ value)",
      numbers: `${money(trace.lunaCapOpen)}, impact ${behavior.lunaSellImpact.toFixed(2)}, sold ${money(trace.lunaSoldUsd)}`,
      result: `All the LUNA is now worth ${money(trace.lunaCapClose)}, at ${price(trace.lunaPriceClose)} each.`,
    },
    {
      title: "The pool forgets",
      source: "Terra's rule",
      formula: `delta = delta − delta ÷ ${market.poolRecoveryBlocks}`,
      numbers: `${coins(trace.deltaBeforeRecovery)} SDR, after ${market.poolRecoveryBlocks} blocks it has mostly recovered`,
      result: `The fee falls back a little: delta is ${coins(trace.deltaClose)} SDR.`,
    },
  ];
}
