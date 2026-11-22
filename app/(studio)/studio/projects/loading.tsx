/** Skeleton shown while the projects load. Motion is limited to the reduced-motion-safe pulse. */
export default function StudioProjectsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 rounded-control bg-border motion-safe:animate-pulse" />
        <div className="h-5 w-72 rounded-control bg-border motion-safe:animate-pulse" />
      </div>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-40 rounded-card border border-border bg-surface motion-safe:animate-pulse" />
        ))}
      </ul>
    </main>
  );
}
