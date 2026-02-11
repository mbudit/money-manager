import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { PiggyBank, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UIContext";
import { AddTransactionModal } from "../Transactions/AddTransactionModal";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const {
    isAddTransactionModalOpen,
    closeAddTransactionModal,
    editingTransaction,
  } = useUI();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
            <PiggyBank size={18} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Money Manager</h1>
        </div>
        <button
          onClick={logout}
          className="p-2 text-gray-500 hover:text-red-600 transition-colors"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>

      <main className="md:pl-64 min-h-screen transition-all duration-300 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />

      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={closeAddTransactionModal}
        transaction={editingTransaction}
      />
    </div>
  );
}

// Temporary placeholder for AppLayout export to match App.tsx import
// In App.tsx I imported `Layout` from `./components/Layout/AppLayout`
// but I'm saving this file as AppLayout.tsx so it should export Layout.
