import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { User, Camera, Save, Lock, KeyRound } from "lucide-react";
import { changePasswordSchema } from "../../lib/validation";

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    phone: "",
    address: "",
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await api.get("/users/me");
        if (data?.data?.user) {
          const u = data.data.user;
          setProfileForm({
            phone: u.phone || "",
            address: u.address || "",
          });
          if (u.profileImage) {
            const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
            setPreviewUrl(u.profileImage.startsWith("http") ? u.profileImage : `${baseUrl}${u.profileImage}`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchMe();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);

    try {
      let updatedUser;
      if (profileImageFile) {
        const formData = new FormData();
        formData.append("phone", profileForm.phone);
        formData.append("address", profileForm.address);
        formData.append("profileImage", profileImageFile);

        const { data } = await api.patch("/users/me", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedUser = data.data.user;
      } else {
        const { data } = await api.patch("/users/me", profileForm);
        updatedUser = data.data.user;
      }

      if (updatedUser) {
        updateUser(updatedUser);
      }

      setProfileMsg({ type: "success", text: "Profile details updated successfully!" });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update profile.";
      setProfileMsg({ type: "error", text: msg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordMsg(null);

    const result = changePasswordSchema.safeParse({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errs[issue.path[0] as string] = issue.message;
      });
      setPasswordErrors(errs);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to change password.";
      setPasswordMsg({ type: "error", text: msg });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const displayName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-6 animate-fade-in">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-600/10 border border-sky-600/20">
            <User className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">My Profile</h2>
            <p className="text-slate-400 text-sm">Personal details, contact information, and security</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar / Summary card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center gap-4 h-fit">
            <div className="relative group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-violet-600/40"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-violet-600/20 border-2 border-violet-600/40 flex items-center justify-center text-4xl font-bold text-violet-400">
                  {initials}
                </div>
              )}
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-violet-400 cursor-pointer transition-colors shadow-md">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      setProfileImageFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base">{displayName}</p>
              <p className="text-violet-400 text-xs font-medium tracking-wide uppercase mt-0.5">
                {user?.role}
              </p>
              <p className="text-slate-500 text-xs mt-1">{user?.email}</p>
            </div>

            {/* Read-only Information */}
            <div className="w-full mt-2 space-y-2.5 border-t border-slate-800 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Employee ID</span>
                <span className="text-slate-300 font-mono text-xs">{user?.employeeId || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Login ID</span>
                <span className="text-slate-300 font-mono text-xs">{user?.loginId || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Department</span>
                <span className="text-slate-300 text-xs">{user?.department || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Designation</span>
                <span className="text-slate-300 text-xs">{user?.designation || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs">Status</span>
                <span className="text-emerald-400 text-xs font-semibold">{user?.status || "ACTIVE"}</span>
              </div>
            </div>
          </div>

          {/* Edit Information & Security */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Details Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-violet-400" /> Contact Details
              </h3>

              {profileMsg && (
                <div
                  className={`mb-4 px-4 py-2.5 rounded-lg text-sm border ${
                    profileMsg.type === "success"
                      ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400"
                      : "bg-rose-900/20 border-rose-700/30 text-rose-400"
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label htmlFor="profile-phone" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="profile-address" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Residential Address
                  </label>
                  <textarea
                    id="profile-address"
                    rows={3}
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Enter full residential address..."
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    id="profile-save"
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-900/20"
                  >
                    {isSavingProfile ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSavingProfile ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-400" /> Change Password
              </h3>

              {passwordMsg && (
                <div
                  className={`mb-4 px-4 py-2.5 rounded-lg text-sm border ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400"
                      : "bg-rose-900/20 border-rose-700/30 text-rose-400"
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-xs text-rose-400">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-xs text-rose-400">{passwordErrors.newPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Repeat new password"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-rose-400">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors border border-slate-700"
                  >
                    {isSavingPassword ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    {isSavingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
