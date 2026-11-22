import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  demoStudioOwnerEmail,
  demoStudioOwnerId,
  demoViewerEmail,
  demoViewerId,
} from "@/db/fixtures/cadence-demo";

export type Viewer = { userId: string; email: string; name: string | null };

/**
 * The signed-in viewer for a server component, Server Action or route handler. Returns null when signed out.
 * DEV_DEMO_VIEWER is honoured only in development:
 *   "1" or "client" -> the seeded client contact
 *   "studio"        -> the seeded studio owner
 */
export async function getViewer(): Promise<Viewer | null> {
  if (env.NODE_ENV === "development") {
    if (env.DEV_DEMO_VIEWER === "studio") {
      return { userId: demoStudioOwnerId, email: demoStudioOwnerEmail, name: "Studio Owner" };
    }
    if (env.DEV_DEMO_VIEWER === "1" || env.DEV_DEMO_VIEWER === "client") {
      return { userId: demoViewerId, email: demoViewerEmail, name: "Sofia Marin" };
    }
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return { userId: session.user.id, email: session.user.email, name: session.user.name ?? null };
}
