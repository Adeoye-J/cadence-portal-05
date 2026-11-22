import { z } from "zod";

export const MAX_MILESTONES = 12;

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

const milestoneInput = z.object({
  title: z
    .string()
    .trim()
    .min(2, { error: "Give each milestone a title of at least 2 characters" })
    .max(120, { error: "Keep milestone titles under 120 characters" }),
  description: z.string().trim().max(500, { error: "Keep milestone descriptions under 500 characters" }),
  amount: z
    .number({ error: "Enter an amount for every milestone" })
    .positive({ error: "Milestone amounts must be more than zero" })
    .max(100_000_000, { error: "Milestone amounts must be under 100,000,000" }),
  dueDate: z
    .string()
    .trim()
    .refine((v) => v === "" || isoDate.test(v), { error: "Use a valid due date" }),
});

export const createProposalSchema = z.object({
  clientName: z.string().trim().min(2, { error: "Enter the client's name" }).max(120, { error: "Keep the client name under 120 characters" }),
  title: z.string().trim().min(2, { error: "Enter a project title" }).max(120, { error: "Keep the project title under 120 characters" }),
  currency: z.enum(["USD", "NGN"], { error: "Choose USD or NGN" }),
  revisionTerms: z.string().trim().min(1, { error: "Add the revision terms" }).max(500, { error: "Keep revision terms under 500 characters" }),
  milestones: z
    .array(milestoneInput)
    .min(1, { error: "Add at least one milestone" })
    .max(MAX_MILESTONES, { error: `Use at most ${MAX_MILESTONES} milestones` }),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;

/** Converts a major-unit amount (dollars, naira) to integer minor units. Rounds to the nearest minor unit. */
export function toMinor(amount: number): number {
  return Math.round(amount * 100);
}
