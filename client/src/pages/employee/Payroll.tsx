import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { type Column } from "../../components/DataTable";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { DollarSign, Award, TrendingDown, Wallet } from "lucide-react";

interface PayrollItem {
  _id: string;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  month: number;
  year: number;
  createdAt: string;
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

const EmployeePayroll: React.FC = () => {
  const { user } = useAuth();
  const [payrollList, setPayrollList] = useState<PayrollItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get("/payroll/me");
        if (data?.data) {
          setPayrollList(data.data.payroll || []);
        }
      } catch (err) {
        console.error("Failed to fetch payroll:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayroll();
  }, []);

  const latest = payrollList[0];

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "period",
      header: "Pay Period",
      render: (_, row) => {
        const p = row as unknown as PayrollItem;
        return (
          <span className="font-medium text-slate-900">
            {monthNames[(p.month || 1) - 1]} {p.year}
          </span>
        );
      },
    },
    {
      key: "basicSalary",
      header: "Basic Salary",
      render: (val) => <span className="font-mono text-slate-700">{fmt(Number(val))}</span>,
    },
    {
      key: "hra",
      header: "HRA",
      render: (val) => <span className="font-mono text-slate-700">{fmt(Number(val))}</span>,
    },
    {
      key: "specialAllowance",
      header: "Special Allowance",
      render: (val) => <span className="font-mono text-slate-700">{fmt(Number(val))}</span>,
    },
    {
      key: "bonus",
      header: "Bonus",
      render: (val) => (
        <span className="font-mono text-emerald-600">
          {Number(val) > 0 ? `+${fmt(Number(val))}` : "—"}
        </span>
      ),
    },
    {
      key: "deductions",
      header: "Deductions",
      render: (val) => (
        <span className="font-mono text-rose-600">
          {Number(val) > 0 ? `-${fmt(Number(val))}` : "—"}
        </span>
      ),
    },
    {
      key: "netSalary",
      header: "Net Pay",
      render: (val) => (
        <span className="font-mono font-bold text-emerald-700 text-sm">
          {fmt(Number(val))}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">My Payroll &amp; Payslips</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Salary breakdown and payment records for {user?.fullName || user?.firstName}
          </p>
        </div>

        {/* Current Month Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Latest Net Salary"
            value={isLoading ? "—" : latest ? fmt(latest.netSalary) : "₹0"}
            subtitle={latest ? `${monthNames[latest.month - 1]} ${latest.year}` : "Current cycle"}
            icon={Wallet}
            accentColor="emerald"
          />
          <StatCard
            title="Basic Salary"
            value={isLoading ? "—" : latest ? fmt(latest.basicSalary) : "₹0"}
            subtitle="Fixed component"
            icon={DollarSign}
            accentColor="violet"
          />
          <StatCard
            title="Allowances (HRA + Special)"
            value={
              isLoading
                ? "—"
                : latest
                ? fmt((latest.hra || 0) + (latest.specialAllowance || 0))
                : "₹0"
            }
            subtitle="Monthly benefits"
            icon={Award}
            accentColor="sky"
          />
          <StatCard
            title="Total Deductions"
            value={isLoading ? "—" : latest ? fmt(latest.deductions || 0) : "₹0"}
            subtitle="Tax & PF"
            icon={TrendingDown}
            accentColor="rose"
          />
        </div>

        {/* Payslips History */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-slate-900 font-semibold mb-4">Payslip History</h3>
          <DataTable
            columns={columns}
            data={payrollList as unknown as Record<string, unknown>[]}
            isLoading={isLoading}
            emptyMessage="No payroll records found."
          />
        </div>
      </main>
    </div>
  );
};

export default EmployeePayroll;
