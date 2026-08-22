import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { Column } from "../../components/DataTable";
import api from "../../api";
import { DollarSign } from "lucide-react";

interface PayrollEntry {
  employeeId: string;
  name: string;
  department: string;
  jobTitle: string;
  baseSalary: number;
  deductions: number;
  netPay: number;
  payPeriod: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const Payroll: React.FC = () => {
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/admin/payroll");
        setPayroll(data.data.payroll);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const totalNetPay = payroll.reduce((sum, e) => sum + e.netPay, 0);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "employeeId", header: "ID", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "department", header: "Department", sortable: true, render: (val) => (val as string) || "—" },
    { key: "jobTitle", header: "Title", render: (val) => (val as string) || "—" },
    { key: "payPeriod", header: "Pay Period" },
    {
      key: "baseSalary",
      header: "Base Salary",
      sortable: true,
      render: (val) => <span className="font-mono text-slate-300">{fmt(val as number)}</span>,
    },
    {
      key: "deductions",
      header: "Deductions",
      render: (val) => (
        <span className="font-mono text-rose-400">
          {(val as number) > 0 ? `-${fmt(val as number)}` : "—"}
        </span>
      ),
    },
    {
      key: "netPay",
      header: "Net Pay",
      sortable: true,
      render: (val) => <span className="font-mono font-semibold text-emerald-400">{fmt(val as number)}</span>,
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
              <h2 className="text-xl font-bold text-white">Payroll</h2>
              <p className="text-slate-400 text-sm">Employee salary overview — {new Date().toISOString().slice(0, 7)}</p>
            </div>
          </div>
          {/* TODO: Add "Process Payroll" button + export to CSV */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-5 py-3">
            <p className="text-slate-500 text-xs uppercase tracking-wider">Total Net Payroll</p>
            <p className="text-emerald-400 font-bold text-xl font-mono">{fmt(totalNetPay)}</p>
          </div>
        </div>

        {/* Notice */}
        <div className="mb-5 px-4 py-3 rounded-lg bg-amber-900/10 border border-amber-700/20 text-amber-400 text-sm">
          ⚠️ <strong>Stub data:</strong> Deductions and net pay are not yet calculated. Implement{" "}
          <code className="text-amber-300">GET /api/admin/payroll</code> business logic in{" "}
          <code className="text-amber-300">admin.controller.js</code>.
        </div>

        <DataTable
          columns={columns}
          data={payroll as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No payroll data available. Ensure employees have salary set."
        />
      </main>
    </div>
  );
};

export default Payroll;
