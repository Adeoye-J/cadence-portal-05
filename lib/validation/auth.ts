import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, { error: "Keep the email address under 254 characters" })
    .pipe(z.email({ error: "Enter a valid email address" })),
});

export type SignInInput = z.infer<typeof signInSchema>;
