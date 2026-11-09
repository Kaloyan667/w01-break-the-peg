// Runs the what-ifs across many worlds and commits the result: npm run odds
import { writeFileSync } from "node:fs";
import { rescueOdds } from "../src/engine/robustness";

const odds = rescueOdds(600);
writeFileSync(new URL("../src/data/rescue-odds.json", import.meta.url), `${JSON.stringify(odds, null, 2)}\n`);
console.log(odds);
