import { env } from "@/lib/env";

export type OutboundEmail = { to: string; subject: string; text: string; html: string };

export interface EmailSender {
  send(email: OutboundEmail): Promise<void>;
}

/**
 * Development sender. Prints the message to the server console. The console
 * then holds live sign-in links, so this is never used in production.
 */
class ConsoleEmailSender implements EmailSender {
  async send(email: OutboundEmail): Promise<void> {
    console.info(`[dev email] to=${email.to} subject="${email.subject}"\n${email.text}`);
  }
}

/** Resend over its HTTP API. No SDK. Error bodies are not logged, because they may hold personal data. */
class ResendEmailSender implements EmailSender {
  constructor(private readonly apiKey: string, private readonly from: string) {}

  async send(email: OutboundEmail): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });
    if (!res.ok) throw new Error(`Email provider responded with HTTP ${res.status}`);
  }
}

/**
 * Picks the sender from configuration. In production, missing configuration is
 * an error, never a silent drop. Email must not disappear.
 */
export function getEmailSender(): EmailSender {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    return new ResendEmailSender(env.RESEND_API_KEY, env.EMAIL_FROM);
  }
  if (env.NODE_ENV === "production") {
    throw new Error("Email is not configured: set RESEND_API_KEY and EMAIL_FROM.");
  }
  return new ConsoleEmailSender();
}
