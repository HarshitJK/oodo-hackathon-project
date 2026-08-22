import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPasswordSchema } from "../../lib/validation";
import type { ResetPasswordFormData } from "../../lib/validation";
import api from "../../api";
import { Building2, Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [form, setForm] = useState<ResetPasswordFormData>({ newPassword: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    if (!token) {
      setServerError("Reset token is missing or invalid. Please check your reset link.");
      return;
    }

    const result = resetPasswordSchema.safeParse(form);
    if (!result.success) {
      setErrors({ newPassword: result.error.issues[0]?.message });
      return;
    }

    if (form.newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: form.newPassword,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to reset password. The link may have expired.";
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">Set New Password</h1>
            <p className="text-slate-400 text-sm mt-1 text-center">
              Please enter your new strong password below.
            </p>
          </div>

          {serverError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-rose-900/20 border border-rose-700/30 text-rose-400 text-sm">
              {serverError}
            </div>
          )}

          {isSuccess ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-lg mb-1">Password Reset Successful!</h3>
              <p className="text-slate-400 text-sm mb-4">
                Redirecting you to the login page...
              </p>
              <Link
                to="/auth/login"
                className="inline-block px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.newPassword}
                    onChange={(e) => setForm({ newPassword: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-2.5 pr-11 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-rose-400">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-violet-900/30 mt-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                {isLoading ? "Updating..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <Link
              to="/auth/login"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
