import { useState, useMemo } from "react";
import { useMoney } from "../context/MoneyContext";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, Receipt } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CategoryData {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  percentage: number;
  transactions: {
    id: string;
    date: string;
    note?: string;
    amount: number;
  }[];
}

export function Reports() {
  const { transactions, categories } = useMoney();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
    setExpandedCategory(null);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Filter expenses for the selected month
  const monthExpenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== "expense") return false;
      const txDate = new Date(t.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });
  }, [transactions, monthStart, monthEnd]);

  const totalExpenses = useMemo(
    () => monthExpenses.reduce((sum, t) => sum + t.amount, 0),
    [monthExpenses]
  );

  // Group by category
  const categoryData: CategoryData[] = useMemo(() => {
    const grouped = new Map<string, CategoryData>();

    for (const tx of monthExpenses) {
      const catId = tx.categoryId || "uncategorized";
      if (!grouped.has(catId)) {
        const cat = categories.find((c) => c.id === catId);
        grouped.set(catId, {
          categoryId: catId,
          name: cat?.name || "Uncategorized",
          color: cat?.color || "#9CA3AF",
          total: 0,
          percentage: 0,
          transactions: [],
        });
      }
      const entry = grouped.get(catId)!;
      entry.total += tx.amount;
      entry.transactions.push({
        id: tx.id,
        date: tx.date,
        note: tx.note,
        amount: tx.amount,
      });
    }

    // Calculate percentages and sort by total descending
    const result = Array.from(grouped.values())
      .map((d) => ({
        ...d,
        percentage: totalExpenses > 0 ? (d.total / totalExpenses) * 100 : 0,
        transactions: d.transactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }))
      .sort((a, b) => b.total - a.total);

    return result;
  }, [monthExpenses, categories, totalExpenses]);

  const chartData = categoryData.map((d) => ({
    name: d.name,
    value: d.total,
    color: d.color,
  }));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Expenses Analysis</h2>

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

      {monthExpenses.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Receipt size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No expenses this month
          </h3>
          <p className="text-gray-400 text-sm">
            Expenses recorded in {format(currentDate, "MMMM yyyy")} will appear
            here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Chart + Summary */}
          <div className="lg:col-span-1 space-y-4">
            {/* Summary card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {monthExpenses.length} transaction
                {monthExpenses.length !== 1 ? "s" : ""} across{" "}
                {categoryData.length} categor
                {categoryData.length !== 1 ? "ies" : "y"}
              </p>
            </div>

            {/* Donut chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Category Breakdown
              </h3>
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        value !== undefined
                          ? formatCurrency(value)
                          : "Rp 0",
                        "Amount",
                      ]}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-sm font-bold text-gray-800">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-3 space-y-1.5">
                {categoryData.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-gray-600 truncate max-w-[120px]">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-gray-400 font-medium">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Category cards */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              By Category
            </h3>

            {categoryData.map((cat) => {
              const isExpanded = expandedCategory === cat.categoryId;
              return (
                <div
                  key={cat.categoryId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md"
                >
                  {/* Category header — clickable */}
                  <button
                    onClick={() => toggleCategory(cat.categoryId)}
                    className="w-full flex items-center gap-4 p-4 text-left cursor-pointer"
                  >
                    {/* Color accent */}
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: cat.color + "1A" }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 truncate">
                          {cat.name}
                        </span>
                        <span className="font-bold text-gray-900 ml-4 shrink-0">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${cat.percentage}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 w-12 text-right">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded transaction list */}
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    style={{
                      gridTemplateRows: isExpanded ? "1fr" : "0fr",
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-gray-100">
                        {cat.transactions.map((tx, i) => (
                          <div
                            key={tx.id}
                            className={`flex items-center justify-between px-4 py-3 ${
                              i !== cat.transactions.length - 1
                                ? "border-b border-gray-50"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs text-gray-400 shrink-0 w-14">
                                {format(new Date(tx.date), "dd MMM")}
                              </span>
                              <span className="text-sm text-gray-600 truncate">
                                {tx.note || "—"}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-800 ml-4 shrink-0">
                              {formatCurrency(tx.amount)}
                            </span>
                          </div>
                        ))}

                        {/* Subtotal row */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                          <span className="text-xs font-medium text-gray-500">
                            {cat.transactions.length} transaction
                            {cat.transactions.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-sm font-bold text-gray-700">
                            {formatCurrency(cat.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
