"use client";

import { useSimulation } from "./useSimulation";

export function Lab() {
  const { points, outcome } = useSimulation("asHappened");
  const lastPoint = points[points.length - 1];

  return (
    <main className="mx-auto max-w-5xl px-6 pt-20 pb-32" data-survived={outcome.survived} data-hours={lastPoint.hour}>
      {/* TODO(human): show where UST ended up after the seven days of the run. */}
    </main>
  );
}
