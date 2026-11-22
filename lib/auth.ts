import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { db } from "@/db/client";
import * as authSchema from "@/db/auth-schema";
import { env } from "@/lib/env";
import { getEmailSender } from "@/lib/services/email";
import { magicLinkEmail } from "@/lib/services/email-templates";

/**
 * Authentication (ADR 0003). Three ways in: a magic link by email, Google (when configured), and a passkey.
 * Anyone can create an account by signing in. Project access is still limited to listed contacts.
 * Session tokens are stored in our database. The library handles hashing, cookies and WebAuthn.
 */
export const auth = betterAuth({
  baseURL: env.APP_URL,
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
      : {},
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        const message = magicLinkEmail(url);
        await getEmailSender().send({ to: email, ...message });
      },
    }),
    passkey({
      rpID: new URL(env.APP_URL).hostname,
      rpName: "Cadence",
      origin: env.APP_URL,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
});

export type Auth = typeof auth;
