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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4 border border-brand-100">
              <Building2 className="w-6 h-6 text-brand-600" />
            </div>
            <h1 className="text-slate-900 text-2xl font-bold">Reset Password</h1>
            <p className="text-slate-500 text-sm mt-1 text-center">
              Enter your registered email and we'll send you a password reset link.
            </p>
          </div>

          {serverMsg && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
                serverMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {serverMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 mt-2"
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
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
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
