import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getViewer } from "@/lib/session";
import { listStudioClients } from "@/server/studio-reads";

export const metadata: Metadata = { title: "Clients" };

/** Clients directory (Stitch: clients_directory). One row per client, with their projects. */
export default async function StudioClientsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const clients = await listStudioClients(viewer.userId);
  if (!clients) notFound();

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Clients" description="Every client your studio has worked with, and their projects." />
      {clients.length === 0 ? (
        <section className="rounded-card border border-dashed border-border bg-surface p-6">
          <p className="text-body-sm text-ink-muted">No clients yet. A client appears here once a project is created for them.</p>
        </section>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <li key={c.name} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:p-6">
              <h2 className="text-headline-sm text-ink">{c.name}</h2>
              <p className="tnum text-body-sm text-ink-muted">
                {c.projectCount} {c.projectCount === 1 ? "project" : "projects"} · {c.activeCount} active
              </p>
              <ul className="flex flex-col gap-1">
                {c.projects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/studio/projects/${p.id}`} className="inline-flex min-h-11 items-center text-body-sm font-medium text-primary underline-offset-4 hover:underline">
                      {p.reference} · {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
