// Fetches the daily history of eight stablecoin crises into src/data/crises.json. Run it once with
// `npm run crises`: the site only reads the committed file and calls no API.
import { writeFileSync } from "node:fs";

const DAY_SECONDS = 86_400;
const WINDOW_DAYS = 40;
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; hemera-week-1)" };

type Source = { label: string; url: string };

const COINDESK_LUNA = {
  label: "CoinDesk",
  url: "https://coindesk.com/business/2022/05/09/ust-stablecoin-falls-below-dollar-peg-for-second-time-in-48-hours",
};

const CRISES: {
  id: string;
  name: string;
  when: string;
  from: string;
  coin: string;
  backingCoin: string | null;
  backingName: string | null;
  backingKind: "own" | "part" | "outside";
  supplyId: number | null;
  story: string;
  sources: Source[];
}[] = [
  {
    id: "ust-2022",
    name: "UST",
    when: "May 2022",
    from: "2022-05-01",
    coin: "terrausd",
    backingCoin: "terra-luna",
    backingName: "LUNA",
    backingKind: "own",
    supplyId: 3,
    story: "Each UST could be swapped for a dollar of newly printed LUNA.",
    sources: [{ label: "Harvard", url: "https://corpgov.law.harvard.edu/2023/05/22/anatomy-of-a-run-the-terra-luna-crash/" }],
  },
  {
    id: "ust-2021",
    name: "UST",
    when: "May 2021",
    from: "2021-05-15",
    coin: "terrausd",
    backingCoin: "terra-luna",
    backingName: "LUNA",
    backingKind: "own",
    supplyId: 3,
    story: "The same machine a year earlier, with about a ninth of the supply.",
    sources: [{ label: "Coinbase", url: "https://www.coinbase.com/institutional/research-insights/research/weekly-market-commentary/weekly-market-commentary-may-13-2022" }],
  },
  {
    id: "iron-2021",
    name: "IRON",
    when: "June 2021",
    from: "2021-06-12",
    coin: "iron-stablecoin",
    backingCoin: "iron-titanium-token",
    backingName: "TITAN",
    backingKind: "part",
    supplyId: null,
    story: "Backed 75% by USDC and 25% by its own token, TITAN.",
    sources: [{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Iron_Finance" }],
  },
  {
    id: "usdn-2022",
    name: "USDN",
    when: "April 2022",
    from: "2022-04-01",
    coin: "neutrino",
    backingCoin: "waves",
    backingName: "WAVES",
    backingKind: "own",
    supplyId: 12,
    story: "Backed by WAVES tokens locked in a contract. It came back here, then sank to around $0.50 by December 2022.",
    sources: [
      { label: "Cointelegraph", url: "https://cointelegraph.com/news/neutrino-dollar-breaks-peg-falls-to-0-82-amid-waves-price-manipulation-accusations" },
      { label: "Web3 Is Going Great", url: "https://web3isgoinggreat.com/single/waves-founder-announces-a-new-undepeggable-stablecoin" },
    ],
  },
  {
    id: "dei-2022",
    name: "DEI",
    when: "May 2022",
    from: "2022-05-11",
    coin: "dei-token",
    backingCoin: "deus-finance-2",
    backingName: "DEUS",
    backingKind: "part",
    supplyId: null,
    story: "An algorithmic stablecoin from Deus Finance, only partially collateralized.",
    sources: [{ label: "ForkLog", url: "https://forklog.com/en/dei-stablecoin-from-deus-finance-dao-loses-dollar-peg/" }],
  },
  {
    id: "usdc-2023",
    name: "USDC",
    when: "March 2023",
    from: "2023-03-07",
    coin: "usd-coin",
    backingCoin: null,
    backingName: null,
    backingKind: "outside",
    supplyId: 2,
    story: "Backed by cash and Treasuries. $3.3 billion of its reserves were stuck at Silicon Valley Bank.",
    sources: [{ label: "CNBC", url: "https://www.cnbc.com/amp/2023/03/11/stablecoin-usdc-breaks-dollar-peg-after-firm-reveals-it-has-3point3-billion-in-svb-exposure.html" }],
  },
  {
    id: "dai-2023",
    name: "DAI",
    when: "March 2023",
    from: "2023-03-07",
    coin: "dai",
    backingCoin: null,
    backingName: null,
    backingKind: "outside",
    supplyId: 5,
    story: "Its collateral includes USDC, and it fell with USDC.",
    sources: [{ label: "CoinDesk", url: "https://www.coindesk.com/markets/2023/03/11/dai-depegs-as-stablecoin-rout-plagues-crypto/" }],
  },
  {
    id: "usdr-2023",
    name: "USDR",
    when: "October 2023",
    from: "2023-10-07",
    coin: "real-usd",
    backingCoin: null,
    backingName: null,
    backingKind: "outside",
    supplyId: 85,
    story: "Backed mostly by real estate. When its liquid DAI ran out, the rest could not be sold fast enough.",
    sources: [{ label: "CoinDesk", url: "https://www.coindesk.com/markets/2023/10/11/real-estate-backed-stablecoin-usdr-de-pegs-after-treasury-was-drained-of-liquid-assets/" }],
  },
];

/** LUNA in circulation in May 2021, from CoinMarketCap's weekly snapshots of 16, 23 and 30 May. */
const LUNA_CIRCULATING_2021: [string, number][] = [
  ["2021-05-16", 383_432_018],
  ["2021-05-23", 389_344_148],
  ["2021-05-30", 408_052_284],
];

const dayOf = (seconds: number) => new Date(Math.round(seconds / DAY_SECONDS) * DAY_SECONDS * 1000).toISOString().slice(0, 10);
const seconds = (day: string) => Date.parse(`${day}T00:00:00Z`) / 1000;

async function getJson(url: string) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} on ${url}`);
  return response.json();
}

async function dailyPrices(coin: string, from: string): Promise<Map<string, number>> {
  const url = `https://coins.llama.fi/chart/coingecko:${coin}?start=${seconds(from)}&span=${WINDOW_DAYS}&period=1d`;
  const { coins } = await getJson(url);
  const series = Object.values(coins)[0] as { prices: { timestamp: number; price: number }[] };
  return new Map(series.prices.map(({ timestamp, price }) => [dayOf(timestamp), price]));
}

