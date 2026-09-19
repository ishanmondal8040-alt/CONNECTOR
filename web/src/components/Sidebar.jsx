import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const navItems = [
  { label: "Dashboard", to: "/app", end: true },
  { label: "Feed", to: "/app/feed" },
  { label: "Friends", to: "/app/friends" },
  { label: "Requests", to: "/app/requests" },
  { label: "Chat", to: "/app/chat" },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const { user, logout } = useAuth();
  const { totalUnreadCount } = useChat();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <span className="text-lg font-semibold text-slate-900">
          CONNECTOR
        </span>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        className={`w-full shrink-0 border-r border-slate-200 bg-white md:block md:w-64 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="hidden px-6 py-5 md:block">
          <span className="text-lg font-semibold text-slate-900">
            CONNECTOR
          </span>
        </div>

        <div className="border-b border-slate-200 px-4 py-4">
          <p className="truncate text-sm font-medium text-slate-900">
            {user?.name || "..."}
          </p>

          <p className="truncate text-xs text-slate-500">
            {user?.email}
          </p>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={navLinkClasses}
              onClick={() => setIsOpen(false)}
            >
              <span>{item.label}</span>

              {item.label === "Chat" && totalUnreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {totalUnreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}