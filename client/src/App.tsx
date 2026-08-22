import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

// Auth Pages
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Employee Pages
import EmployeeDashboard from "./pages/employee/Dashboard";
import Profile from "./pages/employee/Profile";
import Attendance from "./pages/employee/Attendance";
import LeaveRequests from "./pages/employee/LeaveRequests";
import EmployeePayroll from "./pages/employee/Payroll";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeList from "./pages/admin/EmployeeList";
import LeaveApprovals from "./pages/admin/LeaveApprovals";
import AdminPayroll from "./pages/admin/Payroll";
import Analytics from "./pages/admin/Analytics";

const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (role === "ADMIN" || role === "HR") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public Routes ──────────────────────────────────────── */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── Employee Routes (any authenticated user) ───────────── */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/attendance"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/leaves"
            element={
              <ProtectedRoute>
                <LeaveRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/payroll"
            element={
              <ProtectedRoute>
                <EmployeePayroll />
              </ProtectedRoute>
            }
          />

          {/* ── Admin / HR Routes ───────────────────────────────────── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
                <EmployeeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leave-approvals"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
                <LeaveApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payroll"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
                <AdminPayroll />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* ── Default Redirects ──────────────────────────────────── */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

