import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { week } from "@/week";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: `${week.title}: Hemera, week ${week.number}`,
  description: week.question,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 text-sm">
          <a href="https://www.hemera.one" className="font-[510] text-fg">
            Hemera
          </a>
          <nav className="flex gap-5 text-fg-2">
            <span>Week {week.number} of 52</span>
            <a href={`https://github.com/${week.repo}`} className="hover:text-fg">
              Source
            </a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
