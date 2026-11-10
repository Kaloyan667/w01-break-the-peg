"use client";

import { useEffect, useRef, useState } from "react";
import { week } from "@/week";
import { SiteHeader } from "../SiteHeader";
import { OPENING_LABELS } from "./copy";
import { STOPS, readOpening } from "./openingStops";

/** How fast the number catches up with the scroll, in milliseconds. It follows the clock, not the frame rate. */
const SETTLE_MS = 90;
const DAYS = [7, 8, 9, 10, 11, 12, 13, 14];

/** One copy of the scene. The light copy goes on top of the dark one, cut to the height of the tank. */
function Scene({ stop, light }: { stop: (typeof STOPS)[number]; light: boolean }) {
  const Heading = light ? "p" : "h1";
  const atStart = stop === STOPS[0];
  return (
    <div className="absolute inset-x-0 top-[60px] bottom-0 mx-auto grid max-w-5xl grid-rows-[auto_1fr_auto] px-6 pt-[clamp(14px,3.4svh,34px)] pb-[clamp(12px,2.6svh,24px)]">
      <p className="absolute top-1.5 right-6 text-[13px] text-fg-2">{OPENING_LABELS.peg}</p>
      <p className="absolute right-6 bottom-1.5 text-[13px] text-fg-2">{OPENING_LABELS.zero}</p>

      <div>
        <Heading className="max-w-[30em] pt-[18px] text-[clamp(20px,2.1vw,28px)] leading-[1.2] font-[510] tracking-[-0.02em] text-balance sm:pt-0 sm:pr-[7.5em]">{week.question}</Heading>
        <div className="mt-[clamp(10px,2.2svh,22px)]">
          <p className="text-sm text-fg-2">{OPENING_LABELS.reading}</p>
          <p className="opening-numeral" data-price="">
            $1.00
          </p>
        </div>
      </div>

      <div className="row-start-3 max-w-[36em] pr-8">
        <p className="flex justify-between gap-4 text-sm text-fg-2 tabular-nums">
          <span>{stop.date}</span>
          {atStart && <span className="whitespace-nowrap">{OPENING_LABELS.hint}</span>}
        </p>
        <p key={stop.text} className="opening-line mt-1 min-h-[4.2em] text-[clamp(17px,1.45vw,20px)] leading-[1.4] tracking-[-0.015em] text-pretty sm:min-h-[2.8em]">
          {stop.text}
        </p>
        <a href={stop.source.url} target="_blank" rel="noreferrer" tabIndex={light ? -1 : undefined} className="block min-h-[1.5em] text-[13px] text-fg-2 underline underline-offset-2 hover:text-fg">
          {stop.source.label}
        </a>
        <div aria-hidden="true" className="mt-[clamp(8px,1.6svh,16px)] flex items-baseline gap-[clamp(10px,2vw,18px)] text-sm text-fg-2 tabular-nums">
          <span>May</span>
          {DAYS.map((day, tick) => (
            <span key={day} className={`border-b-2 pb-0.5 ${tick === stop.tick ? "border-current font-semibold text-fg" : "border-transparent"}`}>
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Opening() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [stopIndex, setStopIndex] = useState(0);

  useEffect(() => {
    const trackElement = track.current!;
    const stageElement = stage.current!;
    const numerals = stageElement.querySelectorAll<HTMLElement>("[data-price]");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shownPrice = STOPS[0].price;
    let lastPaint = performance.now();
    let frame = 0;

    // The price is written straight to the page: it changes on every frame, far too often for React.
    const paint = (now = performance.now()) => {
      frame = 0;
      const elapsed = Math.min(now - lastPaint, 200);
      lastPaint = now;
      const range = trackElement.offsetHeight - stageElement.offsetHeight;
      const { price, stop } = readOpening(-trackElement.getBoundingClientRect().top / range);
      shownPrice = calm ? price : shownPrice + (price - shownPrice) * (1 - Math.exp(-elapsed / SETTLE_MS));
      if (Math.abs(price - shownPrice) < 0.0005) shownPrice = price;
      stageElement.style.setProperty("--p", shownPrice.toFixed(4));
      const label = `$${shownPrice.toFixed(2)}`;
      numerals.forEach((numeral) => (numeral.textContent = label));
      setStopIndex(stop);
      if (shownPrice !== price) frame = requestAnimationFrame(paint);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const stop = STOPS[stopIndex];

  return (
    <div ref={track} className="opening-track">
      <div ref={stage} className="opening-stage">
        <div className="opening-layer">
          <SiteHeader>
            <a href="#play" className="hover:text-fg">
              {OPENING_LABELS.jump}
            </a>
          </SiteHeader>
          <Scene stop={stop} light={false} />
        </div>
        <div className="opening-layer opening-layer-light" aria-hidden="true">
          <Scene stop={stop} light />
        </div>
        <div className="absolute inset-x-0 top-[60px] z-10 h-px bg-signal" />
      </div>
    </div>
  );
}
