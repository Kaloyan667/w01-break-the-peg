"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES = [
  { href: "/lab", label: "Play" },
  { href: "/machine", label: "The machine" },
  { href: "/patterns", label: "Eight crises" },
];

export function ToolNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="This project" className="mb-5 flex gap-1 text-sm">
      {PAGES.map(({ href, label }) => {
        const here = pathname === href || pathname === `${href}/`;
        return (
          <Link
            key={href}
            href={href}
            aria-current={here ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${here ? "bg-fg/10 font-[510] text-fg" : "text-fg-2 hover:text-fg"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
