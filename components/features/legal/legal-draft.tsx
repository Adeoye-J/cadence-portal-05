import { PageHeader } from "@/components/layout/page-header";

/**
 * Structure for a legal page. The text is a draft to be written and reviewed by counsel before publication.
 * The banner stays on the page until that review is done.
 */
export function LegalDraft({ title, sections }: { title: string; sections: string[] }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <PageHeader title={title} />
      <p role="note" className="rounded-control border border-waiting-border bg-waiting-subtle p-4 text-body-sm text-waiting">
        Draft. This page must be written and reviewed by counsel before it is published.
      </p>
      <ol className="flex flex-col gap-4">
        {sections.map((s) => (
          <li key={s} className="rounded-card border border-border bg-surface p-5">
            <h2 className="text-headline-sm text-ink">{s}</h2>
            <p className="mt-2 text-body-sm text-ink-muted">[To be written by counsel.]</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
