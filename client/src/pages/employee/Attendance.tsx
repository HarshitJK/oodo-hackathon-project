import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { type Column } from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { formatDate, formatTime } from "../../lib/utils";
import { LogIn, LogOut, Clock } from "lucide-react";
import QRCodeCard from "../../components/attendance/QRCodeCard";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "HALF_DAY" | "ABSENT";
  totalWorkingHours?: number;
  notes: string;
}

const statusBadge: Record<string, string> = {
  PRESENT: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200",
  HALF_DAY: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200",
  ABSENT: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200",
};

const Attendance: React.FC = () => {
  const { user, role } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "", period: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.status) params.set("status", filters.status);
      if (filters.period) params.set("period", filters.period);

      const { data } = await api.get(`/attendance/me?${params.toString()}`);
      if (data?.data) {
        setRecords(data.data.records || []);
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page]);

  const handleApplyFilter = () => {
    setPage(1);
    fetchRecords();
  };

  const handleResetFilter = () => {
    setFilters({ startDate: "", endDate: "", status: "", period: "" });
    setPage(1);
    setTimeout(fetchRecords, 50);
  };

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
          {String(val || "PRESENT")}
        </span>
      ),
    },
    {
      key: "checkIn",
      header: "Check In",
      render: (val) =>
        val ? (
          <span className="flex items-center gap-1 text-emerald-600 font-mono text-xs">
            <LogIn className="w-3 h-3" /> {formatTime(val as string)}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "checkOut",
      header: "Check Out",
      render: (val) =>
        val ? (
          <span className="flex items-center gap-1 text-rose-600 font-mono text-xs">
            <LogOut className="w-3 h-3" /> {formatTime(val as string)}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "totalWorkingHours",
      header: "Working Hours",
      render: (val) =>
        val ? (
          <span className="flex items-center gap-1 text-slate-700 font-mono text-xs">
            <Clock className="w-3 h-3 text-sky-500" /> {String(val)} hrs
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "notes",
      header: "Notes",
      render: (val) => <span className="text-slate-500 text-xs">{(val as string) || "—"}</span>,
    },
  ];

  const displayName = user?.fullName || user?.firstName || "Employee";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">My Attendance</h2>
          <p className="text-slate-500 text-sm mt-0.5">Attendance history and timesheets for {displayName}</p>
        </div>

        {(role === "ADMIN" || role === "HR") && <QRCodeCard />}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters((p) => ({ ...p, period: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-700 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="">All Time</option>
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              id="att-start-date"
              value={filters.startDate}
              onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-700 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              id="att-end-date"
              value={filters.endDate}
              onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-700 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              id="att-status-filter"
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-700 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
          <button
            id="att-filter-apply"
            onClick={handleApplyFilter}
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilter}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-600 text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>

        <DataTable
          columns={columns}
          data={records as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No attendance records found."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-slate-600 text-sm transition-colors"
            >
              Previous
            </button>
            <span className="text-slate-500 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-slate-600 text-sm transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Attendance;
