import type { ReactNode } from "react";
import { week } from "@/week";

/** `children` are extra links, shown before the week and the source. */
export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="mx-auto flex h-[60px] max-w-5xl items-center justify-between px-6 text-sm">
      <a href="https://www.hemera.one" className="font-[510] text-fg">
        Hemera
      </a>
      <nav className="flex gap-5 text-fg-2">
        {children}
        <span>
          Week {week.number} of 52
        </span>
        <a href={`https://github.com/${week.repo}`} className="hover:text-fg">
          Source
        </a>
      </nav>
    </header>
  );
}
