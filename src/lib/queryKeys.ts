export const queryKeys = {
  employees: {
    all: () => ["employees"],
    detail: (employeeId: number) => ["employees", "detail", employeeId],
  },
  users: {
    all: () => ["users"],
    detail: (userId: number) => ["users", "detail", userId],
  },
  branches: {
    all: () => ["branches"],
    detail: (branchId: number) => ["branches", "detail", branchId],
  },
  roles: {
    all: () => ["roles"],
    detail: (roleId: number) => ["roles", "detail", roleId],
  },
  permissions: {
    all: () => ["permissions"],
    detail: (permissionId: number) => ["permissions", "detail", permissionId],
    catalog: () => ["permissions", "catalog"],
  },
  rolePermissions: {
    byRole: (roleId: number) => ["rolePermissions", "byRole", roleId],
  },
  abilities: {
    // Keyed by userId (not just "me") so switching logged-in users doesn't
    // briefly show the previous user's cached abilities before refetching.
    me: (userId?: number) => ["abilities", "me", userId],
    byUser: (userId: number) => ["abilities", "byUser", userId],
  },
  auditLogs: {
    list: (filter: Record<string, string | number | undefined>) => ["auditLogs", "list", filter],
  },
  rosters: {
    byEmployee: (employeeId: number) => ["rosters", "byEmployee", employeeId],
  },
  schedules: {
    withRosters: (branchId?: number) => ["schedules", "withRosters", branchId ? { branchId } : {}],
  },
  shifts: {
    byBranch: (branchId: number) => ["shifts", "byBranch", branchId],
    detail: (shiftId: number) => ["shifts", "detail", shiftId],
  },
  masterShiftTemplates: {
    byBranch: (branchId: number) => ["masterShiftTemplates", "byBranch", branchId],
    detail: (id: number) => ["masterShiftTemplates", "detail", id],
  },
  masterShifts: {
    list: (filter: { branchId?: number; from?: string; to?: string }) => ["masterShifts", "list", filter],
    detail: (id: number) => ["masterShifts", "detail", id],
  },
  subShifts: {
    byMasterShift: (masterShiftId: number) => ["subShifts", "byMasterShift", masterShiftId],
    detail: (id: number) => ["subShifts", "detail", id],
  },
  subShiftTemplates: {
    byMasterShiftTemplate: (branchId: number, masterShiftTemplateId: number) =>
      ["subShiftTemplates", "byMasterShiftTemplate", branchId, masterShiftTemplateId],
  },
  taskTemplates: {
    byBranch: (branchId: number) => ["taskTemplates", "byBranch", branchId],
  },
  assignments: {
    all: () => ["assignments"],
    bySubShift: (subShiftId: number) => ["assignments", "bySubShift", subShiftId],
    byEmployee: (employeeId: number) => ["assignments", "byEmployee", employeeId],
    detail: (id: number) => ["assignments", "detail", id],
  },
  payrollEntries: {
    byEmployee: (employeeId: number) => ["payrollEntries", "byEmployee", employeeId],
    byPeriodAndEmployee: (payPeriodId: number, employeeId: number) =>
      ["payrollEntries", "byPeriodAndEmployee", payPeriodId, employeeId],
    summary: (employeeId: number) => ["payrollEntries", "summary", employeeId],
  },
  timeLogs: {
    byEmployee: (employeeId: number) => ["timeLogs", "byEmployee", employeeId],
  },
}
