// Two ratios for each day of the May 2022 replay. c is how much of the UST all the LUNA covers. k is
// what each dollar of UST leaving costs LUNA in value. When k is above c, the cover ratio is falling:
// LUNA loses value faster than the debt it stands behind shrinks.

import type { Point } from "./simulate";

const HOURS_PER_DAY = 24;

export type HistoryDay = { date: string; day: number; ustPrice: number; lunaPrice: number; ustSupply: number };

export type CoverRow = {
  day: number;
  date: string;
  realUstPrice: number;
  realLunaPrice: number;
  realUstSupply: number;
  modelUstPrice: number;
  modelLunaPrice: number;
  modelLunaSupply: number;
  modelLunaCap: number;
  modelUstSupply: number;
  c: number;
  /** Null on the first day, and on days the UST supply did not fall. */
  k: number | null;
  kAboveC: boolean;
  firstKAboveC: boolean;
};

export function coverRows(points: Point[], history: HistoryDay[]): CoverRow[] {
  const at = (day: HistoryDay) => points[day.day * HOURS_PER_DAY];
  const rows = history.map((real, index): CoverRow => {
    const point = at(real);
    const before = index > 0 ? at(history[index - 1]) : null;
    const ustFall = before ? before.ustSupply - point.ustSupply : 0;
    const c = point.lunaMarketCap / point.ustSupply;
    const k = before && ustFall > 0 ? (before.lunaMarketCap - point.lunaMarketCap) / ustFall : null;
    return {
      day: real.day,
      date: real.date,
      realUstPrice: real.ustPrice,
      realLunaPrice: real.lunaPrice,
      realUstSupply: real.ustSupply,
      modelUstPrice: point.ustPrice,
      modelLunaPrice: point.lunaPrice,
      modelLunaSupply: point.lunaSupply,
      modelLunaCap: point.lunaMarketCap,
      modelUstSupply: point.ustSupply,
      c,
      k,
      kAboveC: k !== null && k > c,
      firstKAboveC: false,
    };
  });
  const first = rows.findIndex((row) => row.kAboveC);
  return rows.map((row, index) => ({ ...row, firstKAboveC: index === first }));
}

type Column = { name: string; origin: "real" | "model" | "index"; detail: string; value: (row: CoverRow) => number | string | boolean | null };

export const COLUMNS: Column[] = [
  { name: "day", origin: "index", detail: "Days since May 7, 2022.", value: (r) => r.day },
  { name: "date", origin: "index", detail: "Calendar date, around 00:00 UTC.", value: (r) => r.date },
  { name: "real_ust_price_usd", origin: "real", detail: "Daily price, DefiLlama (coins.llama.fi).", value: (r) => r.realUstPrice },
  { name: "real_luna_price_usd", origin: "real", detail: "Daily price, DefiLlama (coins.llama.fi).", value: (r) => r.realLunaPrice },
  { name: "real_ust_supply_usd", origin: "real", detail: "DefiLlama until May 11, then the Terra chain's own series.", value: (r) => r.realUstSupply },
  { name: "model_ust_price_usd", origin: "model", detail: "Engine output, as-happened scenario.", value: (r) => r.modelUstPrice },
  { name: "model_luna_price_usd", origin: "model", detail: "Engine output, as-happened scenario.", value: (r) => r.modelLunaPrice },
  { name: "model_luna_supply", origin: "model", detail: "Engine output, starting from 345M LUNA. No real daily series exists in the data.", value: (r) => r.modelLunaSupply },
  { name: "model_luna_cap_usd", origin: "model", detail: "Engine output: model price times model supply.", value: (r) => r.modelLunaCap },
  { name: "model_ust_supply_usd", origin: "model", detail: "Engine output, as-happened scenario.", value: (r) => r.modelUstSupply },
  { name: "model_c", origin: "model", detail: "model_luna_cap_usd divided by model_ust_supply_usd.", value: (r) => r.c },
  { name: "model_k", origin: "model", detail: "Day-on-day fall in model_luna_cap_usd divided by the fall in model_ust_supply_usd. Empty when the UST supply did not fall.", value: (r) => r.k },
  { name: "model_k_gt_c", origin: "model", detail: "True when model_k is above model_c.", value: (r) => r.kAboveC },
  { name: "model_first_k_gt_c", origin: "model", detail: "True on the first day model_k is above model_c.", value: (r) => r.firstKAboveC },
];

export function toCsv(rows: CoverRow[]): string {
  const header = COLUMNS.map((column) => column.name).join(",");
  const lines = rows.map((row) => COLUMNS.map((column) => column.value(row) ?? "").join(","));
  return `${[header, ...lines].join("\n")}\n`;
}
