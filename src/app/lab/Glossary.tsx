const TERMS: [string, string][] = [
  ["UST", "A crypto coin designed to stay worth $1."],
  ["LUNA", "A second coin. The system prints it to pay people who hand back their UST."],
  ["Burning", "Destroying UST in exchange for newly printed LUNA."],
  ["Anchor", "A savings app that paid 19.5% on UST. Most of the UST in existence sat there."],
  ["Panic", "How hard holders are rushing for the exit. It is an estimate from this simulation."],
  ["Cover", "The value of all the LUNA compared with all the UST. Under 100%, there is not enough LUNA to back every UST."],
  ["Swap fee", "What the system charges to turn UST into LUNA. It climbs when too many people swap at once."],
];

export function Glossary() {
  return (
    <details className="mt-4 rounded-xl border border-line bg-surface p-5">
      <summary className="cursor-pointer font-[510] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg">What do these words mean?</summary>
      <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {TERMS.map(([term, meaning]) => (
          <div key={term}>
            <dt className="font-[510]">{term}</dt>
            <dd className="text-fg-2 text-pretty">{meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
