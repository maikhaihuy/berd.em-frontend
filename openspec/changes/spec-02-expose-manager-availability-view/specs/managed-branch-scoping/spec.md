## MODIFIED Requirements

### Requirement: Manager grants on subShift-linked subjects are branch-scoped
A Manager's permission grants on `assignments` and `availability` SHALL be scoped to the branches
they manage, using the same relation chain — `subShiftId` → `SubShift.masterShiftId` →
`MasterShift.branchId` — that already scopes `sub-shifts` and `tasks` grants. Previously
`assignments` (full CRUD) and `availability` (previously full CRUD, now read-only per the
`manager-availability-visibility` capability) carried no branch condition at all, so a Manager's
grant was effectively global across every branch, not just branches they manage.

`attendance-history`, `leave-requests`, and `time-logs` remain unconditioned for Manager, unchanged
by this requirement — the same underlying gap exists there but is explicitly out of scope for this
change (separate follow-up).

#### Scenario: Manager lists assignments for a branch they manage
- **WHEN** a Manager calls an `assignments` list endpoint scoped to a branch they manage
- **THEN** the response includes assignments for that branch's sub-shifts

#### Scenario: Manager lists assignments for a branch they do not manage
- **WHEN** a Manager calls an `assignments` list endpoint scoped to a branch they do not manage
- **THEN** the response excludes that branch's assignments (empty list for that branch, not a 403)

#### Scenario: Manager's availability read is branch-scoped the same way
- **WHEN** a Manager reads `Availability` records
- **THEN** only records whose `subShift.masterShift.branchId` is one of the Manager's managed
  branches are visible, via the same `SUBSHIFT_LINKED_MANAGED_BRANCH_CONDITION` relation chain
  used for `assignments`
