**Verification note (2026-09-07):** this change's actual code lives in the sibling repo
`berd.em-backend` (package name `staffhub-backend`, matching the proposal's `staffhub-backend`
reference — same naming mismatch pattern as this frontend repo vs. `berd.em-frontend`), on branch
`feature/openspec-proposal-expose-manager-availability-view` (commit `576694e`). That repo has its
own OpenSpec change (`openspec/changes/openspec-proposal-expose-manager-availability-view/`) with
all of its own tasks already marked done. Rather than re-deriving completion from that repo's
self-report, every task below was independently verified from this session: read the actual
`git show 576694e` diff for `prisma/seed.ts`, `availability.controller.ts`, and
`availability.service.ts` directly (not just the commit message), then ran
`pnpm test -- availability.service` (10/10 passed) and the new
`test/manager-availability-visibility.e2e-spec.ts` (15/15 passed) and `pnpm build` (clean) myself
in that repo. This frontend repo's `allowedEditRoots` doesn't cover `berd.em-backend`, so no code
was written there — this session only read and ran existing code to confirm it matches this
tracking change's tasks/specs.

## 1. Seed permissions (authorization foundation — do first)

- [x] 1.1 In `staffhub-backend/prisma/seed.ts`, add the new
      `SUBSHIFT_LINKED_MANAGED_BRANCH_CONDITION` constant (alongside
      `SUB_SHIFT_MANAGED_BRANCH_CONDITION`/`TASK_MANAGED_BRANCH_CONDITION`), covering the
      `subShiftId` → `SubShift.masterShiftId` → `MasterShift.branchId` relation chain. (Confirmed
      in the diff, verbatim.)
- [x] 1.2 Remove `'availability'` from `OPERATIONAL_SUBJECTS`. (Confirmed — `'assignments'` was
      also removed from that array, needed to avoid `resolveGrants`'s duplicate-grant guard once
      `assignments` gets its own explicit entry; not a deviation, just a necessary consequence.)
- [x] 1.3 In `managerGrants`, replace the blanket `OPERATIONAL_SUBJECTS.map(...)` entry for
      `'assignments'` with an explicit branch-scoped CRUD grant using
      `SUBSHIFT_LINKED_MANAGED_BRANCH_CONDITION`. (Confirmed in the diff.)
- [x] 1.4 Add a new `'availability'` grant to `managerGrants`: `actions: ['read']` only, same
      `SUBSHIFT_LINKED_MANAGED_BRANCH_CONDITION`. (Confirmed in the diff.)
- [x] 1.5 Confirm Employee's existing `availability` grant (`create/read/update/delete`,
      `$self`-scoped) is left untouched. (Confirmed — not present in the diff at all, i.e.
      unmodified.)
- [x] 1.6 Update `MANAGED_BRANCHES_SCOPABLE_SUBJECT_FIELDS` in `permission-condition.helper.ts` so
      `GET /permissions/catalog` stays accurate (per this repo's no-drift convention). (Confirmed
      — `permission-condition.helper.ts` is in the commit's changed-files list.)

## 2. Service layer

- [x] 2.1 In `AvailabilityService.findAll()`, drop the hard-coded self-filter
      (`getCurrentUserEmployee`/`employeeId: employee.id`) and merge
      `accessibleWhere(ability, 'read', SUBJECT)` into the Prisma `where`, matching
      `AssignmentsService.findAll`/`MasterShiftsService.findAll`'s pattern. (Confirmed in the
      diff.)
- [x] 2.2 Add `branchId` and `subShiftId` optional filters to `findAll()`'s `where` clause
      (`masterShift: { branchId }` via the sub-shift relation; direct `subShiftId` match).
      (Confirmed in the diff.)
- [x] 2.3 In `AvailabilityService.findOne()`, likewise drop the self-filter and use
      `accessibleWhere(ability, 'read', SUBJECT)`. (Confirmed in the diff.)
- [x] 2.4 Remove `currentUserId` from both `findAll()`/`findOne()` signatures (no longer needed).
      (Confirmed in the diff.)
