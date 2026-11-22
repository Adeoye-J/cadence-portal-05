import type { Metadata } from "next";
import { LegalDraft } from "@/components/features/legal/legal-draft";

export const metadata: Metadata = { title: "Cookies" };

export default function CookiesPage() {
  return <LegalDraft title="Cookie notice" sections={["The session cookie that keeps you signed in", "Strictly necessary cookies only, for now", "Analytics: none is set up yet", "How to control cookies in your browser"]} />;
}
