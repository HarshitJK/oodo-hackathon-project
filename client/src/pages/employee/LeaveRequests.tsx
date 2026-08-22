import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { type Column } from "../../components/DataTable";
import { useSocket } from "../../hooks/useSocket";
import api from "../../api";
import { formatDate } from "../../lib/utils";
import { Plus, X, Upload } from "lucide-react";
import { leaveRequestSchema } from "../../lib/validation";
import type { LeaveRequestFormData } from "../../lib/validation";

interface LeaveRequestItem {
  _id: string;
  leaveType: "PAID" | "SICK" | "UNPAID";
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

const typeBadge: Record<string, string> = {
  PAID: "px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100",
  SICK: "px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200",
  UNPAID: "px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-slate-600 border border-gray-200",
};

const LeaveRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<LeaveRequestFormData>({
    leaveType: "PAID",
    startDate: "",
    endDate: "",
    remarks: "",
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LeaveRequestFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Live updates via socket
  useSocket({
    "leave:update": (data) => {
      const payload = data as { leave?: LeaveRequestItem };
      if (payload?.leave) {
        setRequests((prev) =>
          prev.map((r) => (r._id === payload.leave?._id ? payload.leave! : r))
        );
      }
    },
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);

      const { data } = await api.get(`/leave/me?${params.toString()}`);
      if (data?.data) {
        setRequests(data.data.leaves || []);
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setServerMsg("");

    const result = leaveRequestSchema.safeParse(form);
    if (!result.success) {
      const errs: Partial<Record<keyof LeaveRequestFormData, string>> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as keyof LeaveRequestFormData;
        if (!errs[key]) errs[key] = err.message;
      });
      setFormErrors(errs);
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setFormErrors({ endDate: "End date cannot be earlier than start date" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (attachment) {
        const formData = new FormData();
        formData.append("leaveType", form.leaveType);
        formData.append("startDate", form.startDate);
        formData.append("endDate", form.endDate);
        if (form.remarks) formData.append("remarks", form.remarks);
        formData.append("attachment", attachment);

        await api.post("/leave", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/leave", form);
      }

      setShowModal(false);
      setForm({ leaveType: "PAID", startDate: "", endDate: "", remarks: "" });
      setAttachment(null);
      fetchRequests();
    } catch (err: unknown) {
      setServerMsg(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to submit leave request."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "leaveType",
      header: "Type",
      sortable: true,
      render: (val) => (
        <span className={typeBadge[val as string] || "text-slate-400"}>
          {String(val || "PAID")}
        </span>
      ),
    },
    {
      key: "startDate",
      header: "Start Date",
      sortable: true,
      render: (val) => formatDate(val as string),
    },
    {
      key: "endDate",
      header: "End Date",
      sortable: true,
      render: (val) => formatDate(val as string),
    },
    {
      key: "remarks",
      header: "Remarks / Reason",
      render: (val, row) => (
        <div>
          <span className="text-slate-600 text-xs">{(val as string) || "—"}</span>
          {row.rejectionComment ? (
            <p className="text-rose-600 text-xs mt-0.5">
              Reason: {String(row.rejectionComment)}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (val) => (
        <span className={statusBadge[val as string] || "text-slate-400"}>
          {String(val || "PENDING")}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Applied On",
      sortable: true,
      render: (val) => formatDate(val as string),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Leave Requests</h2>
            <p className="text-slate-500 text-sm mt-0.5">Apply for and track your time off</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-700 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              id="btn-new-leave"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Apply for Leave
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={requests as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No leave requests found."
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

        {/* Apply Leave Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-slate-900 font-semibold text-lg">Apply for Leave</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {serverMsg && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {serverMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Leave Type
                  </label>
                  <select
                    id="leave-type"
                    value={form.leaveType}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        leaveType: e.target.value as "PAID" | "SICK" | "UNPAID",
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                  >
                    <option value="PAID">Paid Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
                  {formErrors.leaveType && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.leaveType}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Start Date
                    </label>
                    <input
                      id="leave-start"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                    />
                    {formErrors.startDate && (
                      <p className="mt-1 text-xs text-rose-600">{formErrors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      End Date
                    </label>
                    <input
                      id="leave-end"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                    />
                    {formErrors.endDate && (
                      <p className="mt-1 text-xs text-rose-600">{formErrors.endDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Reason / Remarks
                  </label>
                  <textarea
                    id="leave-remarks"
                    rows={3}
                    value={form.remarks}
                    onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                    placeholder="Provide brief context for your request..."
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Supporting Document (optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-slate-600 text-xs transition-colors">
                      <Upload className="w-4 h-4 text-brand-500" />
                      {attachment ? attachment.name : "Choose file"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setAttachment(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    {attachment && (
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-slate-500 hover:text-rose-600 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="leave-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : null}
                    {isSubmitting ? "Submitting..." : "Submit Request"}
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

export default LeaveRequests;
