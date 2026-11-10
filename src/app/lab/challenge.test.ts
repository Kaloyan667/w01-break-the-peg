import { describe, expect, it } from "vitest";
import { crashReport, defend, newGame, nextDay, toggleBluff, toggleMint, type Game } from "@/engine/game";
import { challengeUrl, codeFromHash, decodeRun, encodeRun, replayRun, verdict } from "./challenge";

function finish(game: Game): Game {
  let played = game;
  while (played.day < 7) played = nextDay(played);
  return played;
}

const idle = finish(newGame());

function busyGame(): Game {
  let game = nextDay(newGame());
  game = nextDay(toggleBluff(game));
  game = nextDay(toggleMint(defend(defend(game))));
  return finish(game);
}

describe("writing a run down", () => {
  it("takes one character per day", () => {
    expect(encodeRun(idle.results)).toHaveLength(7);
  });

  it("reads back the same moves", () => {
    const game = busyGame();
    expect(decodeRun(encodeRun(game.results))).toEqual(
      game.results.map(({ plan }) => ({ presses: plan.defendUsd / 500e6, mint: plan.mint, bluff: plan.bluff })),
    );
  });

  it.each(["", "000", "00000000", "00000!0", "z000000", "s000000"])("refuses the code %j", (code) => {
    expect(decodeRun(code)).toBeNull();
  });
});

describe("replaying a run from its code", () => {
  it("lands on the same result as the game that was played", () => {
    const game = busyGame();
    const moves = decodeRun(encodeRun(game.results))!;
    expect(crashReport(replayRun(moves)).hoursHeld).toBe(crashReport(game).hoursHeld);
  });
});

describe("the challenge link", () => {
  it("points at the game with the code in the hash", () => {
    expect(challengeUrl("0a00000")).toBe("https://w01.hemera.one/#beat=0a00000");
  });

  it("finds the code in the hash of the page", () => {
    expect(codeFromHash("#beat=0a00000")).toBe("0a00000");
    expect(codeFromHash("#play")).toBeNull();
    expect(codeFromHash("")).toBeNull();
  });
});

describe("comparing two runs", () => {
  it.each([
    [100, 80, "won"],
    [80, 100, "lost"],
    [80, 80, "tied"],
  ] as const)("holding %d hours against %d is %s", (yours, theirs, expected) => {
    expect(verdict(yours, theirs)).toBe(expected);
  });
});
