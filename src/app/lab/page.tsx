import type { Metadata } from "next";
import { Lab } from "./Lab";

export const metadata: Metadata = { robots: { index: false } };

export default function LabPage() {
  return <Lab />;
}
