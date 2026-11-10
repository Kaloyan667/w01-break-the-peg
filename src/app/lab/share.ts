import type { CrashReport } from "@/engine/game";
import { week } from "@/week";
import { held } from "./format";

const GAME_URL = `${week.url}/lab`;

/** The post people send from the crash report. Its figures are the player's own simulated run. */
export function shareText(report: CrashReport): string {
  // TODO(human): write the post in your own words, with the numbers from `report` that tell the story.
  return `I tried to save UST in a simulation of May 2022 and held for ${held(report.hoursHeld)}.`;
}

export function shareUrl(report: CrashReport): string {
  const params = new URLSearchParams({ text: shareText(report), url: GAME_URL });
  return `https://x.com/intent/post?${params}`;
}
