// How numbers are written on the page.

const SCALES: [number, string][] = [
  [1e12, "T"],
  [1e9, "B"],
];

/** 3e9 is "3.0B", 278e6 is "278M". */
export function coins(n: number): string {
  for (const [size, letter] of SCALES) if (n >= size) return `${(n / size).toFixed(1)}${letter}`;
  if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(Math.round(n));
}

export const money = (usd: number) => `$${coins(usd)}`;

/** Past this, the count of LUNA only reflects the price floor chosen for the model. */
const COUNTABLE_LUNA = 1e13;

export const supply = (luna: number) => (luna > COUNTABLE_LUNA ? "Over 10T" : coins(luna));

/** Two decimals, until LUNA is worth so little that only the first digits mean anything. */
export function price(usd: number): string {
  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(6).replace(/0+$/, "")}`;
}

export function held(hours: number): string {
  const days = Number((hours / 24).toFixed(1));
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export const percent = (share: number) => `${Math.round(share * 100)}%`;
