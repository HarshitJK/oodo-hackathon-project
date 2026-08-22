import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable from "../../components/DataTable";
import type { Column } from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import api from "../../api";
import { formatDate } from "../../lib/utils";
import { FileText, Plus, X } from "lucide-react";
import { leaveRequestSchema } from "../../lib/validation";
import type { LeaveRequestFormData } from "../../lib/validation";

interface LeaveRequest {
  _id: string;
  type: "paid" | "sick" | "unpaid";
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

const typeBadge: Record<string, string> = {
  paid: "px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-900/30 text-violet-400 border border-violet-700/30",
  sick: "px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-900/30 text-sky-400 border border-sky-700/30",
  unpaid: "px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700",
};

const LeaveRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<LeaveRequestFormData>({ type: "paid", startDate: "", endDate: "", remarks: "" });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LeaveRequestFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState("");

  // Live update when a leave is created
  useSocket({
    "leave:new": (data) => {
      const payload = data as { userId: string; leaveRequest: LeaveRequest };
      if (payload.userId === user?.id) {
        setRequests((prev) => [payload.leaveRequest, ...prev]);
      }
    },
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/leave?limit=50");
      setRequests(data.data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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

    setIsSubmitting(true);
    try {
      await api.post("/leave", form);
      setShowModal(false);
      setForm({ type: "paid", startDate: "", endDate: "", remarks: "" });
      fetchRequests();
    } catch (err: unknown) {
      setServerMsg(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to submit."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this leave request?")) return;
    try {
      await api.delete(`/leave/${id}`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed.");
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: "type", header: "Type", sortable: true, render: (val) => <span className={typeBadge[val as string]}>{String(val)}</span> },
    { key: "startDate", header: "Start", sortable: true, render: (val) => formatDate(val as string) },
    { key: "endDate", header: "End", sortable: true, render: (val) => formatDate(val as string) },
    { key: "remarks", header: "Remarks", render: (val) => <span className="text-slate-400 text-xs">{(val as string) || "—"}</span> },
    { key: "status", header: "Status", sortable: true, render: (val) => <span className={statusBadge[val as string]}>{String(val)}</span> },
    {
      key: "_id",
      header: "Action",
      render: (val, row) =>
        row.status === "pending" ? (
          <button
            onClick={() => handleCancel(val as string)}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            Cancel
          </button>
        ) : null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-600/10 border border-amber-600/20">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Leave Requests</h2>
              <p className="text-slate-400 text-sm">Manage your time-off requests</p>
            </div>
          </div>
          <button
            id="btn-new-leave"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-900/20"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>

        <DataTable
          columns={columns}
          data={requests as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No leave requests found. Submit your first request!"
        />

        {/* New Leave Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold text-lg">New Leave Request</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {serverMsg && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-rose-900/20 border border-rose-700/30 text-rose-400 text-sm">
                  {serverMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Leave Type</label>
                  <select
                    id="leave-type"
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "paid" | "sick" | "unpaid" }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="paid">Paid Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                  {formErrors.type && <p className="mt-1 text-xs text-rose-400">{formErrors.type}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Start Date</label>
                    <input
                      id="leave-start"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    {formErrors.startDate && <p className="mt-1 text-xs text-rose-400">{formErrors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">End Date</label>
                    <input
                      id="leave-end"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    {formErrors.endDate && <p className="mt-1 text-xs text-rose-400">{formErrors.endDate}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Remarks (optional)</label>
                  <textarea
                    id="leave-remarks"
                    rows={3}
                    value={form.remarks}
                    onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                    placeholder="Reason for leave..."
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="leave-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                  >
                    {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
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