async function dailySupply(id: number): Promise<Map<string, number>> {
  const { tokens } = await getJson(`https://stablecoins.llama.fi/stablecoin/${id}`);
  return new Map(
    (tokens as { date: number; circulating?: { peggedUSD?: number } }[]).map(({ date, circulating }) => [dayOf(date), circulating?.peggedUSD ?? 0]),
  );
}

function circulating2021(day: string): number {
  const time = seconds(day);
  const points = LUNA_CIRCULATING_2021.map(([d, luna]) => [seconds(d), luna]);
  if (time <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [t0, y0] = points[i - 1];
    const [t1, y1] = points[i];
    if (time <= t1) return y0 + ((y1 - y0) * (time - t0)) / (t1 - t0);
  }
  return points[points.length - 1][1];
}

async function main() {
  const crises = [];
  for (const { coin, backingCoin, supplyId, from, ...rest } of CRISES) {
    const [prices, backing, supply] = await Promise.all([
      dailyPrices(coin, from),
      backingCoin ? dailyPrices(backingCoin, from) : Promise.resolve(null),
      supplyId ? dailySupply(supplyId) : Promise.resolve(null),
    ]);
    const days = [...prices.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, price]) => ({ day, price, backing: backing?.get(day) ?? null, supply: supply?.get(day) || null }));

    let cover = null;
    if (rest.id === "ust-2021") {
      const covers = days.filter((d) => d.backing && d.supply).map((d) => ({ day: d.day, cover: (d.backing! * circulating2021(d.day)) / d.supply! }));
      const lowest = covers.reduce((low, c) => (c.cover < low.cover ? c : low));
      const after = covers.find((c) => c.day > lowest.day && c.cover >= 1)!;
      console.log("UST 2021 lowest cover", lowest, "back above 100% on", after);
      const written = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
      cover = {
        text: `fell to about ${Math.round(lowest.cover * 100)}% on ${written(lowest.day)}, 2021, and was back above 100% on ${written(after.day)}.`,
        source: { label: "CoinMarketCap", url: "https://coinmarketcap.com/historical/20210523/" },
      };
    }
    if (rest.id === "ust-2022") cover = { text: "fell under 100% on May 9, 2022, and never came back.", source: COINDESK_LUNA };

    crises.push({ ...rest, cover, days });
    console.log(rest.id, days.length, "days, from", days[0].day, "to", days.at(-1)!.day);
  }

  const file = new URL("../src/data/crises.json", import.meta.url);
  const sources = { prices: "https://coins.llama.fi/chart/coingecko:terrausd", supply: "https://stablecoins.llama.fi/stablecoin/3" };
  writeFileSync(file, `${JSON.stringify({ sources, crises })}\n`);
}

main();