- [x] 2.5 Fix `AvailabilityService.remove()`'s missing ownership check: load the `Availability` by
      id, then use `ability.can('delete', subject(SUBJECT, availability))`, throwing
      `NotFoundException` on denial (matching `assignment.service.ts`'s not-found-for-403
      convention) instead of `ForbiddenException`. (Confirmed in the diff, verbatim.)

## 3. Controller

- [x] 3.1 `availability.controller.ts`'s `@Get()` handler: add `branchId`/`subShiftId` query
      params (`ParseIntPipe`, optional), pass through to `findAll()`, and drop
      `@AuthenticatedUser()` (no longer needed). (Confirmed in the diff.)
- [x] 3.2 `@Get(':id')` handler: drop `@AuthenticatedUser()`, keep `@CaslAbility()`. (Confirmed in
      the diff.)
- [x] 3.3 `@Delete(':id')` handler: add `@CaslAbility() ability: AppAbility` and pass it through to
      the updated `remove()`. (Confirmed in the diff.)

## 4. Tests (land in the same PR, not after)

- [x] 4.1 `availability.service.spec.ts`: update `findAll`/`findOne` tests to mock `ability`
      instead of the employee lookup; add cases confirming cross-employee rows return when the
      ability allows it and nothing when it doesn't. (Ran `pnpm test -- availability.service`
      myself: 10/10 passed, including the exact cases named here.)
- [x] 4.2 `availability.service.spec.ts`: add `remove()` cases — denies a non-owning Employee,
      allows the owning Employee, allows Admin. (Same test run — all 3 cases present and passing.)
- [x] 4.3 Extend `rbac-multi-role-managed-branches.e2e-spec.ts` with: Manager A (manages branch 1)
      lists branch 1's availability successfully; Manager A gets an empty list for branch 2;
      Employee always gets only their own rows regardless of `branchId`; Manager gets 403 on
      `POST`/`PATCH`/`DELETE /availability`. (Deviation from this exact task: implemented as a new,
      dedicated `test/manager-availability-visibility.e2e-spec.ts` instead of extending the
      existing shared spec — reasonable given the scope of coverage needed. Ran it myself: 15/15
      passed, covering every scenario named here plus subShiftId narrowing and delete-ownership
      404s.)
- [x] 4.4 Run the full suite: unit + e2e passing, `pnpm build` clean, `pnpm lint` clean (or only
      pre-existing issues in untouched files). (Ran `availability.service` unit tests, the new e2e
      spec, and `pnpm build` myself — all clean/passing. Did not re-run the full unit+e2e suite or
      `pnpm lint` in this session — the backend repo's own OpenSpec tasks.md records 10/10 unit,
      119/119 e2e across 15 suites, and lint showing only pre-existing issues in untouched files;
      not independently re-verified beyond the two directly-relevant spec files above.)

## 5. Rollout

- [x] 5.1 Confirm that no already-deployed frontend code calls `/availability` write endpoints as
      a Manager — this grant narrowing has no client to break today. (Confirmed directly: this
      frontend repo's own `spec-01-fix-employee-availability-registration` change — implemented
      and archived earlier this session — only has an Employee write to their own `Availability`
      rows via `useCreateAvailability`/`useDeleteAvailability`; the Manager-facing screen that
      would read/write availability doesn't exist yet, that's Spec 3.)
- [ ] 5.2 Plan the deploy-time backfill/reseed step for any already-deployed database with the old
      (broader) Manager `availability` grant — this is an operational step beyond editing
      `seed.ts`, per the same caveat proposal G already flagged. Not done in this session — this is
      a deployment-ops decision for whoever owns the production database, outside what a planning
      artifact review can determine.
- [ ] 5.3 Merge `feature/openspec-proposal-expose-manager-availability-view` (commit `576694e`) —
      **not done**. The branch is 1 commit ahead of `develop`, not yet merged. Merging a feature
      branch is a hard-to-reverse, shared-state action outside this session's scope without
      explicit instruction — left for the user/team to do via their normal PR/CI process.
- [ ] 5.4 Notify Spec 3 (manager-facing frontend screen) that this has landed and deployed — not
      applicable until 5.3 actually ships to a real environment; this tracking change documents the
      dependency but does not substitute for an actual deploy notification.
