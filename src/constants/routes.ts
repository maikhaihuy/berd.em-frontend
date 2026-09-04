import {
  Bike,
  CalendarClock,
  CalendarCheck,
  CalendarRange,
  Clock,
  History,
  KeyRound,
  MapPinned,
  Search,
  ShieldCheck,
  SquareTerminal,
  Store,
  Users,
  UserCog,
  UserRound,
  CalendarPlus2,
  Wallet,
} from 'lucide-react';
import React from 'react';

// routes.ts
export interface RouteConfig {
  path: string;
  name: string;
  breadcrumb?: string;
  icon: React.ElementType;
  children?: RouteConfig[];
  /**
   * Ability check gating this route's nav entry, e.g. { action: 'read',
   * subject: 'Branch' }. Checked via `ability.can(action, subject)` against
   * the current admin's resolved abilities (see app-sidebar.tsx) - a route
   * with no requiredPermission is always shown. Subject names here are this
   * frontend's own convention; they only resolve to something visible once
   * a matching Permission has actually been created and granted (via
   * /permissions and /roles/:id's matrix) with the same action+subject.
   */
  requiredPermission?: { action: string; subject: string };
}

export const GENERAL_ROUTES: RouteConfig[] = [
  {
    path: '/',
    name: 'Tổng quan',
    breadcrumb: 'Tổng quan',
    icon: SquareTerminal,
  },
  {
    path: '/my-availabilities',
    name: 'Đăng ký ca',
    breadcrumb: 'Đăng ký ca',
    icon: CalendarPlus2
  },
  {
    path: '/my-calendars',
    name: 'Xem lịch ca',
    breadcrumb: 'Xem lịch ca',
    icon: CalendarCheck,
  },
  {
    path: '/attendanceTracking',
    name: 'Điểm danh',
    breadcrumb: 'Điểm danh',
    icon: MapPinned,
  },
  {
    path: '/income',
    name: 'Thu nhập',
    breadcrumb: 'Thu nhập',
    icon: Wallet,
  },
  {
    path: '/profile',
    name: 'Cá nhân',
    breadcrumb: 'Cá nhân',
    icon: UserRound,
  },
];

export const MANAGER_ROUTES: RouteConfig[] = [
  {
    path: '/availabilities',
    name: 'Ca đăng ký',
    breadcrumb: 'Ca đăng ký',
    icon: CalendarClock,
    requiredPermission: { action: 'read', subject: 'availability' },
  },
  {
    path: '/rosters',
    name: 'Lịch làm việc',
    breadcrumb: 'Lịch làm việc',
    icon: CalendarRange,
    requiredPermission: { action: 'read', subject: 'Roster' },
  },
  {
    path: '/shipLogs',
    name: 'Ship',
    breadcrumb: 'Ship',
    icon: Bike,
    requiredPermission: { action: 'read', subject: 'ShipLog' },
  },
];

export const ADMIN_ROUTES: RouteConfig[] = [
  {
    path: '/employees',
    name: 'Nhân viên',
    breadcrumb: 'Nhân viên',
    icon: Users,
    requiredPermission: { action: 'read', subject: 'employees' },
  },
  {
    path: '/branches',
    name: 'Chi nhánh',
    breadcrumb: 'Chi nhánh',
    icon: Store,
    requiredPermission: { action: 'read', subject: 'branches' },
  },
  {
    path: '/users',
    name: 'Người dùng',
    breadcrumb: 'Người dùng',
    icon: UserCog,
    requiredPermission: { action: 'read', subject: 'users' },
  },
  {
    path: '/shifts',
    name: 'Loại ca làm việc',
    breadcrumb: 'Loại ca làm việc',
    icon: Clock,
    requiredPermission: { action: 'read', subject: 'Shift' },
  },
  {
    path: '/roles',
    name: 'Vai trò',
    breadcrumb: 'Vai trò',
    icon: ShieldCheck,
    requiredPermission: { action: 'read', subject: 'roles' },
  },
  {
    path: '/permissions',
    name: 'Danh mục quyền',
    breadcrumb: 'Danh mục quyền',
    icon: KeyRound,
    requiredPermission: { action: 'read', subject: 'permissions' },
  },
  {
    path: '/permission-simulator',
    name: 'Kiểm tra quyền',
    breadcrumb: 'Kiểm tra quyền',
    icon: Search,
    requiredPermission: { action: 'read', subject: 'permissions' },
  },
  {
    path: '/audit-log',
    name: 'Nhật ký thay đổi',
    breadcrumb: 'Nhật ký thay đổi',
    icon: History,
    requiredPermission: { action: 'read', subject: 'audit-logs' },
  },
];
