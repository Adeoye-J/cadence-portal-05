# 0006: Repositories and transaction boundaries

**Status:** Proposed. Not started. Recommended to begin after the first real install, so the refactor
runs against a working typecheck and a real Vitest.

## Context

Server modules hold state in two ways that cannot survive a database:

1. **Fixture arrays read and mutated in place.** `demoProjects`, `demoProposals`, `demoMemberships` and
   `demoStudios` are imported directly. Modules change their objects: `project.stage = "signed"`,
   `milestone.status = next`, `proposal.version = …`. There are 35 such mutation sites across eight modules
   (`server/studio-writes.ts`, `server/milestones.ts`, `server/payments.ts`, `server/proposals.ts`,
   `server/invitations.ts`, `server/files.ts`, `server/events.ts`, `server/outbox.ts`).
2. **Module-level stores.** Seven stores live in process memory: events, file records, invitations,
   change requests, payments, signatures and the outbox (`MemoryOutbox`). They reset on restart and are
   not shared between server instances.

A third problem follows from how events work. `recordEvent` runs **after** each write, in process,
through 15 call sites. Once the data is in Postgres, a crash between the write and the event loses the
event, and with it the activity entry and the notification. This has to change in the same refactor. Moving
the arrays alone would keep the bug.

## Decision

Introduce one repository per aggregate, behind an interface. Business logic depends on the interface. Two
implementations exist: a memory implementation for tests and local runs, and a Drizzle implementation for
Postgres.

| Repository | Owns | Replaces |
|---|---|---|
| `ProjectRepository` | projects, milestones, project contacts | `demoProjects`, milestone and stage mutations |
| `ProposalRepository` | proposals, signatures | `demoProposals`, `signatures` map |
| `StudioRepository` | studios, memberships, clients | `demoStudios`, `demoMemberships` |
| `InvitationRepository` | invitations | `invitations` array |
| `PaymentRepository` | payments | `payments` map |
| `FileRepository` | file records | `records` array |
| `ChangeRequestRepository` | change requests and replies | `changeRequests` array |
| `EventLog` | project events | `events` array and listeners |
| `OutboxStore` | notification rows | already an interface (`server/outbox.ts`) |

### Rules

1. **Repositories return copies.** A caller that changes a returned object changes nothing until it calls
   `save`. The current habit of mutating what `find` returns is removed, because it hides the write from
   the database.
2. **Each operation is a unit of work.** A unit of work is one transaction in Postgres and one locked
   section in memory. These operations span several aggregates and must commit together:

   | Operation | Writes |
   |---|---|
   | `signProposal` | signature, proposal, project stage, milestone 1, event, notifications |
   | `settlePayment` | payment, milestone, project stage, event, notifications |
   | `approveMilestone` | milestone, next milestone, project stage, event, notifications |
   | `acceptInvitation` | invitation, project contacts, event |
   | `sendProposal` | proposal, event, notifications |
   | `createDraftProposal` | project, milestones, proposal, event |
   | `completeUpload` / `deleteFile` | file record, event |
   | `replyToChangeRequest` | change request, event |

3. **Events and notifications are written inside the same transaction as the change.** The `EventLog`
   and `OutboxStore` take the transaction as a parameter. The in-process listener that today turns events
   into notifications is removed. The outbox is written in the transaction, and the scheduled job sends it.
   This closes the lost-event gap, and also means a rolled-back change never emails anyone.
4. **Authorisation stays in the operation, not the repository.** Repositories do not know about roles.
   Each operation checks membership and role before it starts the unit of work.
5. **Idempotency keys stay where they are.** Dedupe keys on payments, signatures, invitations and outbox
   rows are enforced by unique indexes in Postgres. The memory implementations reproduce the same
   behaviour, so the tests exercise the same rules.

## Test impact

Six test files mutate fixtures directly (`change-request-reply`, `files-lifecycle`, `files`,
`milestone-flow`, `proposal-builder`, and the fixture setup in `payments`). They change to seed through the
memory repository, for example `seedProject({ milestones: [{ status: "in_progress" }] })`. Assertions stay
the same. The refactor is complete when every test passes unchanged in its assertions.

## Sequencing

1. Real install, typecheck, lint, Vitest, build (docs/first-run.md). Fix what surfaces.
2. Define the interfaces and the memory implementations. Move one aggregate at a time, starting with
   `ProjectRepository`, because the rest depend on it. Run the suite after each move.
3. Move events and the outbox into the unit of work. This is the change that fixes the lost-event gap.
4. Write the Drizzle implementations against the migrated schema, then run the suite against Postgres
   (a test database per run) to confirm the two implementations agree.
5. Remove the fixture imports from server code. Fixtures are used only by the seed script and by the
   memory implementation's default data.

## Consequences

- Business logic and tests run without a database. Production runs on Postgres with the same rules.
- The refactor touches about eight server modules and six test files. It is large but mechanical, and the
  existing suite is a strong check on it.
- Until step 3 is complete, events can be lost on a crash. Any environment with real users must not rely on
  activity or notifications before then.

## Update: implemented

The repository layer is the store (`server/store`, `server/core`). One interface, an in-memory implementation for tests and a Postgres implementation. Every change is a command that checks the state it depends on and writes its activity events and notification rows in the same transaction (`server/effects.ts`). Domain modules call commands and never edit records.
