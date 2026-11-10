import type { ReactNode } from "react";
import type { Source } from "@/engine/crises";

export const PANEL = "rounded-xl border border-line bg-surface p-5 sm:p-7";
export const BUTTON = "rounded-[10px] bg-fg px-4 py-2.5 font-[510] text-bg transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg";

export function Sources({ sources }: { sources: Source[] }) {
  const unique = sources.filter((source, index) => sources.findIndex(({ url }) => url === source.url) === index);
  return (
    <p className="mt-4 flex flex-wrap gap-x-3 text-sm text-fg-3">
      {unique.map(({ label, url }) => (
        <a key={url} href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg">
          {label}
        </a>
      ))}
    </p>
  );
}

/** A scene of the story: a statement, a few plain sentences, and something to touch. */
export function Scene({ id, title, paragraphs, children }: { id?: string; title: string; paragraphs: string[]; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-5xl scroll-mt-4 px-6 py-[11svh]">
      <h2 className="max-w-[17em] text-[clamp(1.9rem,4.6vw,3.25rem)] leading-[1.08] font-[510] tracking-[-0.03em] text-balance">{title}</h2>
      <div className="mt-5 grid max-w-[38em] gap-3 text-[clamp(1.0625rem,1.45vw,1.25rem)] leading-[1.45] text-pretty">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
