import type { Metadata } from "next";
import { SiteHeader } from "../SiteHeader";
import { Patterns } from "./Patterns";

export const metadata: Metadata = { robots: { index: false } };

export default function PatternsPage() {
  return (
    <>
      <SiteHeader />
      <Patterns />
    </>
  );
}
