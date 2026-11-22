"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

/** Browser client for sign-in: magic link, Google and passkeys. Calls the /api/auth routes. */
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), passkeyClient()],
});
