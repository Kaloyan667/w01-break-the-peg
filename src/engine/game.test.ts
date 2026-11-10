import { describe, expect, it } from "vitest";
import {
  DEFEND_STEP_USD,
  GAME_DAYS,
  GAME_SCENARIO,
  bluffStrength,
  crashReport,
  dailyLimitUsd,
  defend,
  newGame,
  nextDay,
  status,
  toggleBluff,
  toggleMint,
  type Game,
} from "./game";
import { MAY_2022_MARKET, PROPOSAL_1164_MARKET, dailyBurnCapacityUsd } from "./market";
import { simulate, type Point, type Scenario } from "./simulate";

const after = (game: Game, days: number) => {
  let g = game;
  for (let i = 0; i < days; i++) g = nextDay(g);
  return g;
};
const times = (game: Game, action: (g: Game) => Game, n: number) => {
  let g = game;
  for (let i = 0; i < n; i++) g = action(g);
  return g;
};

/** The morning of 9 May, the day of the second wave. */
const waveMorning = after(newGame(), 2);
const lastResult = (game: Game) => game.results.at(-1)!;

describe("a new game", () => {
  const game = newGame();

  it("starts from the figures of 7 May 2022", () => {
    expect(game.points[0].lunaPrice).toBe(78.55);
    expect(game.points[0].lunaSupply).toBe(345e6);
    expect(game.points[0].ustPrice).toBeCloseTo(1, 3);
  });

  it("gives the player $3 billion of bitcoin", () => {
    expect(game.points[0].reserveUsd).toBe(3e9);
  });

  it("is waiting for the first day", () => {
    expect(game.day).toBe(0);
    expect(status(game)).toBe("playing");
  });
});

describe("defending with bitcoin", () => {
  it("adds $500M to the day's budget each time", () => {
    expect(defend(defend(newGame())).plan.defendUsd).toBe(2 * DEFEND_STEP_USD);
  });

  it("cannot commit more than the reserve holds", () => {
    expect(times(newGame(), defend, 9).plan.defendUsd).toBe(3e9);
  });

  it("spends nothing on a day the price stays above the trigger", () => {
    const played = nextDay(defend(newGame()));
    expect(lastResult(played).spentUsd).toBe(0);
    expect(played.world.reserveUsd).toBe(3e9);
  });

  it("buys UST on the day of the wave", () => {
    expect(lastResult(nextDay(times(waveMorning, defend, 6))).spentUsd).toBeGreaterThan(0);
  });

  it("never spends more than the day's budget", () => {
    const played = nextDay(defend(waveMorning));
    expect(lastResult(played).spentUsd).toBeCloseTo(DEFEND_STEP_USD, 0);
  });

  it("starts each day with an empty budget", () => {
    expect(nextDay(defend(newGame())).plan.defendUsd).toBe(0);
  });
});

describe("minting more LUNA", () => {
  const withMint = nextDay(toggleMint(waveMorning));
  const without = nextDay(waveMorning);

  it("raises the daily limit to Proposal 1164's", () => {
    expect(dailyLimitUsd(false)).toBe(dailyBurnCapacityUsd(MAY_2022_MARKET));
    expect(dailyLimitUsd(true)).toBe(dailyBurnCapacityUsd(PROPOSAL_1164_MARKET));
  });

  it("burns more UST", () => {
    expect(lastResult(withMint).burnedUst).toBeGreaterThan(lastResult(without).burnedUst);
  });

  it("prints more LUNA", () => {
    expect(lastResult(withMint).printedLuna).toBeGreaterThan(lastResult(without).printedLuna);
  });

  it("can be switched back off", () => {
    expect(toggleMint(toggleMint(newGame())).plan.mint).toBe(false);
  });

  it("only lasts for the day", () => {
    expect(withMint.plan.mint).toBe(false);
  });
});

describe("raising the yield", () => {
  it("keeps more UST in Anchor", () => {
    const calmed = nextDay(toggleBluff(waveMorning));
    const without = nextDay(waveMorning);
    expect(calmed.points.at(-1)!.anchorDeposits).toBeGreaterThan(without.points.at(-1)!.anchorDeposits);
  });

  it("works less each time it is played", () => {
    const seen: number[] = [];
    let game = newGame();
    for (let i = 0; i < 4; i++) {
      seen.push(bluffStrength(game));
      game = nextDay(toggleBluff(game));
    }
    expect(seen).toEqual([0.5, 0.25, 0.1, 0]);
  });

  it("is only used up when the day is played", () => {
    expect(bluffStrength(toggleBluff(toggleBluff(newGame())))).toBe(0.5);
  });
});

