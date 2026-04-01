import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  PiggyBank,
  LogOut,
  Tag,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../UI/ThemeToggle";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Receipt, label: "Transactions", path: "/transactions" },
    { icon: Wallet, label: "Accounts", path: "/accounts" },
    { icon: PiggyBank, label: "Budgets", path: "/budgets" },
    { icon: Tag, label: "Categories", path: "/categories" },
    { icon: PieChart, label: "Reports", path: "/reports" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col fixed left-0 top-0 z-50 overflow-y-auto transition-all duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center gap-3 shrink-0">
          <img
            src="/money-manager-logo-transparent-2.png"
            alt="Money Manager Logo"
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-800 dark:from-teal-400 dark:to-teal-600">
            Money Manager
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</p>
            <p
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate"
              title={user?.email || ""}
            >
              {user?.displayName || user?.email || "User"}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
