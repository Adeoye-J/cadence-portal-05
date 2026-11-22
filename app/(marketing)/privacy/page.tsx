import type { Metadata } from "next";
import { LegalDraft } from "@/components/features/legal/legal-draft";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <LegalDraft title="Privacy notice" sections={["What we collect and why", "Who receives your data (payment provider, email and storage providers)", "How long records are kept", "Your rights, including export and deletion", "Security measures", "Contact for privacy questions"]} />;
}
