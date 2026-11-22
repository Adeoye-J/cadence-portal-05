import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Contact" };

/** Contact. Shows the support address when one is configured. There is no contact form yet. */
export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <PageHeader title="Contact" description="Questions about your account, a project or a payment." />
      <section className="rounded-card border border-border bg-surface p-5">
        {env.SUPPORT_EMAIL ? (
          <p className="text-body-sm text-ink">
            Email{" "}
            <a href={`mailto:${env.SUPPORT_EMAIL}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {env.SUPPORT_EMAIL}
            </a>
            . Include the project reference if your question is about a project.
          </p>
        ) : (
          <p className="text-body-sm text-ink-muted">Contact details are not set up for this site yet.</p>
        )}
      </section>
    </main>
  );
}
