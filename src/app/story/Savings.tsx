import { SCENARIOS } from "@/engine/scenarios";
import { money, percent } from "../lab/format";
import { SAVINGS } from "./copy";
import { Scene, Sources } from "./Scene";

const { start, shocks } = SCENARIOS.asHappened.scenario;
const TOTAL = start.ustSupply;
const IN_ANCHOR = start.anchorDeposits;
const FIRST_WITHDRAWAL = shocks[0].ustSold;

const share = (usd: number) => `${(usd / TOTAL) * 100}%`;

/** All the UST of May 7, 2022, drawn to scale. */
export function Savings() {
  return (
    <Scene title={SAVINGS.title} paragraphs={SAVINGS.paragraphs}>
      <div role="img" aria-label={`Of ${money(TOTAL)} of UST, ${money(IN_ANCHOR)} sat in Anchor. The first withdrawal was ${money(FIRST_WITHDRAWAL)}.`} className="relative flex h-24 gap-0.5 overflow-hidden rounded-lg">
        <div className="bg-fg" style={{ width: share(IN_ANCHOR) }} />
        <div className="flex-1 bg-fg/25" />
        <div className="absolute inset-y-0 left-0 border-r-2 border-bg bg-signal" style={{ width: share(FIRST_WITHDRAWAL) }} />
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-x-8 gap-y-2 text-fg-2">
        <p>
          <span className="font-[510] text-fg tabular-nums">{money(FIRST_WITHDRAWAL)}</span> pulled out on May 7
        </p>
        <p>
          <span className="font-[510] text-fg tabular-nums">{money(IN_ANCHOR)}</span> in Anchor, {percent(IN_ANCHOR / TOTAL)} of all UST
        </p>
        <p>
          <span className="font-[510] text-fg tabular-nums">{money(TOTAL - IN_ANCHOR)}</span> everywhere else
        </p>
      </div>
      <Sources sources={SAVINGS.sources} />
    </Scene>
  );
}
