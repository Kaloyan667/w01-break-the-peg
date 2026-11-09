import { expect, it } from "vitest";
import odds from "@/data/rescue-odds.json";
import { SCENARIOS } from "./scenarios";
import { rescueOdds, sampleWorld } from "./robustness";

const base = SCENARIOS.asHappened.scenario;

it("draws the same world from the same seed", () => {
  expect(sampleWorld(base, 42)).toEqual(sampleWorld(base, 42));
});

it("draws different worlds from different seeds", () => {
  expect(sampleWorld(base, 1).behavior).not.toEqual(sampleWorld(base, 2).behavior);
});

it("never touches the chain's own rules", () => {
  expect(sampleWorld(base, 3).market).toEqual(base.market);
});

it("counts only worlds that collapse the way May 2022 did", () => {
  const result = rescueOdds(20);
  expect(result.worldsKept).toBeGreaterThan(0);
  expect(result.worldsKept).toBeLessThanOrEqual(result.worldsTried);
});

it("has every scenario in the committed odds", () => {
  expect(Object.keys(odds.survivalShare).sort()).toEqual(Object.keys(SCENARIOS).sort());
});
