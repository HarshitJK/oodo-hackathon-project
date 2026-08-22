import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable from "../../components/DataTable";
import type { Column } from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { formatDate, formatTime } from "../../lib/utils";
import { CalendarCheck, LogIn, LogOut } from "lucide-react";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "absent" | "half-day" | "leave";
  notes: string;
}

const statusBadge: Record<string, string> = {
  present: "px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-700/30",
  absent: "px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-900/30 text-rose-400 border border-rose-700/30",
  "half-day": "px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-900/30 text-amber-400 border border-amber-700/30",
  leave: "px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-900/30 text-sky-400 border border-sky-700/30",
};

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "" });

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.status) params.set("status", filters.status);
      params.set("limit", "50");
      const { data } = await api.get(`/attendance?${params.toString()}`);
      setRecords(data.data.records);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (val) => formatDate(val as string),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (val) => (
        <span className={statusBadge[val as string] ?? "text-slate-400"}>
          {String(val)}
        </span>
      ),
    },
    {
      key: "checkIn",
      header: "Check In",
      render: (val) =>
        val ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <LogIn className="w-3 h-3" /> {formatTime(val as string)}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        ),
    },
    {
      key: "checkOut",
      header: "Check Out",
      render: (val) =>
        val ? (
          <span className="flex items-center gap-1 text-rose-400">
            <LogOut className="w-3 h-3" /> {formatTime(val as string)}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        ),
    },
    {
      key: "notes",
      header: "Notes",
      render: (val) => <span className="text-slate-500">{(val as string) || "—"}</span>,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-600/20">
            <CalendarCheck className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">My Attendance</h2>
            <p className="text-slate-400 text-sm">Track your check-in/out history — {user?.name}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              id="att-start-date"
              value={filters.startDate}
              onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              id="att-end-date"
              value={filters.endDate}
              onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
            <select
              id="att-status-filter"
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
          <button
            id="att-filter-apply"
            onClick={fetchRecords}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilters({ startDate: "", endDate: "", status: "" });
              setTimeout(fetchRecords, 50);
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>

        <DataTable
          columns={columns}
          data={records as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No attendance records found for the selected period."
        />
      </main>
    </div>
  );
};

export default Attendance;
