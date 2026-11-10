"use client";

import { useState } from "react";
import { coins, money, price, ratio } from "../lab/format";
import { RULE } from "./copy";
import { TRADE_UST, quoteTrade } from "./rule";
import { BUTTON, PANEL, Scene, Sources } from "./Scene";

const signed = (usd: number) => (usd < 0 ? `-${money(Math.round(-usd))}` : money(Math.round(usd)));

function Step({ label, value, detail, strong }: { label: string; value: string; detail: string; strong?: boolean }) {
  return (
    <div className="border-t border-line pt-3">
      <p className="text-sm text-fg-2">{label}</p>
      <p className={`mt-1 font-[510] tracking-[-0.025em] tabular-nums ${strong ? "text-5xl text-signal" : "text-3xl"}`}>{value}</p>
      <p className="mt-1 text-sm text-fg-2">{detail}</p>
    </div>
  );
}

export function TheRule() {
  const [ustPrice, setUstPrice] = useState(0.95);
  const [totals, setTotals] = useState({ burned: 0, printed: 0, profit: 0 });
  const quote = quoteTrade(ustPrice);

  const trade = () => setTotals(({ burned, printed, profit }) => ({ burned: burned + TRADE_UST, printed: printed + quote.lunaOut, profit: profit + quote.profitUsd }));

  return (
    <Scene title={RULE.title} paragraphs={RULE.paragraphs}>
      <div className={PANEL}>
        <label className="block max-w-md">
          <span className="flex items-baseline justify-between">
            <span className="text-fg-2">{RULE.slider}</span>
            <span className="text-xl font-[510] tabular-nums">{price(ustPrice)}</span>
          </span>
          <input type="range" min={0.8} max={1} step={0.01} value={ustPrice} onChange={(event) => setUstPrice(Number(event.target.value))} className="mt-2 w-full accent-[var(--signal)]" />
        </label>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Step label="You buy" value={`${coins(TRADE_UST)} UST`} detail={`for ${money(Math.round(quote.costUsd))}`} />
          <Step label="The chain destroys them and prints" value={`${ratio(quote.lunaOut)} LUNA`} detail={`you sell it for ${money(Math.round(quote.soldUsd))} after a ${Math.round(quote.fee * 100)}% fee`} />
          <Step label="You keep" value={signed(quote.profitUsd)} detail={quote.worthIt ? "for no risk at all" : RULE.notWorthIt} strong={quote.worthIt} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button type="button" onClick={trade} disabled={!quote.worthIt} className={BUTTON}>
            {RULE.button}
          </button>
          {totals.burned > 0 && (
            <p role="status" className="text-fg-2 tabular-nums">
              You destroyed {coins(totals.burned)} UST. The chain printed {ratio(totals.printed)} new LUNA. You made {money(Math.round(totals.profit))}.
            </p>
          )}
        </div>
      </div>
      <p className="mt-5 max-w-[38em] text-[clamp(1.0625rem,1.45vw,1.25rem)] leading-[1.45] text-pretty">{RULE.after}</p>
      <Sources sources={RULE.sources} />
    </Scene>
  );
}
