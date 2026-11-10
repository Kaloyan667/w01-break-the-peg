/** How far apart two price curves are: 0 for identical curves, larger the more they differ. */
export function curveDistance(a: number[], b: number[]): number {
  // TODO(human): compare the two curves day by day, over the days they have in common.
  return Math.abs(Math.min(...a) - Math.min(...b));
}
