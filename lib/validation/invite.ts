import { z } from "zod";

export const inviteSchema = z.object({
  projectId: z.string().min(1, { error: "Missing project" }),
  email: z
    .string()
    .trim()
    .max(254, { error: "Keep the email address under 254 characters" })
    .pipe(z.email({ error: "Enter a valid email address" })),
});

export type InviteInput = z.infer<typeof inviteSchema>;