describe("the next day", () => {
  it("adds 24 hours", () => {
    const played = nextDay(newGame());
    expect(played.day).toBe(1);
    expect(played.points).toHaveLength(25);
    expect(played.points.at(-1)!.hour).toBe(24);
  });

  it("leaves the game it was given alone", () => {
    const game = defend(newGame());
    const before = structuredClone(game);
    nextDay(game);
    expect(game).toEqual(before);
  });

  it("follows the engine exactly when the player does nothing", () => {
    const engine: Scenario = {
      ...GAME_SCENARIO,
      chainHaltDay: 6,
      reserve: { ...GAME_SCENARIO.reserve, maxSpendPerDayUsd: 0 },
    };
    expect(after(newGame(), GAME_DAYS).points).toEqual(simulate(engine).points);
  });

  it("adds up the UST burned", () => {
    const played = after(newGame(), 4);
    const burned = played.results.reduce((sum, { burnedUst }) => sum + burnedUst, 0);
    expect(burned).toBeCloseTo(played.world.ustBurned, 0);
  });

  it("shows the UST waiting for a buyer", () => {
    expect(nextDay(waveMorning).points.at(-1)!.unsoldUst).toBeGreaterThan(0);
  });
});

describe("the death spiral", () => {
  const firstUncovered = (points: Point[]) => points.find((p) => p.lunaMarketCap < p.ustSupply)!.hour;
  const spiralling = after(newGame(), 4);
  const finished = after(newGame(), GAME_DAYS);

  it("starts when all the LUNA is worth less than all the UST", () => {
    expect(status(spiralling)).toBe("spiral");
    expect(spiralling.world.spiralHour).toBe(firstUncovered(spiralling.points));
  });

  it("takes the controls away from the player", () => {
    expect(defend(spiralling)).toBe(spiralling);
    expect(toggleMint(spiralling)).toBe(spiralling);
    expect(toggleBluff(spiralling)).toBe(spiralling);
  });

  it("ends the week", () => {
    expect(status(finished)).toBe("over");
    expect(nextDay(finished)).toBe(finished);
  });

  it("prints LUNA by the billion and sinks both coins", () => {
    const last = finished.points.at(-1)!;
    expect(last.lunaSupply).toBeGreaterThan(1e9);
    expect(last.lunaPrice).toBeLessThan(0.01);
    expect(last.ustPrice).toBeLessThan(0.8);
  });
});

describe("what the player can learn", () => {
  const spiralHour = (game: Game) => game.world.spiralHour ?? Infinity;

  it("gets further by spending everything at once than a little every day", () => {
    let drip = newGame();
    for (let day = 0; day < GAME_DAYS; day++) drip = nextDay(defend(drip));
    const allIn = after(nextDay(times(waveMorning, defend, 6)), GAME_DAYS - 3);
    expect(spiralHour(allIn)).toBeGreaterThan(spiralHour(drip));
  });

  it("reaches the spiral sooner by minting all week", () => {
    let printing = newGame();
    for (let day = 0; day < GAME_DAYS; day++) printing = nextDay(toggleMint(printing));
    expect(spiralHour(printing)).toBeLessThan(spiralHour(after(newGame(), GAME_DAYS)));
  });
});

describe("the crash report", () => {
  const finished = after(newGame(), GAME_DAYS);
  const report = crashReport(finished);
  const value = (p: Point) => p.ustPrice * p.ustSupply + p.lunaMarketCap;

  it("says the peg broke", () => {
    expect(report.outcome).toBe("spiral");
  });

  it("counts the hours until LUNA stopped covering UST", () => {
    expect(report.hoursHeld).toBe(finished.world.spiralHour);
  });

  it("measures the value erased", () => {
    expect(report.capitalErasedUsd).toBeCloseTo(value(finished.points[0]) - value(finished.points.at(-1)!), 0);
  });

  it("counts the bitcoin spent", () => {
    const spent = after(nextDay(times(waveMorning, defend, 6)), GAME_DAYS - 3);
    const { reserveSpentUsd } = crashReport(spent);
    expect(reserveSpentUsd).toBeCloseTo(3e9 - spent.world.reserveUsd, 0);
  });

  it("recognises a week without any crisis", () => {
    const calm = crashReport(after(newGame({ ...GAME_SCENARIO, shocks: [] }), GAME_DAYS));
    expect(calm.outcome).toBe("held");
    expect(calm.hoursHeld).toBe(168);
  });

  it("recognises a week that ends with the peg still broken", () => {
    const lateCrash: Scenario = {
      ...GAME_SCENARIO,
      shocks: [{ day: 6.95, ustSold: 6e9 }],
      behavior: { ...GAME_SCENARIO.behavior, anchorFleePerDay: 0, walletFleePerDay: 0 },
    };
    expect(crashReport(after(newGame(lateCrash), GAME_DAYS)).outcome).toBe("limped");
  });
});
