import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordSchema } from "../../lib/validation";
import type { ForgotPasswordFormData } from "../../lib/validation";
import api from "../../api";
import { Building2, ArrowLeft, Send } from "lucide-react";

const ForgotPassword: React.FC = () => {
  const [form, setForm] = useState<ForgotPasswordFormData>({ email: "" });
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [serverMsg, setServerMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerMsg(null);

    const result = forgotPasswordSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<ForgotPasswordFormData> = {};
      result.error.issues.forEach((err) => {
        fieldErrors.email = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", form);
      setServerMsg({
        type: "success",
        text: data?.message || "Password reset instructions have been sent to your email.",
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to request password reset.";
      setServerMsg({ type: "error", text: msg });
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
            <h1 className="text-white text-2xl font-bold">Reset Password</h1>
            <p className="text-slate-400 text-sm mt-1 text-center">
              Enter your registered email and we'll send you a password reset link.
            </p>
          </div>

          {serverMsg && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
                serverMsg.type === "success"
                  ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400"
                  : "bg-rose-900/20 border-rose-700/30 text-rose-400"
              }`}
            >
              {serverMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Registered email address
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ email: e.target.value })}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
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
                <Send className="w-4 h-4" />
              )}
              {isLoading ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
