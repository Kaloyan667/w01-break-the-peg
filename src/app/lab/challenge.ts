// A run written down in seven characters. The game has no randomness, so the moves alone replay it
// exactly: a challenge needs no server and no database.

import { DEFEND_STEP_USD, GAME_DAYS, defend, newGame, nextDay, toggleBluff, toggleMint, type DayResult, type Game } from "@/engine/game";
import { week } from "@/week";

export type DayMoves = { presses: number; mint: boolean; bluff: boolean };
export type Verdict = "won" | "lost" | "tied";

/** One character per day: presses of the defend button (0 to 6) times 4, plus 2 for mint and 1 for bluff. */
const CODE = new RegExp(`^[0-9a-r]{${GAME_DAYS}}$`);

export function encodeRun(results: DayResult[]): string {
  return results
    .map(({ plan }) => (Math.ceil(plan.defendUsd / DEFEND_STEP_USD) * 4 + (plan.mint ? 2 : 0) + (plan.bluff ? 1 : 0)).toString(36))
    .join("");
}

export function decodeRun(code: string): DayMoves[] | null {
  if (!CODE.test(code)) return null;
  return [...code].map((character) => {
    const value = parseInt(character, 36);
    return { presses: Math.floor(value / 4), mint: (value & 2) !== 0, bluff: (value & 1) !== 0 };
  });
}

export function replayRun(moves: DayMoves[]): Game {
  return moves.reduce((game, { presses, mint, bluff }) => {
    let today = game;
    for (let press = 0; press < presses; press++) today = defend(today);
    if (mint) today = toggleMint(today);
    if (bluff) today = toggleBluff(today);
    return nextDay(today);
  }, newGame());
}

export const challengeUrl = (code: string) => `${week.url}/#beat=${code}`;

export const codeFromHash = (hash: string) => /^#beat=(.+)$/.exec(hash)?.[1] ?? null;

export function verdict(yourHours: number, theirHours: number): Verdict {
  if (yourHours === theirHours) return "tied";
  return yourHours > theirHours ? "won" : "lost";
}
