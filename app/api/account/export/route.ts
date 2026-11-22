import { getViewer } from "@/lib/session";
import { buildClientDataExport } from "@/server/client-reads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in user's data as a JSON download. Unauthenticated requests get 401. Never cached. */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return new Response(null, { status: 401 });
  const document = await buildClientDataExport(viewer, new Date());
  return new Response(JSON.stringify(document, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cadence-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
