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
} from "lucide-react";
import { cn } from "../lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles: Array<"employee" | "manager" | "admin">;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/employee/dashboard",
    icon: LayoutDashboard,
    roles: ["employee", "manager"],
  },
  {
    label: "Admin Dashboard",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    label: "My Attendance",
    to: "/employee/attendance",
    icon: CalendarCheck,
    roles: ["employee", "manager"],
  },
  {
    label: "My Leaves",
    to: "/employee/leaves",
    icon: FileText,
    roles: ["employee", "manager"],
  },
  {
    label: "Profile",
    to: "/employee/profile",
    icon: Users,
    roles: ["employee", "manager"],
  },
  {
    label: "Employees",
    to: "/admin/employees",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "Leave Approvals",
    to: "/admin/leave-approvals",
    icon: FileText,
    roles: ["admin", "manager"],
  },
  {
    label: "Payroll",
    to: "/admin/payroll",
    icon: DollarSign,
    roles: ["admin"],
  },
  {
    label: "Analytics",
    to: "/admin/analytics",
    icon: BarChart3,
    roles: ["admin"],
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

  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-slate-900 border-r border-slate-800 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm tracking-wide">Dayflow</h1>
          <p className="text-slate-400 text-xs">HRMS</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-600/40 flex items-center justify-center text-violet-400 text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
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
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-violet-600/15 text-violet-400 border border-violet-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <ChevronRight className="w-3 h-3 ml-auto text-violet-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
