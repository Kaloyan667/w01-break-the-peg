// Every sentence of the story, in one place, so it can be rewritten without touching a component.
// A number written here needs one of the sources listed next to it.

import type { Source } from "@/engine/crises";

const HARVARD: Source = { label: "Harvard", url: "https://corpgov.law.harvard.edu/2023/05/22/anatomy-of-a-run-the-terra-luna-crash/" };
const SUPPLY: Source = { label: "DefiLlama", url: "https://stablecoins.llama.fi/stablecoin/3" };
const PRICES: Source = { label: "DefiLlama", url: "https://coins.llama.fi/chart/coingecko:terrausd" };
const THE_BLOCK: Source = { label: "The Block", url: "https://www.theblock.co/amp/post/187488/luna-foundation-guard-says-it-spent-2-8-billion-to-defend-ust-peg" };
const COINDESK: Source = { label: "CoinDesk", url: "https://coindesk.com/business/2022/05/09/ust-stablecoin-falls-below-dollar-peg-for-second-time-in-48-hours" };
const COINGECKO: Source = { label: "CoinGecko", url: "https://www.coingecko.com/learn/ust-depegged-terra-s-biggest-test" };
const WIKIPEDIA: Source = { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Terra_(blockchain)" };
const MARKET_REALIST: Source = { label: "Market Realist", url: "https://marketrealist.com/p/why-did-terra-depeg-from-the-dollar" };
const SWAP_CODE: Source = { label: "Terra's swap code", url: "https://github.com/terra-money/classic-core/blob/main/x/market/keeper/swap.go" };

/** One line per stop of the opening, in the order of opening.ts. */
export const OPENING_LINES: { text: string; source: Source }[] = [
  { text: "UST was a digital dollar. Each coin was built to stay worth exactly $1, and people held $18.8 billion of them.", source: SUPPLY },
  { text: "Two wallets pull 375 million UST out of Anchor, the savings app that paid 19.5% to hold it.", source: HARVARD },
  { text: "The fund behind UST starts spending bitcoin to hold the price at $1. By May 12 it will have spent $2.8 billion.", source: THE_BLOCK },
  { text: "UST falls as low as 65 cents. LUNA, the coin meant to stand behind it, is now worth less than all the UST.", source: COINDESK },
  { text: "It climbs back to 89 cents. LUNA has lost about half its price in three days.", source: PRICES },
  { text: "An emergency proposal would let four times more UST be swapped for LUNA each day.", source: COINGECKO },
  { text: "UST bounces to 75 cents. LUNA, worth $78 five days ago, opens at $1.12.", source: PRICES },
  { text: "The Terra blockchain is shut down. No more UST can be swapped for LUNA.", source: WIKIPEDIA },
  { text: "A dollar became 13 cents in seven days.", source: PRICES },
];

export const OPENING_LABELS = {
  peg: "The peg at $1.00",
  zero: "$0",
  reading: "Price of one UST",
  hint: "Scroll to watch it break",
  jump: "Play",
};

export const BRIDGE = {
  title: "Nothing was hacked.",
  text: "Every rule did exactly what it was written to do. Here is the first one. Try it.",
};

export const RULE = {
  title: "A rule held it at a dollar",
  paragraphs: [
    "UST had no dollars behind it. It had a promise written in code: hand back 1 UST and the chain destroys it and prints you exactly $1 of LUNA, a second coin you can sell.",
    "So whenever UST got cheap, buying it paid. Drag the price and make the trade.",
  ],
  after: "Traders doing this all day is what pulled UST back to a dollar. It only works while someone will buy the LUNA, and every fix leaves more LUNA in the world.",
  sources: [HARVARD, SWAP_CODE, PRICES],
  slider: "UST trades at",
  button: "Make the trade",
  notWorthIt: "The 2% fee eats the whole discount, so nobody trades.",
};

export const SAVINGS = {
  title: "Three quarters of it sat in one savings app",
  paragraphs: [
    "Anchor paid 19.5% a year on UST. By April 2022 that yield needed a subsidy of $6 million a day.",
    "On May 7, two wallets pulled 375 million UST out of it. That is the orange sliver below, 2% of all the UST.",
  ],
  sources: [HARVARD, MARKET_REALIST, SUPPLY],
};

export const DOOR = {
  title: "The exit was narrow",
  paragraphs: [
    "The chain could only turn so much UST into LUNA. At its normal 2% fee, about $293 million a day got through. Past that the fee climbs, so leaving costs more the more people try to leave.",
    "Drag to see what a rush does to the fee.",
  ],
  note: "Terra's own proposal quoted $293M a day. Its formula, with a 2% fee, gives $278M.",
  sources: [COINGECKO, SWAP_CODE, SUPPLY],
  slider: "UST trying to leave in one day",
  feeLabel: "Lost on every UST swapped",
  may9: "May 9, the real outflow",
};

export const PRESS = {
  title: "Then the rule turned on itself",
  paragraphs: [
    "The chain always pays a dollar of LUNA, whatever LUNA is worth. As LUNA falls, each UST handed back prints more of it. More LUNA for sale pushes the price lower, and the next UST prints more still.",
    "Start the press. This is the engine replaying May 2022, one hour at a time.",
  ],
  note: "Simulation. Terra's swap rules are real, how people react is an assumption tuned to May 2022. In the real collapse, the supply of LUNA passed 6 trillion coins.",
  sources: [HARVARD],
  loop: ["UST handed back", "LUNA printed", "LUNA sold", "LUNA falls"],
  supplyLabel: "LUNA in existence",
  priceLabel: "One LUNA is worth",
  coverLabel: "All the LUNA can back",
  clockLabel: "Time in the run",
  crossed: "LUNA no longer covers UST.",
  start: "Start the press",
  pause: "Pause",
  resume: "Keep going",
  again: "Run it again",
};

export const BREAKING_POINT = {
  title: "It had broken before, and come back",
  paragraphs: [
    "A year earlier UST broke too, and all the LUNA in existence was worth less than all the UST. Three days after it broke, UST was back at 99 cents.",
    "So falling under 100% did not doom it by itself. Pick a year and compare.",
  ],
  note: "Prices are one snapshot a day from DefiLlama, aligned on the first day each coin closed under 97 cents.",
};

export const EIGHT = {
  title: "Eight times a dollar broke. Four came back.",
  note: "Eight crises are too few for a rule: a ninth could break any line here.",
  more: "See all eight, day by day",
};

export const PLAY = {
  title: "Now try to save it",
  paragraphs: ["It is May 7, 2022. You run the emergency fund, $3.0B of bitcoin. Keep UST at $1 for seven days."],
};

export const FURTHER = {
  title: "Go further",
  links: [
    { href: "/machine", label: "Every calculation of one block", external: false },
    { href: "/patterns", label: "All eight crises, day by day", external: false },
    { href: "https://github.com/Kaloyan667/w01-break-the-peg", label: "The code and the data", external: true },
  ],
};
