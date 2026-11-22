import { env } from "@/lib/env";
import { isCronAuthorised } from "@/lib/cron-auth";
import { getEmailSender } from "@/lib/services/email";
import { drain } from "@/server/outbox";
import { outbox } from "@/server/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sends queued notifications. Vercel cron calls this with GET and the secret as a Bearer token.
 * POST is accepted for manual runs. The response carries counts only, never addresses or bodies.
 */
async function run(request: Request): Promise<Response> {
  if (!isCronAuthorised(request.headers.get("authorization"), env.CRON_SECRET)) {
    return new Response(null, { status: 401 });
  }
  try {
    const result = await drain(outbox, getEmailSender(), new Date());
    return Response.json(result);
  } catch {
    console.error("[notify job] drain failed");
    return new Response(null, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
