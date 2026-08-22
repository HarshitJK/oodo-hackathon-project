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
  UserCheck,
  Building,
} from "lucide-react";
import { formatDate } from "../../lib/utils";

interface DepartmentStat {
  department: string;
  count: number;
}

interface RecentEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  department: string;
  designation: string;
  createdAt: string;
}

interface AdminDashboardData {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  halfDayToday: number;
  absentToday: number;
  pendingLeaveRequests: number;
  departmentDistribution: DepartmentStat[];
  recentEmployees: RecentEmployee[];
}

interface AuditEntry {
  _id: string;
  action: string;
  module: string;
  timestamp: string;
  actor?: { firstName: string; lastName: string; employeeId: string };
}

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState<string[]>([]);

  useSocket({
    "attendance:update": (payload) => {
      const p = payload as { action: string; employeeId: string };
      setLiveEvents((prev) => [
        `🟢 Attendance ${p.action || "updated"} for employee ${p.employeeId?.slice(-6)}`,
        ...prev.slice(0, 5),
      ]);
    },
    "leave:new": (payload) => {
      const p = payload as { leave?: { leaveType: string } };
      setLiveEvents((prev) => [
        `📄 New ${p?.leave?.leaveType || ""} leave request submitted`,
        ...prev.slice(0, 5),
      ]);
    },
    "leave:update": (payload) => {
      const p = payload as { action: string };
      setLiveEvents((prev) => [
        `⚖️ Leave decision: ${p.action}`,
        ...prev.slice(0, 5),
      ]);
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [dashRes, auditRes] = await Promise.allSettled([
          api.get("/dashboard/admin"),
          api.get("/audit?limit=6"),
        ]);

        if (dashRes.status === "fulfilled" && dashRes.value.data?.data) {
          setData(dashRes.value.data.data);
        }
        if (auditRes.status === "fulfilled" && auditRes.value.data?.data) {
          setAuditLogs(auditRes.value.data.data.logs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">HR & Admin Overview</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time workforce health, attendance, and administrative queue
          </p>
        </div>

        {/* Primary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Workforce"
            value={isLoading ? "—" : data?.totalEmployees ?? 0}
            subtitle={`${data?.activeEmployees ?? 0} active accounts`}
            icon={Users}
            accentColor="brand"
          />
          <StatCard
            title="Present Today"
            value={isLoading ? "—" : data?.presentToday ?? 0}
            subtitle={`${data?.halfDayToday ?? 0} half day`}
            icon={CalendarCheck}
            accentColor="emerald"
          />
          <StatCard
            title="Absent Today"
            value={isLoading ? "—" : data?.absentToday ?? 0}
            subtitle="Not checked in"
            icon={UserCheck}
            accentColor="rose"
          />
          <StatCard
            title="Pending Leaves"
            value={isLoading ? "—" : data?.pendingLeaveRequests ?? 0}
            subtitle="Requires manager action"
            icon={FileText}
            accentColor="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Department Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-4 h-4 text-brand-500" />
              <h3 className="text-slate-900 font-semibold">Department Distribution</h3>
            </div>
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
              </div>
            ) : !data?.departmentDistribution?.length ? (
              <p className="text-slate-500 text-sm py-6 text-center">No department data available</p>
            ) : (
              <div className="space-y-3">
                {data.departmentDistribution.map((dept) => {
                  const pct = Math.round(
                    ((dept.count || 0) / (data.activeEmployees || 1)) * 100
                  );
                  return (
                    <div key={dept.department || "Other"}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-900 font-medium">{dept.department || "General"}</span>
                        <span className="text-slate-500">
                          {dept.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Activity Feed */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500" />
                <h3 className="text-slate-900 font-semibold">Live Events</h3>
              </div>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Socket Live</span>
              </span>
            </div>
            {liveEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Listening for attendance check-ins and leave requests in real-time...
              </div>
            ) : (
              <ul className="space-y-2">
                {liveEvents.map((evt, i) => (
                  <li
                    key={i}
                    className="text-xs text-slate-700 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    {evt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Audit Log */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-sky-500" />
              <h3 className="text-slate-900 font-semibold">Recent Audit Log</h3>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500" />
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-8">No recent audit logs.</p>
            ) : (
              <ul className="space-y-2.5">
                {auditLogs.map((log) => (
                  <li
                    key={log._id}
                    className="flex items-start justify-between gap-2 text-xs border-b border-gray-100 pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-slate-900 font-medium">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        by {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System"}
                      </p>
                    </div>
                    <span className="text-slate-500 text-[10px] whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recently Added Employees */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">Recently Onboarded Employees</h3>
          {!data?.recentEmployees?.length ? (
            <p className="text-slate-500 text-sm py-4 text-center">No recent employees</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {data.recentEmployees.map((emp) => (
                <div
                  key={emp._id}
                  className="p-3.5 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-start gap-1"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mb-1">
                    {emp.firstName?.[0]}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 truncate w-full">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate w-full">{emp.designation}</p>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">{emp.employeeId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
