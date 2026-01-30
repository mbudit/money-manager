import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu, PiggyBank } from "lucide-react";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30 flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
        >
          <Menu size={24} />
        </button>
        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
          <PiggyBank size={18} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">MoneyMgr</h1>
      </div>

      <main className="md:pl-64 min-h-screen transition-all duration-300">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Temporary placeholder for AppLayout export to match App.tsx import
// In App.tsx I imported `Layout` from `./components/Layout/AppLayout`
// but I'm saving this file as AppLayout.tsx so it should export Layout.
