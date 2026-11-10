import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Lab } from "./lab/Lab";

export default function Home() {
  return <Lab answer={readFileSync(join(process.cwd(), "answer.md"), "utf8")} />;
}
