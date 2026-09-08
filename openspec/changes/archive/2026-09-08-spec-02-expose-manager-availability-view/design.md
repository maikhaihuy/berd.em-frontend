## Context

This change lives in `staffhub-backend`, not this frontend repo — it's tracked here because the
frontend team owns the 3-spec cross-repo plan (Spec 1: frontend fix, already shipped; Spec 2: this
backend change; Spec 3: the manager-facing frontend screen, blocked on this one landing).

Today `AvailabilityService.findAll()`/`findOne()` hard-code the query to the calling user's own
`Employee` row via a private `getCurrentUserEmployee()` helper, ignoring whatever the caller's CASL
grant would otherwise allow. This is inconsistent with every sibling service
(`AssignmentsService.findAll`, `MasterShiftsService.findAll`), which just merge
`accessibleWhere(ability, 'read', SUBJECT)` into the query and let the resolved grant (seeded in
`prisma/seed.ts`, `$self` included) decide visibility. Naively removing the hard-coded filter would
also expose an existing gap: Manager's `availability` and `assignments` grants currently carry no
branch condition at all, so an unscoped fix would let a Manager see every branch's data, not just
branches they manage.

Per the proposal, this has already been implemented and reviewed against the real `develop` branch
(`feature/openspec-proposal-expose-manager-availability-view`, commit `576694e`): unit tests
10/10, e2e 119/119, `pnpm build`/`pnpm lint` clean. This design doc records the reasoning behind
the choices that review already validated, for anyone picking up the merge or building Spec 3
against it.

## Goals / Non-Goals

**Goals:**
- A Manager can list every employee's registered availability for branches they manage, via the
  existing `GET /availability` endpoint plus a `branchId` filter — no new endpoint.
- An Employee calling the same endpoint keeps seeing only their own rows, unconditionally — the
  permission grant enforces this, not endpoint-specific role branching.
- Close the adjacent branch-scoping gap on `assignments` (Manager already has CRUD there, but
  unconditioned) using the same relation-chain condition, in the same change, since it's the same
  root cause and touches the same seed block.
- Narrow Manager's `availability` grant to read-only — Manager never writes `Availability` directly
  (`AssignmentsService.create()` flips its status internally), so removing unused write grants is a
  real least-privilege improvement, not just a scoping fix.
- Fix `AvailabilityService.remove()`'s missing ownership check (`update()` has one, `remove()`
  doesn't) using the same instance-level CASL check pattern already used elsewhere
  (`AssignmentsService.checkIn()`/`checkOut()`), now that Manager's role no longer implicitly
  covers it via unconditioned CRUD.

