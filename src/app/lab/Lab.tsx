"use client";

import Link from "next/link";
import { CRISES, closestCrisis, runCurve } from "@/engine/crises";
import { GAME_DAYS, crashReport, dailyLimitUsd, status } from "@/engine/game";
import { week } from "@/week";
import { ToolNav } from "../ToolNav";
import { answerParagraphs } from "./answer";
import { Controls } from "./Controls";
import { CrashCard } from "./CrashCard";
import { explainDay } from "./explain";
import { CoverLine, Metrics } from "./Metrics";
import { RunChart } from "./RunChart";
import { Story, WeekLog } from "./Terminal";
import { useGame } from "./useGame";
import { useSimulation } from "./useSimulation";

function Answer({ paragraphs }: { paragraphs: string[] }) {
  return (
    <section aria-label="Answer" className="mt-4 rounded-xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-fg-2">Answer</h2>
      <div className="mt-3 grid max-w-[46em] gap-3 text-lg text-pretty">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

/** `answer` is the text of answer.md, read when the site is built. */
export function Lab({ answer }: { answer: string }) {
  const { game, point, moving, play, restart } = useGame();
  const model = useSimulation("asHappened");

  // While a played day is being replayed, the page still shows the morning of that day.
  const day = Math.min(moving ? game.day - 1 : game.day, GAME_DAYS - 1);
  const results = moving ? game.results.slice(0, -1) : game.results;
  const finished = !moving && status(game) === "over";
  const { spiralHour } = game.world;
  const spiralling = spiralHour !== null && point.hour >= spiralHour;
  const yourCurve = finished ? runCurve(game.points) : null;
  const closest = yourCurve ? closestCrisis(yourCurve, CRISES) : null;
  const latest = results.at(-1);
  const explanation = latest ? explainDay(latest, game.points[latest.day * 24], game.points[(latest.day + 1) * 24]) : null;
  const paragraphs = answerParagraphs(answer);

  return (
    <main data-surface="terminal" className="mx-auto max-w-5xl px-6 pt-1 pb-24">
      <ToolNav />
      <h1 className="max-w-[34em] text-2xl font-[510] tracking-[-0.025em] text-balance">{week.question}</h1>
      <p className="mt-2 mb-4 max-w-[52em] text-fg-2 text-pretty">
        UST was meant to stay at $1 with no dollars behind it: anyone could swap 1 UST for $1 of newly printed LUNA. You hold $3.0B of bitcoin and seven days. Choose your moves, then press Next day to run 24 hours of the chain.
      </p>

      <Metrics point={point} committedUsd={game.plan.defendUsd} />

      <section aria-label="Timeline" className="mt-4 grid grid-cols-[minmax(0,1fr)] rounded-xl border border-line bg-surface lg:grid-cols-2">
        <Story day={day} point={point} limitUsd={dailyLimitUsd(game.plan.mint)} explanation={explanation} />
        <div className="border-t border-line p-5 lg:border-t-0 lg:border-l">
          <RunChart points={game.points.slice(0, point.hour + 1)} />
          <CoverLine point={point} />
        </div>
      </section>

      {finished ? (
        <>
          <CrashCard report={crashReport(game)} modelHours={model.outcome.spiralHour} closest={closest} onRestart={restart} />
          {paragraphs.length > 0 && <Answer paragraphs={paragraphs} />}
        </>
      ) : spiralling ? (
        <p role="status" className="mt-4 rounded-[10px] bg-signal p-4 text-center text-lg font-[510] text-pretty text-bg">
          LUNA no longer covers UST.{" "}
          <Link href="/patterns#ust-2021" className="underline underline-offset-2">
            In May 2021 it came back from here.
          </Link>{" "}
          In May 2022 it didn&apos;t.
        </p>
      ) : (
        <Controls game={game} moving={moving} play={play} />
      )}

      <WeekLog results={results} points={game.points} />

      <p className="mt-8 max-w-[52em] text-sm text-fg-3 text-pretty">
        The swap rules are ported from Terra&apos;s own code. How people react is an assumption tuned to the daily data of May 2022, and the effect of the bluff is
        made up. Daily limits are computed from those rules at the minimum fee, 2% by default in Terra&apos;s code, with no dated record for May 2022. Terra&apos;s proposal
        quoted $293M and $1.2B. LUNA&apos;s price stops at a floor of $0.000001, which is why its supply is not counted past 10 trillion.
      </p>
    </main>
  );
}
