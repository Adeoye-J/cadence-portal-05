import { z } from "zod";

/** Countries offered at sign-up, as the design lists them. */
export const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "NG", name: "Nigeria" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "NL", name: "Netherlands" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SG", name: "Singapore" },
] as const;

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, { error: "Enter your full name" }).max(120, { error: "Keep the name under 120 characters" }),
  workEmail: z
    .string()
    .trim()
    .max(254, { error: "Keep the email under 254 characters" })
    .pipe(z.email({ error: "Enter a valid work email" })),
  studioName: z.string().trim().min(2, { error: "Enter your studio or business name" }).max(120, { error: "Keep the name under 120 characters" }),
  country: z.enum(COUNTRIES.map((c) => c.code) as [string, ...string[]], { error: "Choose a country" }),
  currency: z.enum(["USD", "NGN"], { error: "Choose USD or NGN" }),
  terms: z.literal("on", { error: "Accept the terms to continue" }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
