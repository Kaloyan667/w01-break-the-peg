// What really happened each day. Fixed history: the numbers on the page are the player's own run.

export type HistoricalEvent = { text: string; source: { label: string; url: string } };

const HARVARD = { label: "Harvard", url: "https://corpgov.law.harvard.edu/2023/05/22/anatomy-of-a-run-the-terra-luna-crash/" };
const DEFILLAMA = { label: "DefiLlama", url: "https://coins.llama.fi/chart/coingecko:terrausd" };

export const TIMELINE: HistoricalEvent[] = [
  { text: "Two wallets pull 375 million UST out of Anchor, a savings app paying 19.5% interest.", source: HARVARD },
  {
    text: "The Luna Foundation Guard, which holds the reserve, starts spending bitcoin to hold UST at $1. By May 12 it will have spent $2.8 billion.",
    source: { label: "The Block", url: "https://www.theblock.co/amp/post/187488/luna-foundation-guard-says-it-spent-2-8-billion-to-defend-ust-peg" },
  },
  {
    text: "UST falls as low as $0.65. All the LUNA in existence is now worth less than all the UST.",
    source: { label: "CoinDesk", url: "https://coindesk.com/business/2022/05/09/ust-stablecoin-falls-below-dollar-peg-for-second-time-in-48-hours" },
  },
  { text: "UST opens at 89 cents. LUNA opens at $41, about half its price three days ago.", source: DEFILLAMA },
  {
    text: "An emergency proposal would raise the daily limit on swapping UST for LUNA from $293 million to $1.2 billion.",
    source: { label: "CoinGecko", url: "https://www.coingecko.com/learn/ust-depegged-terra-s-biggest-test" },
  },
  { text: "LUNA opens at $1.12. UST opens at 75 cents.", source: DEFILLAMA },
  {
    text: "The Terra blockchain is shut down. No more UST can be swapped for LUNA.",
    source: { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Terra_(blockchain)" },
  },
];

export const dayTitle = (day: number) => `Day ${day + 1} — May ${7 + day}, 2022`;
