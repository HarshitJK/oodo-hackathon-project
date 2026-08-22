import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { type Column } from "../../components/DataTable";
import api from "../../api";
import { DollarSign, Edit3, X, Save } from "lucide-react";

interface PopulatedEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  designation: string;
}

interface PayrollRecord {
  _id: string;
  employee: PopulatedEmployee | null;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  month: number;
  year: number;
  updatedAt: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const AdminPayroll: React.FC = () => {
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit modal state
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [editForm, setEditForm] = useState({
    basicSalary: 0,
    hra: 0,
    specialAllowance: 0,
    bonus: 0,
    deductions: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const fetchPayroll = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (selectedMonth) params.set("month", String(selectedMonth));
      if (selectedYear) params.set("year", String(selectedYear));

      const { data } = await api.get(`/payroll?${params.toString()}`);
      if (data?.data) {
        setPayrollList(data.data.records || []);
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [selectedMonth, selectedYear, page]);

  const handleOpenEdit = (rec: PayrollRecord) => {
    setEditingRecord(rec);
    setEditForm({
      basicSalary: rec.basicSalary || 0,
      hra: rec.hra || 0,
      specialAllowance: rec.specialAllowance || 0,
      bonus: rec.bonus || 0,
      deductions: rec.deductions || 0,
    });
    setEditMsg("");
  };

  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord?.employee?._id) return;

    setIsSaving(true);
    setEditMsg("");
    try {
      await api.patch(`/payroll/${editingRecord.employee._id}`, {
        ...editForm,
        month: selectedMonth,
        year: selectedYear,
      });
      setEditingRecord(null);
      fetchPayroll();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update payroll.";
      setEditMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const totalNet = payrollList.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (val) => {
        const emp = val as PopulatedEmployee | null;
        return emp ? (
          <div>
            <p className="text-white font-medium text-sm">
              {emp.firstName} {emp.lastName}
            </p>
            <p className="text-slate-500 text-xs">
              {emp.employeeId} · {emp.department}
            </p>
          </div>
        ) : (
          <span className="text-slate-500">—</span>
        );
      },
    },
    {
      key: "basicSalary",
      header: "Basic Salary",
      render: (val) => <span className="font-mono text-slate-300 text-xs">{fmt(Number(val))}</span>,
    },
    {
      key: "allowances",
      header: "HRA & Allowances",
      render: (_, row) => {
        const r = row as unknown as PayrollRecord;
        const all = (r.hra || 0) + (r.specialAllowance || 0);
        return <span className="font-mono text-slate-300 text-xs">{fmt(all)}</span>;
      },
    },
    {
      key: "bonus",
      header: "Bonus",
      render: (val) => (
        <span className="font-mono text-emerald-400 text-xs">
          {Number(val) > 0 ? `+${fmt(Number(val))}` : "—"}
        </span>
      ),
    },
    {
      key: "deductions",
      header: "Deductions",
      render: (val) => (
        <span className="font-mono text-rose-400 text-xs">
          {Number(val) > 0 ? `-${fmt(Number(val))}` : "—"}
        </span>
      ),
    },
    {
      key: "netSalary",
      header: "Net Pay",
      sortable: true,
      render: (val) => (
        <span className="font-mono font-bold text-emerald-400 text-sm">
          {fmt(Number(val))}
        </span>
      ),
    },
    {
      key: "_id",
      header: "Action",
      render: (_, row) => (
        <button
          onClick={() => handleOpenEdit(row as unknown as PayrollRecord)}
          title="Adjust Payroll & Compensation"
          className="p-1 text-slate-400 hover:text-violet-400 rounded transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600/10 border border-emerald-600/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Payroll Management</h2>
              <p className="text-slate-400 text-sm">Compensation structure, bonuses, and disbursements</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 flex items-center gap-6">
            <div>
              <p className="text-slate-500 text-[11px] uppercase tracking-wider font-medium">
                Total Month Net Payout
              </p>
              <p className="text-emerald-400 font-bold text-xl font-mono">{fmt(totalNet)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={payrollList as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No payroll records found for this period."
        />

        {/* Edit Payroll Modal */}
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-base">Adjust Payroll</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {editingRecord.employee?.firstName} {editingRecord.employee?.lastName} (
                    {editingRecord.employee?.employeeId})
                  </p>
                </div>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editMsg && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-rose-900/20 border border-rose-700/30 text-rose-400 text-xs">
                  {editMsg}
                </div>
              )}

              <form onSubmit={handleSavePayroll} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    value={editForm.basicSalary}
                    onChange={(e) => setEditForm((p) => ({ ...p, basicSalary: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">HRA (₹)</label>
                    <input
                      type="number"
                      value={editForm.hra}
                      onChange={(e) => setEditForm((p) => ({ ...p, hra: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Special Allowance (₹)</label>
                    <input
                      type="number"
                      value={editForm.specialAllowance}
                      onChange={(e) => setEditForm((p) => ({ ...p, specialAllowance: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Bonus / Incentive (₹)</label>
                    <input
                      type="number"
                      value={editForm.bonus}
                      onChange={(e) => setEditForm((p) => ({ ...p, bonus: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Deductions (₹)</label>
                    <input
                      type="number"
                      value={editForm.deductions}
                      onChange={(e) => setEditForm((p) => ({ ...p, deductions: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Calculated Net Pay:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {fmt(
                      editForm.basicSalary +
                        editForm.hra +
                        editForm.specialAllowance +
                        editForm.bonus -
                        editForm.deductions
                    )}
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                  >
                    {isSaving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Adjustments
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

export default AdminPayroll;
