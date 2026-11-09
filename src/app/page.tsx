import { week } from "@/week";

const deadline = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date(week.deadline));

// The starting page: the question, and the promise of an answer. Replace it with the project.
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 pt-20 pb-32">
      <h1 className="text-5xl font-[510] tracking-[-0.03em] text-balance sm:text-6xl">{week.title}</h1>
      <p className="mt-6 max-w-[28em] text-xl font-medium text-balance sm:text-2xl">{week.question}</p>
      <p className="mt-3 max-w-[34em] text-lg text-fg-2 text-pretty">{week.pitch}</p>
      <p className="mt-16 border-t border-line pt-5 text-fg-3">
        The answer ships by {deadline}, 23:59 Paris time.
      </p>
    </main>
  );
}
