import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import api from "../api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "HR" | "EMPLOYEE";

export interface AuthUser {
  _id: string;
  id: string;
  employeeId: string;
  loginId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string | null;
  dob: string | null;
  address: string;
  department: string;
  designation: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  profileImage: string;
  passwordChanged: boolean;
  joiningDate: string;
  manager: { firstName: string; lastName: string; employeeId: string; email: string } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUser = (raw: Record<string, unknown>): AuthUser => ({
    ...(raw as unknown as AuthUser),
    id: (raw._id ?? raw.id) as string,
    fullName: `${raw.firstName} ${raw.lastName}`,
  });

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(normalizeUser(data.data.user));
      } catch {
        localStorage.removeItem("accessToken");
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    const { accessToken, user: loggedInUser } = data.data;
    localStorage.setItem("accessToken", accessToken);
    setUser(normalizeUser(loggedInUser));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore — clean up client-side regardless
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updated: AuthUser) => {
    setUser(normalizeUser(updated as unknown as Record<string, unknown>));
  }, []);

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
