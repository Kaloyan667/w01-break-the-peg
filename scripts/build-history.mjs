// Rebuilds src/data/may-2022.json from DefiLlama's free public API: node scripts/build-history.mjs
import { writeFileSync } from "node:fs";

const START = Date.UTC(2022, 4, 7) / 1000;
const DAYS = 8;
// Snapshots land a few seconds either side of midnight, so each one goes to its nearest midnight.
const nearestMidnight = (timestamp) => Math.round(timestamp / 86400) * 86400;
const dayOf = (timestamp) => new Date(nearestMidnight(timestamp) * 1000).toISOString().slice(0, 10);
const inWindow = (timestamp) => nearestMidnight(timestamp) >= START && nearestMidnight(timestamp) < START + DAYS * 86400;
const getJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
};

const priceUrl = (coin) =>
  `https://coins.llama.fi/chart/coingecko:${coin}?start=${START - 3600}&span=${DAYS}&period=1d`;
const [ustPrices, lunaPrices, ust] = await Promise.all([
  getJson(priceUrl("terrausd")),
  getJson(priceUrl("terra-luna")),
  getJson("https://stablecoins.llama.fi/stablecoin/3"),
]);

// DefiLlama's total stops on 11 May. From 12 May the only series left is the Terra chain's own.
const supply = new Map();
for (const row of ust.tokens) {
  if (inWindow(row.date)) supply.set(dayOf(row.date), row.circulating.peggedUSD);
}
for (const row of ust.chainBalances["Terra Classic"].tokens) {
  if (inWindow(row.date) && !supply.has(dayOf(row.date))) supply.set(dayOf(row.date), row.circulating.peggedUSD);
}

const prices = (body, coin) =>
  new Map(body.coins[`coingecko:${coin}`].prices.map((row) => [dayOf(row.timestamp), row.price]));
const ustPrice = prices(ustPrices, "terrausd");
const lunaPrice = prices(lunaPrices, "terra-luna");

const days = [...ustPrice.keys()].slice(0, DAYS).map((date, day) => ({
  date,
  day,
  ustPrice: Number(ustPrice.get(date).toFixed(4)),
  lunaPrice: Number(lunaPrice.get(date).toPrecision(4)),
  ustSupply: Math.round(supply.get(date)),
}));

writeFileSync(
  new URL("../src/data/may-2022.json", import.meta.url),
  `${JSON.stringify(
    {
      sources: {
        prices: "https://coins.llama.fi/chart/coingecko:terrausd",
        supply: "https://stablecoins.llama.fi/stablecoin/3",
      },
      note: "Daily snapshots near 00:00 UTC. Supply is DefiLlama's total until 11 May, then the Terra chain's own series, so the two halves are not strictly comparable.",
      days,
    },
    null,
    2,
  )}\n`,
);
console.log(days);
