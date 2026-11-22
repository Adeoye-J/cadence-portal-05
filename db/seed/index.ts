/**
 * Seeds development data. Run with `pnpm db:seed` after `pnpm db:migrate`.
 * Refuses to run when NODE_ENV is production. Re-running is safe: every insert ignores existing rows.
 * Not run yet: needs a migrated Postgres database (docs/first-run.md, step 7).
 */
import { db } from "@/db/client";
import { user } from "@/db/auth-schema";
import {
  clients,
  memberships,
  milestones,
  projectContacts,
  projects,
  proposals,
  studios,
} from "@/db/schema";
import { buildSeedRows } from "@/db/seed/rows";

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }
  const rows = buildSeedRows();
  await db.transaction(async (tx) => {
    await tx.insert(user).values(rows.users).onConflictDoNothing();
    await tx.insert(studios).values(rows.studios).onConflictDoNothing();
    await tx.insert(memberships).values(rows.memberships).onConflictDoNothing();
    await tx.insert(clients).values(rows.clients).onConflictDoNothing();
    await tx.insert(projects).values(rows.projects).onConflictDoNothing();
    await tx.insert(projectContacts).values(rows.projectContacts).onConflictDoNothing();
    await tx.insert(milestones).values(rows.milestones).onConflictDoNothing();
    await tx.insert(proposals).values(rows.proposals).onConflictDoNothing();
  });
  console.log(
    `Seeded ${rows.studios.length} studio, ${rows.projects.length} projects, ${rows.milestones.length} milestones.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : "Seed failed.");
    process.exit(1);
  });
