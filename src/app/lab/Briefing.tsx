const STEPS = [
  {
    title: "A digital dollar",
    text: "UST was a crypto coin designed to always be worth $1. In May 2022, people held $18.8 billion of it.",
  },
  {
    title: "No dollars in the vault",
    text: "Instead of cash, UST relied on a rule: hand back 1 UST and the system destroys it and prints you $1 worth of LUNA, a second coin you can sell.",
  },
  {
    title: "The catch",
    text: "If too many people leave at once, the system prints LUNA faster than anyone wants to buy it. LUNA collapses, and the promise behind UST goes with it.",
  },
];

const SOURCES = [
  { label: "DefiLlama", url: "https://stablecoins.llama.fi/stablecoin/3" },
  { label: "Harvard", url: "https://corpgov.law.harvard.edu/2023/05/22/anatomy-of-a-run-the-terra-luna-crash/" },
];

/** The whole idea in three steps, for someone who has never heard of any of this. */
export function Briefing({ resuming, onStart }: { resuming: boolean; onStart: () => void }) {
  return (
    <section aria-label="How it worked" className="mt-6">
      <ol className="grid gap-4 lg:grid-cols-3">
        {STEPS.map(({ title, text }, index) => (
          <li key={title} className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm text-fg-3 tabular-nums">{index + 1}</p>
            <h2 className="mt-1 text-lg font-[510] tracking-[-0.015em]">{title}</h2>
            <p className="mt-2 text-fg-2 text-pretty">{text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-xl bg-fg/5 p-5 sm:p-6">
        <div className="max-w-[36em]">
          <h2 className="text-lg font-[510] tracking-[-0.015em]">Your job</h2>
          <p className="mt-1 text-pretty">It is May 7, 2022. You run the emergency fund, $3.0B of bitcoin. Keep UST at $1 for seven days.</p>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="rounded-[10px] bg-fg px-6 py-3 font-[510] text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          {resuming ? "Back to the game" : "Start the week"}
        </button>
      </div>

      <p className="mt-3 flex gap-3 text-sm text-fg-3">
        {SOURCES.map(({ label, url }) => (
          <a key={url} href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg-2">
            {label}
          </a>
        ))}
      </p>
    </section>
  );
}
