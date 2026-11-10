import { describe, expect, it } from "vitest";
import { MACHINE_SCENARIO, machineAt } from "@/engine/machine";
import { BLOCKS_PER_DAY } from "@/engine/market";
import { blockSteps, timeOfBlock } from "./steps";

const wave = Math.round(MACHINE_SCENARIO.shocks[1].day * BLOCKS_PER_DAY);
const steps = blockSteps(machineAt(MACHINE_SCENARIO, wave).trace, MACHINE_SCENARIO);
const step = (title: string) => steps.find((s) => s.title === title)!;

describe("the steps of a block", () => {
  it("come in the order the chain runs them", () => {
    expect(steps.map((s) => s.title)).toEqual([
      "Sellers show up",
      "The market quotes a price",
      "Panic catches up",
      "Holders run",
      "The reserve buys",
      "Arbitrageurs burn UST",
      "The chain prints LUNA",
      "The new LUNA is sold",
      "The pool forgets",
    ]);
  });

  it("say what is a rule of the chain and what is an assumption", () => {
    expect(step("The chain prints LUNA").source).toBe("Terra's rule");
    expect(step("The market quotes a price").source).toBe("Assumption");
  });

  it("show the wave of the block", () => {
    expect(step("Sellers show up").result).toContain("$1.1B");
  });

  it("put the real numbers in the formula", () => {
    const { numbers } = step("The market quotes a price");
    expect(numbers).toMatch(/^1 ÷ \(1 \+ \(\$.+ ÷ \$.+\)³\)$/);
  });

  it("say when the reserve did nothing", () => {
    const calm = blockSteps(machineAt(MACHINE_SCENARIO, 3000).trace, MACHINE_SCENARIO);
    expect(calm.find((s) => s.title === "The reserve buys")!.result).toContain("Nothing");
  });
});

describe("the time of a block", () => {
  it("starts on May 7", () => {
    expect(timeOfBlock(0)).toBe("May 7, 00:00 UTC");
  });

  it("adds six seconds a block", () => {
    expect(timeOfBlock(600)).toBe("May 7, 01:00 UTC");
    expect(timeOfBlock(14_400)).toBe("May 8, 00:00 UTC");
  });
});
