import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { Column } from "../../components/DataTable";
import api from "../../api";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "../../lib/utils";

interface LeaveRequest {
  _id: string;
  userId: { name: string; employeeId: string; department: string } | null;
  type: string;
  startDate: string;
  endDate: string;
  remarks: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const statusBadge: Record<string, string> = {
  pending: "px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-900/30 text-amber-400 border border-amber-700/30",
  approved: "px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-700/30",
  rejected: "px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-900/30 text-rose-400 border border-rose-700/30",
};

const LeaveApprovals: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/leave?${params.toString()}`);
      setRequests(data.data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleDecision = async (id: string, decision: "approved" | "rejected") => {
    setActionLoading(id + decision);
    try {
      await api.patch(`/leave/${id}/approve`, { decision, comment: "" });
      // Optimistically update status
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: decision } : r))
      );
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "userId",
      header: "Employee",
      render: (val) => {
        const emp = val as LeaveRequest["userId"];
        return emp ? (
          <div>
            <p className="text-slate-200 font-medium text-sm">{emp.name}</p>
            <p className="text-slate-500 text-xs">{emp.employeeId} · {emp.department}</p>
          </div>
        ) : <span className="text-slate-500">—</span>;
      },
    },
    {
      key: "type",
      header: "Type",
      render: (val) => <span className="capitalize text-slate-300">{val as string}</span>,
    },
    { key: "startDate", header: "Start", render: (val) => formatDate(val as string) },
    { key: "endDate", header: "End", render: (val) => formatDate(val as string) },
    {
      key: "remarks",
      header: "Remarks",
      render: (val) => <span className="text-slate-500 text-xs max-w-xs truncate">{(val as string) || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (val) => <span className={statusBadge[val as string]}>{val as string}</span>,
    },
    {
      key: "_id",
      header: "Actions",
      render: (val, row) =>
        row.status === "pending" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDecision(val as string, "approved")}
              disabled={actionLoading === val + "approved"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 text-xs font-semibold transition-colors disabled:opacity-50 border border-emerald-700/30"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => handleDecision(val as string, "rejected")}
              disabled={actionLoading === val + "rejected"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-800/40 text-rose-400 text-xs font-semibold transition-colors disabled:opacity-50 border border-rose-700/30"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-600/10 border border-amber-600/20">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Leave Approvals</h2>
              <p className="text-slate-400 text-sm">Review and approve employee leave requests</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(["pending", "approved", "rejected", ""] as const).map((s) => (
              <button
                key={s || "all"}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={requests as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage={`No ${statusFilter || ""} leave requests found.`}
        />
      </main>
    </div>
  );
};

export default LeaveApprovals;
