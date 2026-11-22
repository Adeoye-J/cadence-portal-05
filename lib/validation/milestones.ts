import { z } from "zod";

export const approveSchema = z.object({
  projectId: z.string().min(1, { error: "Missing project" }),
  position: z.coerce.number().int({ error: "Missing milestone" }).min(1, { error: "Missing milestone" }),
  agreed: z.literal("on", { error: "Confirm that you have reviewed the deliverable" }),
});

export const replySchema = z.object({
  projectId: z.string().min(1, { error: "Missing project" }),
  changeRequestId: z.string().min(1, { error: "Missing change request" }),
  body: z
    .string()
    .trim()
    .min(2, { error: "Write a reply of at least 2 characters" })
    .max(2000, { error: "Keep the reply under 2000 characters" }),
});

export const changeRequestSchema = z.object({
  projectId: z.string().min(1, { error: "Missing project" }),
  position: z.coerce.number().int({ error: "Missing milestone" }).min(1, { error: "Missing milestone" }),
  body: z
    .string()
    .trim()
    .min(10, { error: "Describe the change in at least 10 characters" })
    .max(2000, { error: "Keep the change request under 2000 characters" }),
});
