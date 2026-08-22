import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api";
import { signupSchema } from "../../lib/validation";
import type { SignupFormData } from "../../lib/validation";
import { Building2, Eye, EyeOff, UserPlus } from "lucide-react";

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    employeeId: "",
    department: "",
    jobTitle: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as keyof SignupFormData;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/signup", form);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Signup failed. Please try again.";
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Account created!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Check the server console for your verification link (email not configured in dev mode).
          </p>
          <button
            onClick={() => navigate("/auth/login")}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const Field = ({
    id,
    name,
    label,
    type = "text",
    placeholder,
    required = false,
  }: {
    id: string;
    name: keyof SignupFormData;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={form[name] as string}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
      />
      {errors[name] && <p className="mt-1 text-xs text-rose-400">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">Create account</h1>
            <p className="text-slate-400 text-sm mt-1">Join Dayflow HRMS</p>
          </div>

          {serverError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-rose-900/20 border border-rose-700/30 text-rose-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field id="signup-name" name="name" label="Full Name" placeholder="Jane Doe" required />
              <Field id="signup-empId" name="employeeId" label="Employee ID" placeholder="EMP001" required />
            </div>

            <Field id="signup-email" name="email" label="Email" type="email" placeholder="jane@company.com" required />

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
            </div>

            <Field
              id="signup-confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Field id="signup-dept" name="department" label="Department" placeholder="Engineering" />
              <Field id="signup-title" name="jobTitle" label="Job Title" placeholder="Developer" />
            </div>

            <Field id="signup-phone" name="phone" label="Phone" placeholder="+91 98765 43210" />

            <button
              id="signup-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-violet-900/30 mt-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
