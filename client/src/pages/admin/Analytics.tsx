import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import api from "../../api";
import { BarChart3, Users, Building, CalendarCheck, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
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

interface DeptStat {
  department: string;
  count: number;
}

interface LeaveStat {
  type: string;
  count: number;
}

const PIE_COLORS = ["#8b5cf6", "#38bdf8", "#f59e0b", "#10b981", "#f43f5e"];

const Analytics: React.FC = () => {
  const [departments, setDepartments] = useState<DeptStat[]>([]);
  const [leaveStats, setLeaveStats] = useState<LeaveStat[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    halfDay: 0,
    absent: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [dashRes, leaveRes] = await Promise.allSettled([
          api.get("/dashboard/admin"),
          api.get("/leave?limit=100"),
        ]);

        if (dashRes.status === "fulfilled" && dashRes.value.data?.data) {
          const d = dashRes.value.data.data;
          setDepartments(d.departmentDistribution || []);
          setAttendanceSummary({
            present: d.presentToday || 0,
            halfDay: d.halfDayToday || 0,
            absent: d.absentToday || 0,
            total: d.activeEmployees || 0,
          });
        }

        if (leaveRes.status === "fulfilled" && leaveRes.value.data?.data?.leaves) {
          const leaves = leaveRes.value.data.data.leaves;
          const counts: Record<string, number> = {};
          leaves.forEach((l: { leaveType?: string }) => {
            const t = l.leaveType || "OTHER";
            counts[t] = (counts[t] || 0) + 1;
          });
          const formatted = Object.entries(counts).map(([type, count]) => ({
            type,
            count,
          }));
          setLeaveStats(formatted.length ? formatted : [
            { type: "PAID", count: 0 },
            { type: "SICK", count: 0 },
            { type: "UNPAID", count: 0 },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const tooltipStyle = {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#f8fafc",
    fontSize: "12px",
  };

  const attendanceChartData = [
    {
      name: "Today",
      Present: attendanceSummary.present,
      "Half Day": attendanceSummary.halfDay,
      Absent: attendanceSummary.absent,
    },
  ];

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
              <h2 className="text-xl font-bold text-white">Workforce Analytics</h2>
              <p className="text-slate-400 text-sm">Real-time breakdown of staffing, leaves, and presence</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-700 border-t-violet-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Grid: Attendance vs Leave types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Attendance Overview */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-slate-200 font-semibold">Today's Attendance Status</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                      <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Half Day" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leave Distribution Pie */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  <h3 className="text-slate-200 font-semibold">Leave Applications by Category</h3>
                </div>
                {leaveStats.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                    No leave data recorded yet
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-around h-64 gap-4">
                    <div className="w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={leaveStats}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                          >
                            {leaveStats.map((_, idx) => (
                              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2">
                      {leaveStats.map((item, i) => (
                        <div key={item.type} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-slate-300 font-medium">{item.type}</span>
                          <span className="text-slate-500 font-mono">({item.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Department Breakdown Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building className="w-4 h-4 text-sky-400" />
                <h3 className="text-slate-200 font-semibold">Workforce Distribution by Department</h3>
              </div>
              {departments.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                  No department data found
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departments.map((d) => ({
                        department: d.department || "General",
                        Employees: d.count,
                      }))}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="department" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="Employees" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
