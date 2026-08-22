import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import api from "../../api";
import {
  CalendarCheck,
  Clock,
  FileText,
  TrendingUp,
  LogIn,
  LogOut,
} from "lucide-react";
import { formatTime, getGreeting } from "../../lib/utils";

interface TodayAttendance {
  _id: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<TodayAttendance | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [feedMessage, setFeedMessage] = useState<string>("");

  // Live attendance updates via socket
  useSocket({
    "attendance:new": (data) => {
      const payload = data as { userId: string; record: TodayAttendance };
      if (payload.userId === user?.id) {
        setTodayRecord(payload.record);
        setFeedMessage("✅ Attendance updated in real-time!");
      }
    },
  });

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const { data } = await api.get("/attendance/today");
        setTodayRecord(data.data.record);
      } catch {
        // ignore — user may not have checked in yet
      }
    };
    fetchToday();
  }, []);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const { data } = await api.post("/attendance/check-in");
      setTodayRecord(data.data.record);
      setFeedMessage("✅ Checked in successfully!");
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
      const { data } = await api.post("/attendance/check-out");
      setTodayRecord(data.data.record);
      setFeedMessage("✅ Checked out successfully!");
    } catch (err: unknown) {
      setFeedMessage(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Check-out failed."
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const statusColor: Record<string, string> = {
    present: "text-emerald-400 bg-emerald-900/20 border-emerald-700/30",
    absent: "text-rose-400 bg-rose-900/20 border-rose-700/30",
    "half-day": "text-amber-400 bg-amber-900/20 border-amber-700/30",
    leave: "text-sky-400 bg-sky-900/20 border-sky-700/30",
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />

      <main className="ml-64 pt-16 p-6">
        {/* Feed message */}
        {feedMessage && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-violet-900/20 border border-violet-700/30 text-violet-300 text-sm flex items-center justify-between">
            {feedMessage}
            <button onClick={() => setFeedMessage("")} className="text-slate-500 hover:text-slate-300 text-xs ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{getGreeting(user?.name)}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{user?.jobTitle} · {user?.department}</p>
        </div>

        {/* Today's Attendance Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Today's Status</p>
              {todayRecord ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full border text-xs font-semibold capitalize ${statusColor[todayRecord.status] || "text-slate-400 bg-slate-800 border-slate-700"}`}>
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
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Not checked in yet</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                id="btn-check-in"
                onClick={handleCheckIn}
                disabled={isCheckingIn || !!todayRecord?.checkIn}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
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
            title="Days Present"
            value="—"
            subtitle="This month"
            icon={CalendarCheck}
            accentColor="emerald"
          />
          <StatCard
            title="Avg. Check-in"
            value="—"
            subtitle="Last 30 days"
            icon={Clock}
            accentColor="sky"
          />
          <StatCard
            title="Leave Balance"
            value="—"
            subtitle="Remaining days"
            icon={FileText}
            accentColor="amber"
          />
          <StatCard
            title="Attendance Rate"
            value="—"
            subtitle="This month"
            icon={TrendingUp}
            accentColor="violet"
          />
        </div>

        {/* TODO: Recent Attendance Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-slate-200 font-semibold mb-4">Recent Attendance</h3>
          <p className="text-slate-500 text-sm">
            {/* TODO: Render last 7 days attendance using DataTable component */}
            Implement recent attendance table — use <code className="text-violet-400">DataTable</code> component with attendance data from{" "}
            <code className="text-violet-400">GET /api/attendance?limit=7</code>
          </p>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
