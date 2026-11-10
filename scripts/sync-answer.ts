// Copies answer.md to the top of README.md. Run it with `npm run answer` after editing answer.md.
import { readFileSync, writeFileSync } from "node:fs";
import { withAnswer } from "../src/app/lab/answer";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

writeFileSync(new URL("../README.md", import.meta.url), withAnswer(read("README.md"), read("answer.md")));
console.log("README.md now carries the text of answer.md.");
