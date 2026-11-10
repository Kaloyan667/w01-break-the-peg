// Writes c and k for each day of the May 2022 replay to reports/may-2022-cover.csv. Run with `npm run cover`.
import { mkdirSync, writeFileSync } from "node:fs";
import history from "../src/data/may-2022.json";
import { COLUMNS, coverRows, toCsv } from "../src/engine/coverReplay";
import { SCENARIOS } from "../src/engine/scenarios";
import { simulate } from "../src/engine/simulate";

const rows = coverRows(simulate(SCENARIOS.asHappened.scenario).points, history.days);

const folder = new URL("../reports/", import.meta.url);
mkdirSync(folder, { recursive: true });
writeFileSync(new URL("may-2022-cover.csv", folder), toCsv(rows));

console.log("date        c      k");
for (const { date, c, k, firstKAboveC } of rows) {
  console.log(`${date}  ${c.toFixed(3).padStart(5)}  ${(k === null ? "-" : k.toFixed(3)).padStart(8)}${firstKAboveC ? "   <- first day k > c" : ""}`);
}

const first = rows.find((row) => row.firstKAboveC);
console.log(first ? `\nFirst day k > c: ${first.date} (k ${first.k!.toFixed(3)}, c ${first.c.toFixed(3)})` : "\nk never rises above c.");

console.log("\nWhere each column comes from:");
for (const { name, origin, detail } of COLUMNS) console.log(`${origin.padEnd(6)} ${name.padEnd(22)} ${detail}`);
