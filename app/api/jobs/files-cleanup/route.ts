import { env } from "@/lib/env";
import { isCronAuthorised } from "@/lib/cron-auth";
import { sweepAbandonedUploads } from "@/server/files";
import { getStorage } from "@/server/storage-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Removes uploads that were requested but never confirmed, and their objects. Vercel cron calls this
 * daily. The response carries a count only.
 */
async function run(request: Request): Promise<Response> {
  if (!isCronAuthorised(request.headers.get("authorization"), env.CRON_SECRET)) {
    return new Response(null, { status: 401 });
  }
  let storage;
  try {
    storage = getStorage();
  } catch {
    return new Response(null, { status: 503 });
  }
  try {
    const removed = await sweepAbandonedUploads(storage, new Date());
    return Response.json({ removed });
  } catch {
    console.error("[files cleanup job] sweep failed");
    return new Response(null, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
