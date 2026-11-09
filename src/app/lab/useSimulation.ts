"use client";

import { useMemo } from "react";
import { SCENARIOS, withOverrides, type Overrides, type ScenarioId } from "@/engine/scenarios";
import { simulate } from "@/engine/simulate";

/** Runs the simulation in the browser, and again whenever the scenario or a dial changes. */
export function useSimulation(scenarioId: ScenarioId, overrides: Overrides = {}) {
  const { reserveUsd, basePoolSdr, poolRecoveryBlocks } = overrides;
  return useMemo(
    () =>
      simulate(
        withOverrides(SCENARIOS[scenarioId].scenario, { reserveUsd, basePoolSdr, poolRecoveryBlocks }),
      ),
    [scenarioId, reserveUsd, basePoolSdr, poolRecoveryBlocks],
  );
}
