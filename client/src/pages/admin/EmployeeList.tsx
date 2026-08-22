import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DataTable, { type Column } from "../../components/DataTable";
import api from "../../api";
import { Users, Search, Plus, X, UserMinus, Check, Copy } from "lucide-react";
import { formatDate } from "../../lib/utils";
import { createEmployeeSchema } from "../../lib/validation";
import type { CreateEmployeeFormData } from "../../lib/validation";

interface Employee {
  _id: string;
  employeeId: string;
  loginId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "ADMIN" | "HR" | "EMPLOYEE";
  department: string;
  designation: string;
  status: "ACTIVE" | "INACTIVE";
  joiningDate: string;
  createdAt: string;
}

const roleBadge: Record<string, string> = {
  ADMIN: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100",
  HR: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200",
  EMPLOYEE: "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-slate-600 border border-gray-200",
};

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add Employee Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState<CreateEmployeeFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: undefined,
    department: "",
    designation: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    role: "EMPLOYEE",
    basicSalary: 30000,
    hra: 10000,
    specialAllowance: 5000,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    user: Employee;
    tempPassword?: string;
  } | null>(null);
  const [serverError, setServerError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const { data } = await api.get(`/users?${params.toString()}`);
      if (data?.data) {
        setEmployees(data.data.employees || []);
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}'s account?`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchEmployees();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to deactivate."
      );
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setServerError("");

    const result = createEmployeeSchema.safeParse(newEmpForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        errs[err.path[0] as string] = err.message;
      });
      setFormErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/users", newEmpForm);
      setCreatedResult(data.data);
      fetchEmployees();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create employee.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!createdResult) return;
    const text = `Dayflow Login Credentials:\nLogin ID: ${createdResult.user.loginId}\nEmail: ${createdResult.user.email}\nTemporary Password: ${createdResult.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "employeeId",
      header: "Employee ID",
      sortable: true,
      render: (val) => <span className="font-mono text-xs text-slate-500 font-semibold">{String(val)}</span>,
    },
    {
      key: "loginId",
      header: "Login ID",
      render: (val) => <span className="font-mono text-xs text-brand-600 font-medium">{String(val || "—")}</span>,
    },
    {
      key: "name",
      header: "Employee Name",
      render: (_, row) => {
        const emp = row as unknown as Employee;
        return (
          <div>
            <p className="text-slate-900 font-medium text-sm">
              {emp.firstName} {emp.lastName}
            </p>
            <p className="text-slate-500 text-xs">{emp.email}</p>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (val) => <span className={roleBadge[val as string] || "text-slate-400"}>{String(val)}</span>,
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      render: (val) => <span className="text-slate-600 text-xs">{(val as string) || "—"}</span>,
    },
    {
      key: "designation",
      header: "Designation",
      render: (val) => <span className="text-slate-600 text-xs">{(val as string) || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (val) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            val === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {String(val)}
        </span>
      ),
    },
    {
      key: "joiningDate",
      header: "Joined",
      sortable: true,
      render: (val) => (val ? formatDate(val as string) : "—"),
    },
    {
      key: "_id",
      header: "Action",
      render: (val, row) => {
        const emp = row as unknown as Employee;
        return emp.status === "ACTIVE" ? (
          <button
            onClick={() => handleDeactivate(val as string, `${emp.firstName} ${emp.lastName}`)}
            title="Deactivate Employee"
            className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        ) : null;
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Employee Directory</h2>
            <p className="text-slate-500 text-sm mt-0.5">Create, manage, and onboard workforce accounts</p>
          </div>

          <button
            onClick={() => {
              setCreatedResult(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>

        {/* Search & Filters */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-5 flex flex-wrap gap-3 items-end"
        >
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="emp-search"
              type="text"
              placeholder="Search by name, email, Employee ID, Login ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors"
            />
          </div>

          <div>
            <select
              id="emp-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-700 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR Manager</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-700 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <button
            id="emp-filter-apply"
            type="submit"
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            Filter
          </button>
        </form>

        <DataTable
          columns={columns}
          data={employees as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No employees found matching the filters."
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

        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-xl shadow-xl animate-slide-up my-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-slate-900 font-semibold text-lg">
                  {createdResult ? "Employee Account Created" : "Add New Employee"}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createdResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                    <p className="text-emerald-700 font-semibold text-sm">
                      Employee account generated successfully:
                    </p>
                    <div className="text-xs space-y-1.5 text-slate-700">
                      <p><strong className="text-slate-900">Name:</strong> {createdResult.user.firstName}{" "}{createdResult.user.lastName}</p>
                      <p><strong className="text-slate-900">Employee ID:</strong>{" "}<span className="font-mono font-bold text-brand-600">{createdResult.user.employeeId}</span></p>
                      <p><strong className="text-slate-900">Login ID:</strong>{" "}<span className="font-mono font-bold text-brand-600">{createdResult.user.loginId}</span></p>
                      <p><strong className="text-slate-900">Email:</strong> {createdResult.user.email}</p>
                      <p><strong className="text-slate-900">Temporary Password:</strong>{" "}<span className="font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-amber-700 font-bold">{createdResult.tempPassword}</span></p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={copyCredentials}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy Credentials"}
                    </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 text-sm font-medium transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  {serverError && (
                    <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {serverError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={newEmpForm.firstName}
                        onChange={(e) => setNewEmpForm((p) => ({ ...p, firstName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                      />
                      {formErrors.firstName && <p className="text-rose-600 text-xs mt-0.5">{formErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={newEmpForm.lastName}
                        onChange={(e) => setNewEmpForm((p) => ({ ...p, lastName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                      />
                      {formErrors.lastName && <p className="text-rose-600 text-xs mt-0.5">{formErrors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Work Email *</label>
                      <input
                        type="email"
                        value={newEmpForm.email}
                        onChange={(e) => setNewEmpForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="john@company.com"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                      />
                      {formErrors.email && <p className="text-rose-600 text-xs mt-0.5">{formErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={newEmpForm.phone}
                        onChange={(e) => setNewEmpForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+91..."
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Department *</label>
                      <input
                        type="text"
                        value={newEmpForm.department}
                        onChange={(e) => setNewEmpForm((p) => ({ ...p, department: e.target.value }))}
                        placeholder="Engineering"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                      />
                      {formErrors.department && <p className="text-rose-600 text-xs mt-0.5">{formErrors.department}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Designation *</label>
                      <input
                        type="text"
                        value={newEmpForm.designation}
                        onChange={(e) => setNewEmpForm((p) => ({ ...p, designation: e.target.value }))}
                        placeholder="Software Engineer"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                      />
                      {formErrors.designation && <p className="text-rose-600 text-xs mt-0.5">{formErrors.designation}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Role *</label>
                      <select
                        value={newEmpForm.role}
                        onChange={(e) => setNewEmpForm((p) => ({ ...p, role: e.target.value as "ADMIN" | "HR" | "EMPLOYEE" }))}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500"
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="HR">HR Manager</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Joining Date *</label>
                      <input
                        type="date"
                        value={newEmpForm.joiningDate}
                        onChange={(e) => setNewEmpForm((p) => ({ ...p, joiningDate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500"
                      />
                      {formErrors.joiningDate && <p className="text-rose-600 text-xs mt-0.5">{formErrors.joiningDate}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Basic Salary (₹)</label>
                      <input
                        type="number"
                        value={newEmpForm.basicSalary}
                        onChange={(e) => setNewEmpForm((p) => ({ ...p, basicSalary: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-900 text-sm focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                    >
                      {isSubmitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : null}
                      {isSubmitting ? "Creating..." : "Create Account"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeList;
