import type { Metadata } from "next";
import { SiteHeader } from "../SiteHeader";
import { Machine } from "./Machine";

export const metadata: Metadata = { robots: { index: false } };

export default function MachinePage() {
  return (
    <>
      <SiteHeader />
      <Machine />
    </>
  );
}
