import type { Metadata } from "next";
import { LegalDraft } from "@/components/features/legal/legal-draft";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return <LegalDraft title="Terms of service" sections={["Who may use Cadence", "Studio accounts and roles", "Proposals, signatures and their status", "Payments and refunds", "Acceptable use", "Ending an account", "Liability and governing law"]} />;
}
