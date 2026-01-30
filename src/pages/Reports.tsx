import { useState } from "react";
import { useMoney } from "../context/MoneyContext";
import { MonthlyExpenseChart } from "../components/Reports/MonthlyExpenseChart";
import { CategoryPieChart } from "../components/Reports/CategoryPieChart";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Reports() {
  const { transactions, categories } = useMoney();
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>

        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-medium text-gray-900 min-w-[120px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => navigateMonth("next")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Daily Expenses
          </h3>
          <MonthlyExpenseChart
            transactions={transactions}
            currentDate={currentDate}
          />
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Expenses by Category
          </h3>
          <CategoryPieChart
            transactions={transactions}
            categories={categories}
          />
        </div>
      </div>
    </div>
  );
}
