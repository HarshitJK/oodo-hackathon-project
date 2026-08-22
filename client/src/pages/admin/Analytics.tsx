import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import api from "../../api";
import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface AttendanceTrendPoint {
  date: string;
  present: number;
  absent: number;
  halfDay: number;
  onLeave: number;
}

interface LeaveTypeCount {
  type: string;
  count: number;
}

const PIE_COLORS = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#f43f5e"];

const Analytics: React.FC = () => {
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendPoint[]>([]);
  const [leaveBreakdown, setLeaveBreakdown] = useState<LeaveTypeCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [attRes, leaveRes] = await Promise.all([
          api.get(`/admin/analytics/attendance?days=${days}`),
          api.get("/admin/analytics/leave"),
        ]);
        setAttendanceTrend(attRes.data.data.trend);
        setLeaveBreakdown(leaveRes.data.data.byType);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [days]);

  const tooltipStyle = {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "12px",
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-600/10 border border-sky-600/20">
              <BarChart3 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Analytics</h2>
              <p className="text-slate-400 text-sm">Workforce insights and trends</p>
            </div>
          </div>
          {/* Days filter */}
          <div className="flex gap-2">
            {[7, 14, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${days === d ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-700 border-t-violet-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Attendance Trend — Line Chart */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-slate-200 font-semibold mb-4">Attendance Trend (Last {days} days)</h3>
              {attendanceTrend.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                  No attendance data for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={attendanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickLine={false}
                      tickFormatter={(v) => v.slice(5)} // Show MM-DD
                    />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                    <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={false} name="Present" />
                    <Line type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={2} dot={false} name="Absent" />
                    <Line type="monotone" dataKey="halfDay" stroke="#f59e0b" strokeWidth={2} dot={false} name="Half Day" />
                    <Line type="monotone" dataKey="onLeave" stroke="#0ea5e9" strokeWidth={2} dot={false} name="On Leave" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Leave Breakdown — Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-slate-200 font-semibold mb-4">Leave by Type</h3>
              {leaveBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                  No leave data yet.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={leaveBreakdown}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {leaveBreakdown.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-3 space-y-2">
                    {leaveBreakdown.map((item, i) => (
                      <li key={item.type} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-slate-300 capitalize">{item.type}</span>
                        </span>
                        <span className="text-slate-400 font-medium tabular-nums">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
