import type { CrashReport } from "@/engine/game";
import { challengeUrl } from "./challenge";
import { held } from "./format";

/** The post people send from the crash report. Its figures are the player's own simulated run. */
export function shareText(report: CrashReport): string {
  return `I tried to save UST in a simulation of May 2022 and held for ${held(report.hoursHeld)}. Can you beat it?`;
}

/** `code` is the player's run, so that whoever follows the link plays against it. */
export function shareUrl(report: CrashReport, code: string): string {
  const params = new URLSearchParams({ text: shareText(report), url: challengeUrl(code) });
  return `https://x.com/intent/post?${params}`;
}
