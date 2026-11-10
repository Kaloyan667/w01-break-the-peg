"use client";

import { useEffect, useRef, useState } from "react";

/** The live width of an element, so that a chart can draw its text at real size on any screen. */
export function useElementWidth(initial: number) {
  const element = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    if (!element.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  return [element, width] as const;
}
