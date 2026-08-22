import React from "react";
import { Bell, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getGreeting } from "../lib/utils";

const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-20">
      {/* Greeting */}
      <div>
        <p className="text-slate-200 font-medium text-sm">{getGreeting(user?.name)}</p>
        <p className="text-slate-500 text-xs">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors w-48 focus:w-64 duration-300"
          />
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full ring-2 ring-slate-950" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-600/40 flex items-center justify-center text-violet-400 text-sm font-semibold cursor-pointer hover:border-violet-500 transition-colors">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
