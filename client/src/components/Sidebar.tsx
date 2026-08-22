import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  DollarSign,
  BarChart3,
  LogOut,
  ChevronRight,
  Building2,
  UserCircle,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { UserRole } from "../context/AuthContext";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/employee/dashboard",
    icon: LayoutDashboard,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Admin Dashboard",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "HR"],
  },
  {
    label: "My Attendance",
    to: "/employee/attendance",
    icon: CalendarCheck,
    roles: ["EMPLOYEE"],
  },
  {
    label: "My Leaves",
    to: "/employee/leaves",
    icon: FileText,
    roles: ["EMPLOYEE"],
  },
  {
    label: "My Payroll",
    to: "/employee/payroll",
    icon: DollarSign,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Profile",
    to: "/employee/profile",
    icon: UserCircle,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Employees",
    to: "/admin/employees",
    icon: Users,
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Attendance",
    to: "/employee/attendance",
    icon: CalendarCheck,
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Leave Approvals",
    to: "/admin/leave-approvals",
    icon: FileText,
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Payroll",
    to: "/admin/payroll",
    icon: DollarSign,
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Analytics",
    to: "/admin/analytics",
    icon: BarChart3,
    roles: ["ADMIN", "HR"],
  },
];

const Sidebar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  const displayName = user?.fullName || user?.firstName || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white border-r border-gray-200 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-slate-900 font-bold text-sm tracking-wide">Dayflow</h1>
          <p className="text-slate-500 text-xs">HRMS</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 text-sm font-medium truncate">{displayName}</p>
            <p className="text-slate-500 text-xs capitalize">{role?.toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to + item.label}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-gray-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <ChevronRight className="w-3 h-3 ml-auto text-brand-600" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
