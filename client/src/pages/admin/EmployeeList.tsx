import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable from "../../components/DataTable";
import type { Column } from "../../components/DataTable";
import api from "../../api";
import { Users, Search } from "lucide-react";
import { formatDate } from "../../lib/utils";

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  jobTitle: string;
  isEmailVerified: boolean;
  createdAt: string;
}

const roleBadge: Record<string, string> = {
  admin: "px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-900/30 text-violet-400 border border-violet-700/30",
  manager: "px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-900/30 text-sky-400 border border-sky-700/30",
  employee: "px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700",
};

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const { data } = await api.get(`/employees?${params.toString()}`);
      setEmployees(data.data.employees);
      setTotalPages(data.data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "employeeId", header: "ID", sortable: true },
    { key: "name", header: "Name", sortable: true },
    {
      key: "email",
      header: "Email",
      render: (val) => <span className="text-slate-400 text-sm">{val as string}</span>,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (val) => <span className={roleBadge[val as string] ?? "text-slate-400"}>{val as string}</span>,
    },
    { key: "department", header: "Department", sortable: true, render: (val) => (val as string) || "—" },
    { key: "jobTitle", header: "Job Title", render: (val) => (val as string) || "—" },
    {
      key: "isEmailVerified",
      header: "Verified",
      render: (val) => (
        <span className={val ? "text-emerald-400" : "text-rose-400"}>
          {val ? "✓ Yes" : "✗ No"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      render: (val) => formatDate(val as string),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-600/20">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Employee Directory</h2>
              <p className="text-slate-400 text-sm">Manage all employees in the system</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="emp-search"
              type="text"
              placeholder="Search by name, email, employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <select
              id="emp-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            id="emp-filter-apply"
            onClick={() => { setPage(1); fetchEmployees(); }}
            className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            Search
          </button>
        </div>

        <DataTable
          columns={columns}
          data={employees as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No employees found."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-sm transition-colors"
            >
              ← Previous
            </button>
            <span className="text-slate-400 text-sm">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-sm transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeList;
