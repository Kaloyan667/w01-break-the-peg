import type { Metadata } from "next";
import { Machine } from "./Machine";

export const metadata: Metadata = { robots: { index: false } };

export default function MachinePage() {
  return <Machine />;
}