**Non-Goals:**
- No shift-change / swap / substitute-coverage requests.
- No hard server-side validation blocking a Manager from assigning outside declared availability.
- No recurring/template availability, submission deadlines, or reminder notifications.
- No new "2-hour block" entity — granularity stays whatever the branch's `SubShift`s are.
- No branch-scoping fix for `attendance-history`/`leave-requests`/`time-logs` (same unconditioned-
  Manager-grant issue exists there, but it's a different feature surface — separate follow-up).
- No change to `POST /master-shifts/generate` or weekly auto-generation.
- Item #5 (`create()` branch-membership check) is explicitly optional/deferred, not required to
  ship this change — low risk since it's self-registration only, no cross-employee exposure.

## Decisions

### 1. Let the CASL grant do the work instead of role-branching in the service

`findAll`/`findOne` drop the manual self-filter entirely and merge
`accessibleWhere(ability, 'read', SUBJECT)` into the Prisma query, matching the pattern every
sibling service already uses. Once Manager's grant is correctly branch-scoped (Decision 2), this
single code path naturally does the right thing for every role: Employee's `$self` condition keeps
them self-scoped, Manager's new branch condition scopes them to managed branches, Admin's
unconditioned grant sees everything.

Alternative considered: keep the endpoint role-aware (e.g. `if (isManager) {...} else {...}`).
Rejected — this is exactly the inconsistency the proposal identifies as the root problem, and
every other service in this codebase has already moved away from it. Introducing a second
role-branching code path here would leave the codebase with two competing patterns.

### 2. One shared branch condition for both `Availability` and `Assignment`

Both entities reach their branch the same way — required `subShiftId` → `SubShift.masterShiftId`
→ `MasterShift.branchId` — one hop deeper than `SubShift`'s own
`SUB_SHIFT_MANAGED_BRANCH_CONDITION`. A single new constant
(`SUBSHIFT_LINKED_MANAGED_BRANCH_CONDITION`) is defined once and reused for both grants, rather
than duplicating the same three-level relation chain twice.

### 3. Narrow Manager's `availability` grant to read-only, not read-write

Manager's actual write path for availability is indirect: `AssignmentsService.create()` flips
`Availability.status` to `ASSIGNED` inside its own transaction, not through the `/availability`
endpoints. Manager has never needed direct `create`/`update`/`delete` on `Availability`, so this
change removes access that was never exercised, rather than branch-scoping write access that would
otherwise need its own review. This does mean `AvailabilityService.remove()` needs its own
ownership check now (Decision 4) — Manager can no longer implicitly delete `Availability` rows via
an unconditioned grant that happened to allow it.

### 4. Instance-level CASL check in `remove()`, not another manual field comparison

`update()` already manually compares `availability.employeeId !== employee.id`. Rather than
copying that pattern into `remove()`, this change uses `ability.can('delete', subject(SUBJECT,
availability))` — the same pattern `AssignmentsService.checkIn()`/`checkOut()` already use for
instance-level checks. This keeps ownership logic declarative (driven by the seeded grant) instead
of duplicated imperative checks that could drift from the grant definition over time. On denial, it
throws `NotFoundException` (not `ForbiddenException`), matching `assignment.service.ts`'s existing
not-found-for-403 convention — consistent error shape across sibling endpoints, and avoids leaking
whether a given id exists to a caller who has no access to it.

## Risks / Trade-offs

- **[Risk]** Narrowing an already-seeded role's grant (removing Manager's `create`/`update`/
  `delete` on `availability`) is a live-database backfill concern, not just a `seed.ts` edit — a
  production database seeded before this change has Manager rows with the old, broader grant.
  → **Mitigation**: proposal explicitly flags this (same caveat as prior proposal G) and confirms,
  by audit, that no current frontend code calls those endpoints as a Manager today (the
  manager-facing screen doesn't exist yet — that's Spec 3, gated on this shipping first). Still
  requires a deliberate reseed/backfill step at deploy time, not assumed to happen automatically.
- **[Risk]** Removing `currentUserId` from `findAll`/`findOne` signatures is a breaking change to
  those methods' call sites (controller included).
  → **Mitigation**: proposal's diff review confirms both controller handlers were updated in the
  same change; unit/e2e coverage (10/10, 119/119) exercises the new signatures directly.
- **[Risk]** `GET /availability?branchId=<unmanaged>` returning an empty list (not a 403) is a
  deliberate convention match with `master-shifts`/`assignments`, but is easy to miss if someone
  expects a 403 for an out-of-scope branch.
  → **Mitigation**: documented explicitly in the proposal's API Specification section; e2e plan
  includes this exact case (Manager A gets an empty list for a branch they don't manage).

## Migration Plan

No Prisma migration — this is service logic plus one seed-permission edit, per the proposal.
1. Seed change (permission grants) lands first — it's the authorization foundation the service
   changes depend on.
2. Service + controller changes land in the same PR as the seed change (not split) — the
   inconsistency between an unscoped service and a scoped grant is itself a bug, so both must ship
   together.
3. Unit + e2e tests land in the same PR, not after — per the proposal, this repo's own prior audits
   have flagged authorization-sensitive changes shipping without coverage as a recurring risk.
4. Deploy-time backfill: reseed/verify role/permission rows on the already-deployed database before
   or as part of rollout, per the Risk above — this is an operational step outside this repo's
   `prisma/seed.ts` file itself.
5. Rollback: revert the PR. Since no schema/migration changed, rollback is a plain code revert; the
   main residual concern is whether a backfilled permission narrowing was already applied to a live
   database and needs to be reversed too (unlikely to matter in practice, since the audit found no
   current caller depends on Manager's removed write access).

## Open Questions

- None outstanding per the proposal — it states the implementation is complete, reviewed diff-vs-
  spec with no discrepancies, and ready to merge pending the team's own CI confirmation. The one
  action item is operational (deploy-time backfill, see Risks), not a design decision to resolve
  here.
