"use server";

import { z } from "zod";
import { getViewer } from "@/lib/session";
import { buildEffects } from "@/server/effects";
import { addProposalNote } from "@/server/proposal-notes";
import { getProposalView } from "@/server/proposals";

const noteSchema = z.object({
  proposalId: z.string().min(1).max(80),
  kind: z.enum(["general", "section", "change"]),
  sectionRef: z.string().max(60).optional(),
  body: z
    .string()
    .trim()
    .min(3, { error: "Write at least 3 characters" })
    .max(2000, { error: "Keep the note under 2000 characters" }),
});

export type NoteResult = { ok: true } | { ok: false; error: string };

/**
 * Saves a note from a client on a proposal they are a contact for. The studio is told through the project's activity
 * log, using the same event as change requests, so existing notifications apply without a new kind.
 */
export async function addProposalNoteAction(input: unknown): Promise<NoteResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Sign in to add a note." };

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the note and try again." };

  const view = await getProposalView(viewer.userId, parsed.data.proposalId);
  if (!view) return { ok: false, error: "This proposal is not open to your account." };

  const effects = await buildEffects({
    projectId: view.project.id,
    kind: "changes_requested",
    actor: "client",
    summary: parsed.data.kind === "change" ? "Client asked for changes to the proposal" : "Client added a note to the proposal",
  });
  await addProposalNote(
    {
      proposalId: view.proposal.id,
      projectId: view.project.id,
      authorUserId: viewer.userId,
      kind: parsed.data.kind,
      sectionRef: parsed.data.sectionRef ?? null,
      body: parsed.data.body,
    },
    effects,
  );
  return { ok: true };
}
