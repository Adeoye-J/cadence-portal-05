import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/** Every Better Auth endpoint (magic-link request, verify, sign-out, session) lives under /api/auth. */
export const { GET, POST } = toNextJsHandler(auth);
