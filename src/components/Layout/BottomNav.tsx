import {
    LayoutDashboard,
    Receipt,
    Wallet,
    PieChart,
    PiggyBank,
    Tag,
    Plus,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUI } from "../../context/UIContext";

export function BottomNav() {
    const { openAddTransactionModal } = useUI();

    const leftNavItems = [
        { icon: LayoutDashboard, label: "Home", path: "/" },
        { icon: Receipt, label: "Trans", path: "/transactions" },
        { icon: Wallet, label: "Accts", path: "/accounts" },
    ];

    const rightNavItems = [
        { icon: PiggyBank, label: "Budgets", path: "/budgets" },
        { icon: Tag, label: "Cats", path: "/categories" },
        { icon: PieChart, label: "Reports", path: "/reports" },
    ];

    const NavItem = ({
        item,
    }: {
        item: { icon: any; label: string; path: string };
    }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-teal-600 dark:text-teal-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`
            }
        >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
    );

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 pb-safe transition-colors duration-200">
            <div className="flex justify-between items-center h-16 px-2">
                {/* Left Items */}
                <div className="flex flex-1 justify-around">
                    {leftNavItems.map((item) => (
                        <NavItem key={item.path} item={item} />
                    ))}
                </div>

                {/* Central Add Button */}
                <div className="relative -top-6">
                    <button
                        onClick={() => openAddTransactionModal()}
                        className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition-colors border-4 border-gray-50 dark:border-gray-900"
                        aria-label="Add Transaction"
                    >
                        <Plus size={28} />
                    </button>
                </div>

                {/* Right Items */}
                <div className="flex flex-1 justify-around">
                    {rightNavItems.map((item) => (
                        <NavItem key={item.path} item={item} />
                    ))}
                </div>
            </div>
        </nav>
    );
}
