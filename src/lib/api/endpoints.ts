export const API_ENDPOINTS = {
  // Auth
  // NOTE: REGISTER/FORGOT_PASSWORD/RESET_PASSWORD don't exist on the backend
  // (password-reset flows were dropped in favor of Zalo auth) - the
  // corresponding auth.service.ts methods are dead until the backend adds
  // them back or the frontend drops these flows. CHANGE_PASSWORD is live
  // (staffhub-backend's auto-provision-user-on-employee-create).
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  
  // Branches
  BRANCHES: {
    BASE: '/branches',
    BY_ID: (id: number) => `/branches/${id}`,
    WITH_SHIFTS: (id: number) => `/branches/${id}/shifts`,
    WITH_SCHEDULES: (id: number) => `/branches/${id}/schedules`,
  },
  
  // Employees
  EMPLOYEES: {
    BASE: '/employees',
    BY_ID: (id: number) => `/employees/${id}`,
    HOURLY_RATES: (id: number) => `/employees/${id}/hourly-rates`,
    // Self-service update, resolved from the caller's JWT - no :id param, so
    // there is no way to target another employee. Restricted server-side to
    // phoneNumber/email/address (any other field hard-400s); 403s if the
    // caller's account has no linked Employee.
    ME: '/employees/me',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: number) => `/users/${id}`,
    ROLES: (id: number) => `/users/${id}/roles`,
    ROLE_BY_ID: (id: number, roleId: number) => `/users/${id}/roles/${roleId}`,
    MANAGER_BRANCHES: (id: number) => `/users/${id}/manager-branches`,
    MANAGER_BRANCH_BY_ID: (id: number, branchId: number) =>
      `/users/${id}/manager-branches/${branchId}`,
  },

  // Roles
  ROLES: {
    BASE: '/roles',
    BY_ID: (id: number) => `/roles/${id}`,
  },
  PERMISSIONS: {
    BASE: '/permissions',
    BY_ID: (id: number) => `/permissions/${id}`,
    CATALOG: '/permissions/catalog',
  },
  ROLE_PERMISSIONS: {
    BASE: '/role-permissions',
    BY_ROLE: (roleId: number) => `/role-permissions/role/${roleId}`,
    BY_ROLE_AND_PERMISSION: (roleId: number, permissionId: number) =>
      `/role-permissions/role/${roleId}/permission/${permissionId}`,
  },
  ME_ABILITIES: '/me/abilities',
  USER_ABILITIES: (userId: number) => `/users/${userId}/abilities`,
  AUDIT_LOGS: {
    BASE: '/audit-logs',
  },

  // Master Shift Templates (recurring shift definitions per branch, e.g. "Morning Shift")
  MASTER_SHIFT_TEMPLATES: {
    BASE: '/master-shift-templates',
    BY_ID: (id: number) => `/master-shift-templates/${id}`,
  },

  // Master Shifts (a dated instance of a shift, optionally generated from a template)
  MASTER_SHIFTS: {
    BASE: '/master-shifts',
    BY_ID: (id: number) => `/master-shifts/${id}`,
    GENERATE: '/master-shifts/generate',
  },

  // Sub Shifts (a role/slot within a MasterShift, e.g. "Cashier") - the
  // frontend currently auto-creates one default sub-shift per MasterShift.
  SUB_SHIFTS: {
    BASE: '/sub-shifts',
    BY_ID: (id: number) => `/sub-shifts/${id}`,
  },

  // Sub Shift Templates (a MAIN/SUPPORT staffing slot inside a MasterShiftTemplate)
  SUB_SHIFT_TEMPLATES: {
    BASE: '/sub-shift-templates',
    BY_ID: (id: number) => `/sub-shift-templates/${id}`,
  },

  // Task Templates (an operational checklist item, e.g. "Open register",
  // optionally tied to a MasterShiftTemplate/SubShiftTemplate)
  TASK_TEMPLATES: {
    BASE: '/task-templates',
    BY_ID: (id: number) => `/task-templates/${id}`,
  },

  // Assignments (an employee assigned to a SubShift)
  ASSIGNMENTS: {
    BASE: '/assignments',
    BY_ID: (id: number) => `/assignments/${id}`,
    CHECK_IN: (id: number) => `/assignments/${id}/check-in`,
    CHECK_OUT: (id: number) => `/assignments/${id}/check-out`,
  },

  // Payroll Entries (one per VERIFIED TimeLog, created via generate())
  // Note: no PAY_PERIODS block here - GET /pay-periods 403s for the Employee
  // role (no grant on that subject), so this Staff-facing feature reads pay
  // period metadata (id/status/startDate/endDate) from the payPeriod relation
  // nested on each PayrollEntry instead (payrollEntryInclude, backend-side).
  PAYROLL_ENTRIES: {
    BASE: '/payroll-entries',
    BY_ID: (id: number) => `/payroll-entries/${id}`,
    SUMMARY: '/payroll-entries/summary',
  },

  // Time Tracking (TimeLog records - check-in/out + manager verification)
  TIME_TRACKING: {
    BY_EMPLOYEE: (employeeId: number) => `/time-tracking/employee/${employeeId}`,
  },
} as const;