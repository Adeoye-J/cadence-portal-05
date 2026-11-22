import { z } from "zod";

/**
 * Sign-off input. The same schema validates the form on the server (Server
 * Action) and on the client. A native checkbox sends "on" when checked.
 */
export const signProposalSchema = z.object({
  proposalId: z.string().min(1, { error: "Missing proposal" }),
  typedName: z
    .string()
    .trim()
    .min(2, { error: "Enter your full name" })
    .max(120, { error: "Keep the name to 120 characters or fewer" }),
  agreed: z.literal("on", { error: "Confirm that you have read the terms" }),
});

export type SignProposalInput = z.infer<typeof signProposalSchema>;
