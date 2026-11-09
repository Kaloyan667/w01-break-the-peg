// The starting point of the run, with where each number comes from, and the what-ifs.

import { MAY_2022_MARKET, PROPOSAL_1164_MARKET } from "./market";
import type { Behavior, Scenario } from "./simulate";

/**
 * ASSUMPTIONS, found by a search that matched the real daily data of May 2022. They are not measured.
 * The digits are kept because a spiral is explosive: round them and the last hours change completely.
 * That fragility is why the answer on the site comes from robustness.ts and not from this one world.
 */
export const MAY_2022_BEHAVIOR: Behavior = {
  marketDepthUsd: 2725952989.5,
  anchorFleePerDay: 0.4441032531,
  walletFleePerDay: 0.0489576458,
  ignoredDiscount: 0.0112241080,
  fullPanicDiscount: 0.0651972262,
  panicLagBlocks: 1359.25201,
  undercollateralizedFear: 1.0796972841,
  confidenceSensitivity: 0.0982134496,
  lunaSellImpact: 3.9234441230,
};

const asHappened: Scenario = {
  market: MAY_2022_MARKET,
  behavior: MAY_2022_BEHAVIOR,
  days: 7,
  start: {
    // DefiLlama, 7 May 2022: https://stablecoins.llama.fi/stablecoin/3
    ustSupply: 18_770_471_902,
    // "$14 billion" of UST in Anchor before the run: https://marketrealist.com/p/why-did-terra-depeg-from-the-dollar
    anchorDeposits: 14e9,
    // Messari via The Daily Hodl: https://dailyhodl.com/2022/05/12/terra-temporarily-halts-blockchain-as-luna-hyperinflates-and-implodes-99-in-one-day
    lunaSupply: 345e6,
    // DefiLlama / CoinGecko, 7 May 2022 00:00 UTC, see src/data/may-2022.json
    lunaPriceUsd: 78.55,
  },
  // Two addresses pull 375M UST out of Anchor on 7 May. Harvard: https://corpgov.law.harvard.edu/2023/05/22/anatomy-of-a-run-the-terra-luna-crash/
  // The second wave is an ASSUMPTION: its size and time are tuned, only its existence is documented
  // (UST at $0.65 on 9 May, CoinDesk: https://coindesk.com/business/2022/05/09/ust-stablecoin-falls-below-dollar-peg-for-second-time-in-48-hours).
  shocks: [
    { day: 0.75, ustSold: 375e6 },
    { day: 2.1690883672, ustSold: 1069292100.84 },
  ],
  reserve: {
    // JS Held audit, quoted by The Block: https://www.theblock.co/amp/post/187488/luna-foundation-guard-says-it-spent-2-8-billion-to-defend-ust-peg
    usd: 2.8e9,
    triggerPrice: 0.9732882919,
    // ASSUMPTION: tuned so the reserve runs out by 12 May, the end of the period the audit covers.
    maxSpendPerDayUsd: 1042607233.86,
  },
  // The chain is stopped on 13 May: https://en.wikipedia.org/wiki/Terra_(blockchain)
  chainHaltDay: 6,
  hardBackingShare: 0,
};

/** The chain was stopped because of the collapse, so a what-if never inherits that date. */
const whatIf: Scenario = { ...asHappened, chainHaltDay: null };

export type ScenarioId = "asHappened" | "noReserve" | "fastReserve" | "earlyProposal" | "noAnchor" | "fullyBacked";

export const SCENARIOS: Record<ScenarioId, { title: string; question: string; scenario: Scenario }> = {
  asHappened: {
    title: "As it happened",
    question: "The rules, the reserve and the deposits of May 2022.",
    scenario: asHappened,
  },
  noReserve: {
    title: "No reserve",
    question: "What if the bitcoin had never existed?",
    scenario: { ...whatIf, reserve: { ...whatIf.reserve, usd: 0 } },
  },
  fastReserve: {
    title: "The same reserve, all at once",
    question: "What if the $2.8 billion had been spent the moment the peg slipped?",
    scenario: { ...whatIf, reserve: { ...whatIf.reserve, maxSpendPerDayUsd: Infinity } },
  },
  earlyProposal: {
    title: "Proposal 1164, on day one",
    question: "What if the emergency change had been in place before the run?",
    scenario: { ...whatIf, market: PROPOSAL_1164_MARKET },
  },
  noAnchor: {
    title: "No Anchor",
    question: "What if UST had not been parked at 19.5%, ready to leave together?",
    scenario: {
      ...whatIf,
      start: { ...whatIf.start, anchorDeposits: 0 },
    },
  },
  fullyBacked: {
    title: "A dollar behind every UST",
    question: "What if every UST could be redeemed for a real dollar?",
    scenario: { ...whatIf, hardBackingShare: 1 },
  },
};

/** The dials a reader can turn on the page. Anything left out keeps the scenario's value. */
export type Overrides = {
  reserveUsd?: number;
  basePoolSdr?: number;
  poolRecoveryBlocks?: number;
};

export function withOverrides(scenario: Scenario, overrides: Overrides): Scenario {
  const { reserveUsd, basePoolSdr, poolRecoveryBlocks } = overrides;
  return {
    ...scenario,
    reserve: { ...scenario.reserve, usd: reserveUsd ?? scenario.reserve.usd },
    market: {
      ...scenario.market,
      basePoolSdr: basePoolSdr ?? scenario.market.basePoolSdr,
      poolRecoveryBlocks: poolRecoveryBlocks ?? scenario.market.poolRecoveryBlocks,
    },
  };
}
