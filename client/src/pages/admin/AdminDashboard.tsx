import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import api from "../../api";
import { useSocket } from "../../hooks/useSocket";
import {
  Users,
  CalendarCheck,
  FileText,
  Activity,
  Clock,
} from "lucide-react";
import { formatDate } from "../../lib/utils";

interface DashboardStats {
  totalEmployees: number;
  pendingLeaves: number;
  todayAttendanceCount: number;
}

interface AuditEntry {
  _id: string;
  action: string;
  timestamp: string;
  actorId: { name: string; employeeId: string } | null;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState<string[]>([]);

  useSocket({
    "attendance:new": (data) => {
      const payload = data as { type: string; userId: string };
      setLiveEvents((prev) => [
        `🟢 Attendance ${payload.type} — user ${payload.userId.slice(-6)}`,
        ...prev.slice(0, 4),
      ]);
    },
    "leave:new": (data) => {
      const payload = data as { leaveRequest: { type: string } };
      setLiveEvents((prev) => [
        `📄 New ${payload.leaveRequest.type} leave request submitted`,
        ...prev.slice(0, 4),
      ]);
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get("/admin/stats");
        setStats(data.data.stats);
        setRecentActivity(data.data.recentActivity);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const actionLabel: Record<string, string> = {
    USER_SIGNED_UP: "New signup",
    USER_LOGGED_IN: "User logged in",
    LEAVE_REQUEST_CREATED: "Leave request created",
    LEAVE_APPROVED: "Leave approved",
    LEAVE_REJECTED: "Leave rejected",
    ATTENDANCE_CHECKED_IN: "Checked in",
    ATTENDANCE_CHECKED_OUT: "Checked out",
    EMPLOYEE_UPDATED: "Profile updated",
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-slate-400 text-sm mt-0.5">System overview — {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Employees"
            value={isLoading ? "—" : stats?.totalEmployees ?? 0}
            subtitle="Active accounts"
            icon={Users}
            accentColor="violet"
          />
          <StatCard
            title="Today's Present"
            value={isLoading ? "—" : stats?.todayAttendanceCount ?? 0}
            subtitle="Checked in today"
            icon={CalendarCheck}
            accentColor="emerald"
          />
          <StatCard
            title="Pending Leaves"
            value={isLoading ? "—" : stats?.pendingLeaves ?? 0}
            subtitle="Awaiting approval"
            icon={FileText}
            accentColor="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Events Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-violet-400" />
              <h3 className="text-slate-200 font-semibold">Live Activity</h3>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400">Socket connected</span>
              </span>
            </div>
            {liveEvents.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">
                Waiting for real-time events…
              </p>
            ) : (
              <ul className="space-y-2">
                {liveEvents.map((evt, i) => (
                  <li key={i} className="text-sm text-slate-300 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-800 animate-slide-up">
                    {evt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Audit Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-slate-200 font-semibold">Recent Activity Log</h3>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-violet-500" />
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No recent activity.</p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((log) => (
                  <li key={log._id} className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-slate-300 text-sm">{actionLabel[log.action] ?? log.action}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        by {log.actorId?.name ?? "Unknown"} · {log.actorId?.employeeId ?? ""}
                      </p>
                    </div>
                    <span className="text-slate-600 text-xs whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
