/** Skeleton for client project pages while data loads. Motion is reduced-motion safe. */
export default function ClientLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
      <div className="h-8 w-64 rounded-control bg-border motion-safe:animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-72 rounded-card border border-border bg-surface motion-safe:animate-pulse" />
        <div className="h-48 rounded-card border border-border bg-surface motion-safe:animate-pulse" />
      </div>
    </main>
  );
}
