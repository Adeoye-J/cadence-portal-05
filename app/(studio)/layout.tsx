import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { StudioSidebar } from "@/components/layout/studio-sidebar";
import { getViewer } from "@/lib/session";
import { getStudioMembership } from "@/server/studio";

/**
 * Studio shell. Signed-out visitors go to sign-in. Signed-in users who belong to no studio get a 404,
 * so the console's existence is not disclosed.
 */
export default async function StudioLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/log-in");
  const membership = await getStudioMembership(viewer.userId);
  if (!membership) notFound();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <StudioSidebar studioName={membership.studioName} role={membership.role} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
