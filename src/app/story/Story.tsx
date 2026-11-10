import Link from "next/link";
import { Lab } from "../lab/Lab";
import { BreakingPoint } from "./BreakingPoint";
import { BRIDGE, FURTHER, PLAY } from "./copy";
import { EightTimes } from "./EightTimes";
import { Opening } from "./Opening";
import { Savings } from "./Savings";
import { Scene } from "./Scene";
import "./story.css";
import { TheDoor } from "./TheDoor";
import { ThePress } from "./ThePress";
import { TheRule } from "./TheRule";

/** The whole page, from the crash to the reader's own attempt. `answer` is the text of answer.md. */
export function Story({ answer }: { answer: string }) {
  return (
    <main data-surface="terminal">
      <Opening />

      <section className="mx-auto max-w-5xl px-6 pt-[16svh] pb-[4svh]">
        <h2 className="text-[clamp(2.5rem,7vw,5rem)] leading-[1.04] font-[510] tracking-[-0.035em] text-balance">{BRIDGE.title}</h2>
        <p className="mt-4 max-w-[34em] text-[clamp(1.0625rem,1.45vw,1.25rem)] leading-[1.45] text-pretty">{BRIDGE.text}</p>
      </section>

      <TheRule />
      <Savings />
      <TheDoor />
      <ThePress />
      <BreakingPoint />
      <EightTimes />

      <Scene id="play" title={PLAY.title} paragraphs={PLAY.paragraphs}>
        <Lab answer={answer} />
      </Scene>

      <nav aria-label={FURTHER.title} className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-lg font-[510] tracking-[-0.015em]">{FURTHER.title}</h2>
        <ul className="mt-2 grid gap-1">
          {FURTHER.links.map(({ href, label, external }) => (
            <li key={href}>
              {external ? (
                <a href={href} target="_blank" rel="noreferrer" className="text-fg-2 underline underline-offset-2 hover:text-fg">
                  {label}
                </a>
              ) : (
                <Link href={href} className="text-fg-2 underline underline-offset-2 hover:text-fg">
                  {label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
