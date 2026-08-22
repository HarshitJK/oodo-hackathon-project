import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { type Column } from "../../components/DataTable";
import api from "../../api";
import { CheckCircle, XCircle, X } from "lucide-react";
import { formatDate } from "../../lib/utils";

interface LeaveEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  designation: string;
  email: string;
}

interface LeaveRequestItem {
  _id: string;
  employee: LeaveEmployee | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  remarks: string;
  attachment?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionComment?: string;
  createdAt: string;
}

const statusBadge: Record<string, string> = {
  PENDING: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200",
};

const LeaveApprovals: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reject modal state
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (statusFilter) params.set("status", statusFilter);

      const { data } = await api.get(`/leave?${params.toString()}`);
      if (data?.data) {
        setRequests(data.data.leaves || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/leave/${id}/approve`);
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "APPROVED" } : r))
      );
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to approve request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingLeaveId) return;
    if (!rejectionReason.trim()) {
      setRejectError("Please provide a reason for rejection.");
      return;
    }

    setActionLoading(rejectingLeaveId);
    try {
      await api.patch(`/leave/${rejectingLeaveId}/reject`, {
        comment: rejectionReason,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === rejectingLeaveId
            ? { ...r, status: "REJECTED", rejectionComment: rejectionReason }
            : r
        )
      );
      setRejectingLeaveId(null);
      setRejectionReason("");
    } catch (err: unknown) {
      setRejectError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to reject request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (val) => {
        const emp = val as LeaveEmployee | null;
        return emp ? (
          <div>
            <p className="text-slate-900 font-medium text-sm">
              {emp.firstName} {emp.lastName}
            </p>
            <p className="text-slate-500 text-xs">
              {emp.employeeId} · {emp.department}
            </p>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
    },
    {
      key: "leaveType",
      header: "Type",
      render: (val) => (
        <span className="capitalize font-medium text-slate-700">{String(val || "PAID")}</span>
      ),
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
      header: "Reason / Remarks",
      render: (val, row) => (
        <div className="max-w-xs">
          <span className="text-slate-500 text-xs block truncate">{(val as string) || "—"}</span>
          {row.rejectionComment ? (
            <span className="text-rose-600 text-[11px] block mt-0.5">
              Rejected: {String(row.rejectionComment)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (val) => (
        <span className={statusBadge[val as string] || "text-slate-400"}>
          {String(val || "PENDING")}
        </span>
      ),
    },
    {
      key: "_id",
      header: "Actions",
      render: (val, row) =>
        row.status === "PENDING" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApprove(val as string)}
              disabled={actionLoading === val}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors disabled:opacity-50 border border-emerald-200"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => {
                setRejectingLeaveId(val as string);
                setRejectionReason("");
                setRejectError("");
              }}
              disabled={actionLoading === val}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50 border border-rose-200"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Leave Approvals</h2>
            <p className="text-slate-500 text-sm mt-0.5">Review, approve, or reject employee leave applications</p>
          </div>

          <div className="flex gap-2">
            {[
              { label: "Pending", value: "PENDING" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
              { label: "All", value: "" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === tab.value
                    ? "bg-brand-500 text-white"
                    : "bg-white border border-gray-200 text-slate-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={requests as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage={`No ${statusFilter ? statusFilter.toLowerCase() : ""} leave requests found.`}
        />

        {/* Rejection Reason Modal */}
        {rejectingLeaveId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 font-semibold text-base">Reject Leave Request</h3>
                <button
                  onClick={() => setRejectingLeaveId(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {rejectError && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {rejectError}
                </div>
              )}

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Critical project milestone in progress / Insufficient team coverage"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRejectingLeaveId(null)}
                    className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LeaveApprovals;
