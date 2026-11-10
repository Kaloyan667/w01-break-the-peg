import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { week } from "@/week";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });

const title = `${week.title}: Hemera, week ${week.number}`;
const shareTitle = "Seven days to save a stablecoin. Can you?";

export const metadata: Metadata = {
  metadataBase: new URL(week.url),
  title,
  description: week.question,
  openGraph: { title: shareTitle, description: week.question, url: "/", siteName: "Hemera", type: "website" },
  twitter: { card: "summary_large_image", title: shareTitle, description: week.question },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
