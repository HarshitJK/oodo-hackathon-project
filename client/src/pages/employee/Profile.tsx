import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { User, Camera, Save } from "lucide-react";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "",
    address: "",
    profilePictureUrl: user?.profilePictureUrl || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/employees/${user?.id}`);
        const emp = data.data.employee;
        setForm({
          name: emp.name || "",
          phone: emp.phone || "",
          address: emp.address || "",
          profilePictureUrl: emp.profilePictureUrl || "",
        });
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.id) fetchProfile();
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedMsg("");
    try {
      await api.put(`/employees/${user?.id}`, form);
      setSavedMsg("Profile updated successfully!");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err: unknown) {
      setSavedMsg(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update."
      );
    } finally {
      setIsSaving(false);
    }
  };

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
            <p className="text-slate-400 text-sm">Update your personal information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-violet-600/20 border-2 border-violet-600/40 flex items-center justify-center text-4xl font-bold text-violet-400">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-violet-400 transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">{user?.name}</p>
              <p className="text-slate-400 text-sm capitalize">{user?.role}</p>
              <p className="text-slate-500 text-xs mt-1">{user?.email}</p>
            </div>
            {/* Read-only info */}
            <div className="w-full mt-2 space-y-2 border-t border-slate-800 pt-4">
              {[
                { label: "Employee ID", value: user?.employeeId },
                { label: "Department", value: user?.department },
                { label: "Job Title", value: user?.jobTitle },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-300">{item.value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Edit form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-slate-200 font-semibold mb-5">Edit Information</h3>

            {savedMsg && (
              <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm border ${savedMsg.includes("success") ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400" : "bg-rose-900/20 border-rose-700/30 text-rose-400"}`}>
                {savedMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="profile-phone" className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="profile-address" className="block text-sm font-medium text-slate-300 mb-1.5">Address</label>
                <textarea
                  id="profile-address"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="123, Street Name, City, State"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label htmlFor="profile-pic-url" className="block text-sm font-medium text-slate-300 mb-1.5">Profile Picture URL</label>
                <input
                  id="profile-pic-url"
                  type="url"
                  value={form.profilePictureUrl}
                  onChange={(e) => setForm((p) => ({ ...p, profilePictureUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div className="pt-2">
                <button
                  id="profile-save"
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-900/20"
                >
                  {isSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
