import type { Point } from "@/engine/simulate";
import { money, percent, price, supply } from "./format";

/** UST is drawn in the signal colour from this price down: the peg is visibly in trouble. */
const OFF_PEG = 0.97;
/** The right end of the cover line, as a multiple of the UST supply. */
const COVER_SCALE = 1.5;

function Stat({ label, value, note, alert = false, large = false }: { label: string; value: string; note: string; alert?: boolean; large?: boolean }) {
  return (
    <div>
      <p className="text-sm text-fg-2">{label}</p>
      <p className={`mt-1 font-[510] tracking-[-0.02em] tabular-nums ${large ? "text-5xl" : "text-2xl"} ${alert ? "text-signal" : "text-fg"}`}>{value}</p>
      <p className="mt-1 text-sm text-fg-3">{note}</p>
    </div>
  );
}

function PanicMeter({ panic }: { panic: number }) {
  return (
    <div>
      <p className="text-sm text-fg-2">Panic</p>
      <p className="mt-1 text-2xl font-[510] tracking-[-0.02em] tabular-nums">{percent(panic)}</p>
      <div role="meter" aria-label="Panic" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(panic * 100)} className="mt-3 h-1.5 rounded-full bg-line">
        <div className="h-full rounded-full bg-signal" style={{ width: percent(panic) }} />
      </div>
    </div>
  );
}

export function Metrics({ point, committedUsd }: { point: Point; committedUsd: number }) {
  return (
    <section aria-label="Market" className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-line py-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
      <div className="col-span-2 lg:col-span-1">
        <Stat label="UST price" value={price(point.ustPrice)} note="Target $1.00" alert={point.ustPrice < OFF_PEG} large />
      </div>
      <Stat label="LUNA price" value={price(point.lunaPrice)} note={`Worth ${money(point.lunaMarketCap)} in all`} />
      <Stat label="LUNA supply" value={supply(point.lunaSupply)} note="Coins in circulation" />
      <Stat label="Bitcoin reserve" value={money(point.reserveUsd)} note={committedUsd > 0 ? `${money(committedUsd)} committed today` : "Emergency fund"} />
      <PanicMeter panic={point.panic} />
    </section>
  );
}

/** The one number that decides the game: how far LUNA still is from no longer covering UST. */
export function CoverLine({ point }: { point: Point }) {
  const cover = point.lunaMarketCap / point.ustSupply;
  const lost = cover < 1;
  return (
    <section aria-label="LUNA cover" className="py-4">
      <p className="text-fg-2">
        All the LUNA is worth <span className={`font-[510] tabular-nums ${lost ? "text-signal" : "text-fg"}`}>{percent(cover)}</span> of all the UST
      </p>
      <div role="meter" aria-label="LUNA cover" aria-valuemin={0} aria-valuemax={150} aria-valuenow={Math.round(Math.min(cover, COVER_SCALE) * 100)} className="relative mt-3 h-2 rounded-full bg-line">
        <div className={`h-full rounded-full ${lost ? "bg-signal" : "bg-fg"}`} style={{ width: `${Math.min(cover / COVER_SCALE, 1) * 100}%` }} />
        <i aria-hidden className="absolute -top-1.5 h-5 w-0.5 rounded-full bg-signal" style={{ left: `${(1 / COVER_SCALE) * 100}%` }} />
      </div>
      <p className="mt-2 text-sm text-fg-3" style={{ paddingLeft: `calc(${(1 / COVER_SCALE) * 100}% - 5.5rem)` }}>
        Under 100%, this game ends
      </p>
    </section>
  );
}
