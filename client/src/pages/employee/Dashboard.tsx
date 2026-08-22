import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import DataTable, { type Column } from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import api from "../../api";
import {
  CalendarCheck,
  FileText,
  DollarSign,
  LogIn,
  LogOut,
  Clock,
} from "lucide-react";
import { formatTime, formatDate, getGreeting } from "../../lib/utils";

interface AttendanceRecord {
  _id: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "HALF_DAY" | "ABSENT";
  totalWorkingHours?: number;
}

interface LeaveRequestItem {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string;
  createdAt: string;
}

interface EmployeeDashboardData {
  todayAttendance: AttendanceRecord | null;
  leaveBalance: {
    totalApplied: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  recentLeaveRequests: LeaveRequestItem[];
  currentPayroll: {
    netSalary: number;
    basicSalary: number;
    month: number;
    year: number;
  } | null;
}

const statusBadge: Record<string, string> = {
  PRESENT: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-700/30",
  HALF_DAY: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/30 text-amber-400 border border-amber-700/30",
  ABSENT: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-900/30 text-rose-400 border border-rose-700/30",
};

const leaveStatusBadge: Record<string, string> = {
  PENDING: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/30 text-amber-400 border border-amber-700/30",
  APPROVED: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-700/30",
  REJECTED: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-900/30 text-rose-400 border border-rose-700/30",
};

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [feedMessage, setFeedMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Live attendance updates via socket
  useSocket({
    "attendance:update": (payload) => {
      const p = payload as { employeeId: string; record: AttendanceRecord };
      if (p?.employeeId === user?._id || p?.employeeId === user?.id) {
        setTodayRecord(p.record);
        setFeedMessage("Attendance updated in real-time!");
      }
    },
  });

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/dashboard/employee");
      if (res.data?.data) {
        setData(res.data.data);
        setTodayRecord(res.data.data.todayAttendance);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const res = await api.post("/attendance/check-in", {});
      setTodayRecord(res.data?.data?.record || res.data?.data);
      setFeedMessage("Checked in successfully!");
      fetchDashboard();
    } catch (err: unknown) {
      setFeedMessage(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Check-in failed."
      );
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setIsCheckingOut(true);
    try {
      const res = await api.post("/attendance/check-out", {});
      setTodayRecord(res.data?.data?.record || res.data?.data);
      setFeedMessage("Checked out successfully!");
      fetchDashboard();
    } catch (err: unknown) {
      setFeedMessage(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Check-out failed."
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const leaveColumns: Column<Record<string, unknown>>[] = [
    {
      key: "leaveType",
      header: "Type",
      render: (val) => <span className="capitalize font-medium text-slate-200">{String(val || "PAID")}</span>,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (val) => formatDate(val as string),
    },
    {
      key: "endDate",
      header: "End Date",
      render: (val) => formatDate(val as string),
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (val) => <span className="text-slate-400 text-xs truncate max-w-xs">{String(val || "—")}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (val) => (
        <span className={leaveStatusBadge[val as string] || "text-slate-400"}>
          {String(val)}
        </span>
      ),
    },
  ];

  const displayName = user?.fullName || user?.firstName || "Employee";

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />

      <main className="ml-64 pt-16 p-6 animate-fade-in">
        {/* Feed message */}
        {feedMessage && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-violet-900/20 border border-violet-700/30 text-violet-300 text-sm flex items-center justify-between">
            <span>{feedMessage}</span>
            <button
              onClick={() => setFeedMessage("")}
              className="text-slate-400 hover:text-slate-200 text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{getGreeting(displayName)}</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {user?.designation || "Employee"} · {user?.department || "General"} · ID: {user?.employeeId || "—"}
          </p>
        </div>

        {/* Today's Attendance Quick Action Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                Today's Attendance
              </p>
              {todayRecord ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={statusBadge[todayRecord.status] || "text-slate-400"}>
                    {todayRecord.status}
                  </span>
                  {todayRecord.checkIn && (
                    <span className="text-slate-300 text-sm flex items-center gap-1">
                      <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                      In: {formatTime(todayRecord.checkIn)}
                    </span>
                  )}
                  {todayRecord.checkOut && (
                    <span className="text-slate-300 text-sm flex items-center gap-1">
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      Out: {formatTime(todayRecord.checkOut)}
                    </span>
                  )}
                  {todayRecord.totalWorkingHours ? (
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      {todayRecord.totalWorkingHours} hrs
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Not checked in yet today</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                id="btn-check-in"
                onClick={handleCheckIn}
                disabled={isCheckingIn || !!todayRecord?.checkIn}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20"
              >
                {isCheckingIn ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                Check In
              </button>
              <button
                id="btn-check-out"
                onClick={handleCheckOut}
                disabled={isCheckingOut || !todayRecord?.checkIn || !!todayRecord?.checkOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-rose-900/20"
              >
                {isCheckingOut ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                Check Out
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Leaves Approved"
            value={isLoading ? "—" : data?.leaveBalance?.approved ?? 0}
            subtitle="Approved this cycle"
            icon={CalendarCheck}
            accentColor="emerald"
          />
          <StatCard
            title="Pending Requests"
            value={isLoading ? "—" : data?.leaveBalance?.pending ?? 0}
            subtitle="Awaiting decision"
            icon={Clock}
            accentColor="amber"
          />
          <StatCard
            title="Total Applied"
            value={isLoading ? "—" : data?.leaveBalance?.totalApplied ?? 0}
            subtitle="All leave applications"
            icon={FileText}
            accentColor="sky"
          />
          <StatCard
            title="Net Salary"
            value={
              isLoading
                ? "—"
                : data?.currentPayroll?.netSalary
                ? `₹${data.currentPayroll.netSalary.toLocaleString("en-IN")}`
                : "₹0"
            }
            subtitle="Current month"
            icon={DollarSign}
            accentColor="violet"
          />
        </div>

        {/* Recent Leave Requests Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h3 className="text-slate-200 font-semibold mb-4">Recent Leave Requests</h3>
          <DataTable
            columns={leaveColumns}
            data={(data?.recentLeaveRequests || []) as unknown as Record<string, unknown>[]}
            isLoading={isLoading}
            emptyMessage="No leave requests submitted yet."
          />
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
