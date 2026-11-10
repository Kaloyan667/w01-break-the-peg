import Link from "next/link";
import { curveOf, type Crisis } from "@/engine/crises";
import { crisisRows, findings, type Row } from "../patterns/findings";
import { EIGHT } from "./copy";
import { Scene } from "./Scene";

const WIDTH = 100;
const HEIGHT = 56;
const TOP_PRICE = 1.05;

function sparkline(crisis: Crisis): string {
  const curve = curveOf(crisis.days);
  return curve.map((usd, day) => `${day === 0 ? "M" : "L"}${((day / (curve.length - 1)) * WIDTH).toFixed(2)} ${(((TOP_PRICE - usd) / TOP_PRICE) * HEIGHT).toFixed(2)}`).join("");
}

function Card({ crisis, measures }: Row) {
  const back = measures.daysToReturn !== null;
  return (
    <Link href={`/patterns#${crisis.id}`} className="rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg">
      <p className="font-[510]">{crisis.name}</p>
      <p className="text-sm text-fg-2">{crisis.when}</p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" className="mt-3 block h-14 w-full">
        <path d={sparkline(crisis)} fill="none" stroke={back ? "var(--text-2)" : "var(--signal)"} strokeWidth={2} strokeDasharray={back ? "5 4" : undefined} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <p className="mt-2 text-sm text-fg-2">{back ? `Back after ${measures.daysToReturn} ${measures.daysToReturn === 1 ? "day" : "days"}` : "Not back after 3 weeks"}</p>
    </Link>
  );
}

export function EightTimes() {
  const rows = crisisRows();
  const ordered = [...rows].sort((a, b) => Number(a.measures.daysToReturn === null) - Number(b.measures.daysToReturn === null));
  return (
    <Scene title={EIGHT.title} paragraphs={findings(rows).slice(0, 2)}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ordered.map((row) => (
          <Card key={row.crisis.id} {...row} />
        ))}
      </div>
      <p className="mt-4 text-sm text-fg-3">{EIGHT.note}</p>
    </Scene>
  );
}
