import { useMemo } from "react";
import { Utensils } from "lucide-react";
import { useMoney } from "@/context/MoneyContext";
import type { Bucket } from "@/types";

interface MealTrackerCardProps {
  bucket: Bucket;
  onDelete: (id: string) => void;
}

export function MealTrackerCard({ bucket, onDelete }: MealTrackerCardProps) {
  const { transactions } = useMoney();

  const trackerData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // 1. Calculate Workdays in Current Month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let workdaysCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workdaysCount++;
      }
    }

    // 2. Daily Allowance is now the LIMIT itself
    const dailyAllowance = bucket.limit;

    // 3. Calculate Spent Today
    const todayStart = new Date(currentYear, currentMonth, currentDay);
    todayStart.setHours(0, 0, 0, 0);

    // We only care about transactions that match the bucket's categories
    // AND happen TODAY.
    const spentToday = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "expense" &&
          bucket.categoryIds.includes(t.categoryId || "") &&
          tDate.getDate() === currentDay &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // 4. Calculate Remaining Today
    const remainingToday = dailyAllowance - spentToday;

    // 5. Projected Monthly Total (for display)
    const monthlyTotal = dailyAllowance * workdaysCount;

    // 6. Grid Data for Visualization
    const gridData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay();
      const isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6;

      const spentOnDay = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return (
            t.type === "expense" &&
            bucket.categoryIds.includes(t.categoryId || "") &&
            tDate.getDate() === day &&
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);

      let status = "empty";
      if (spentOnDay === 0) status = "empty";
      else if (spentOnDay < dailyAllowance) status = "partial";
      else status = "full";

      gridData.push({ day, isWorkday, spent: spentOnDay, status });
    }

    return {
      workdaysCount,
      dailyAllowance,
      spentToday,
      remainingToday,
      monthlyTotal,
      gridData,
    };
  }, [bucket, transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100 shadow-sm relative overflow-hidden group">
      {/* Decorative Icon Background */}
      <div className="absolute -right-4 -bottom-4 text-orange-100 opacity-50">
        <Utensils size={120} />
      </div>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={() => {
            if (confirm("Delete this tracker?")) onDelete(bucket.id);
          }}
          className="text-orange-300 hover:text-red-500 text-xs font-medium bg-white/50 px-2 py-1 rounded"
        >
          Delete
        </button>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
            <Utensils size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{bucket.name}</h3>
            <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">
              {bucket.constraint === "workdays"
                ? "Workday Meal Logic"
                : "Daily Tracker"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Daily Allowance</p>
            <p className="text-lg font-bold text-gray-700">
              {formatCurrency(trackerData.dailyAllowance)}
            </p>
            <p className="text-[10px] text-gray-400">
              {formatCurrency(trackerData.monthlyTotal)} /{" "}
              {trackerData.workdaysCount} days
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Spent Today</p>
            <p className="text-lg font-bold text-orange-600">
              {formatCurrency(trackerData.spentToday)}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-orange-100">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Remaining Today
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${trackerData.remainingToday < 0 ? "text-red-500" : "text-teal-600"}`}
            >
              {formatCurrency(trackerData.remainingToday)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-orange-100">
        <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-bold">
          Monthly Overview
        </p>
        <div className="flex flex-wrap gap-1">
          {trackerData.gridData.map((dayData) => (
            <div
              key={dayData.day}
              title={`Day ${dayData.day}: ${formatCurrency(dayData.spent)} ${
                !dayData.isWorkday ? "(Weekend)" : ""
              }`}
              className={`w-3 h-3 rounded-sm transition-all ${
                dayData.status === "full"
                  ? "bg-red-500"
                  : dayData.status === "partial"
                    ? "bg-orange-400"
                    : dayData.isWorkday
                      ? "bg-gray-200"
                      : "bg-gray-100 border border-gray-200" // Lighter for weekends
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
