import { CRISES, measure, type Crisis, type Measures } from "@/engine/crises";
import { percent } from "../lab/format";

export type Row = { crisis: Crisis; measures: Measures };

export const crisisRows = (): Row[] => CRISES.map((crisis) => ({ crisis, measures: measure(crisis) }));

function range(values: number[]): string {
  const low = percent(Math.min(...values));
  const high = percent(Math.max(...values));
  return low === high ? low : `${low} to ${high}`;
}

/** What the grid shows, written from the data so that the sentences cannot drift from the table. */
export function findings(rows: Row[]): string[] {
  const back = rows.filter(({ measures }) => measures.daysToReturn !== null);
  const gone = rows.filter(({ measures }) => measures.daysToReturn === null);
  const slowest = Math.max(...back.map(({ measures }) => measures.daysToReturn!));
  const fell = (group: Row[]) => group.flatMap(({ measures }) => (measures.backingFell === null ? [] : [measures.backingFell]));
  return [
    `${back.length} coins came back to 99 cents, the slowest after ${slowest} days. The other ${gone.length} were not back three weeks later.`,
    `Coins leaning on a token of their own: the ones that came back saw that token lose ${range(fell(back))}, the others ${range(fell(gone))}.`,
    "Outside assets did not protect everyone: USDC and DAI came back, but USDR's real estate could not be sold fast enough once its liquid DAI ran out.",
  ];
}
