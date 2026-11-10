import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Story } from "./story/Story";

export default function Home() {
  return <Story answer={readFileSync(join(process.cwd(), "answer.md"), "utf8")} />;
}
