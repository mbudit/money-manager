import { useMemo, useState } from "react";
import {
  Utensils,
  ChevronDown,
  ChevronUp,
  ArrowDownLeft,
  AlertCircle,
} from "lucide-react";
import { useMoney } from "@/context/MoneyContext";
import type { Bucket } from "@/types";
import { format } from "date-fns";

interface MealTrackerCardProps {
  bucket: Bucket;
  onEdit: (bucket: Bucket) => void;
  onDelete: (id: string) => void;
}

export function MealTrackerCard({
  bucket,
  onEdit,
  onDelete,
}: MealTrackerCardProps) {
  const { transactions, categories, accounts } = useMoney();
  const [showTransactions, setShowTransactions] = useState(false);

  // Get all transactions for this bucket
  const bucketTransactions = transactions
    .filter((t) => t.bucketId === bucket.id && t.type === "expense")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategoryName = (id?: string) =>
    categories.find((c) => c.id === id)?.name || "Uncategorized";

  const getAccountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name || "Unknown";

  const trackerData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // 0. Define Today Start (Midnight)
    const todayStart = new Date(currentYear, currentMonth, currentDay);
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();

    // 1. Calculate Workdays in Current Month and Prior Workdays
    // Only count from bucket creation date (if created mid-month)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let startDay = 1;
    if (bucket.createdAt) {
      const created = new Date(bucket.createdAt + "T00:00:00");
      if (
        created.getFullYear() === currentYear &&
        created.getMonth() === currentMonth
      ) {
        startDay = created.getDate();
      }
    }
    let workdaysCount = 0;
    let workdaysPrior = 0;

    for (let day = startDay; day <= daysInMonth; day++) {
      const loopDate = new Date(currentYear, currentMonth, day);
      const dayOfWeek = loopDate.getDay();

      // Check if it's a workday (Mon-Fri)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workdaysCount++;
        // Use strict timestamp comparison
        if (loopDate.getTime() < todayStartTime) {
          workdaysPrior++;
        }
      }
    }

    // 2. Daily Allowance is the LIMIT itself (as per user's setup)
    const dailyAllowance = bucket.limit;

    // 3. Calculate Spent Prior (Strictly before today)
    const spentPrior = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "expense" &&
          t.bucketId === bucket.id &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear &&
          tDate.getTime() < todayStartTime
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // 4. Calculate Rollover (snapshot-aware for mid-month rate changes)
    let rollover: number;
    if (
      bucket.rolloverSnapshot !== undefined &&
      bucket.rolloverSnapshotDate
    ) {
      const snapDate = new Date(bucket.rolloverSnapshotDate + "T00:00:00");
      if (
        snapDate.getMonth() === currentMonth &&
        snapDate.getFullYear() === currentYear
      ) {
        // Valid snapshot: compute rollover since snapshot at CURRENT rate
        let wdSinceSnap = 0;
        let spentSinceSnap = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const d = new Date(currentYear, currentMonth, day);
          const dow = d.getDay();
          if (
            dow !== 0 &&
            dow !== 6 &&
            d.getTime() >= snapDate.getTime() &&
            d.getTime() < todayStartTime
          ) {
            wdSinceSnap++;
          }
        }
        spentSinceSnap = transactions
          .filter((t) => {
            const tDate = new Date(t.date);
            return (
              t.type === "expense" &&
              t.bucketId === bucket.id &&
              tDate.getMonth() === currentMonth &&
              tDate.getFullYear() === currentYear &&
              tDate.getTime() >= snapDate.getTime() &&
              tDate.getTime() < todayStartTime
            );
          })
          .reduce((sum, t) => sum + t.amount, 0);
        rollover =
          bucket.rolloverSnapshot +
          wdSinceSnap * dailyAllowance -
          spentSinceSnap;
      } else {
        // Snapshot from a different month — ignore, compute fresh
        rollover = workdaysPrior * dailyAllowance - spentPrior;
      }
    } else {
      // No snapshot — original logic
      rollover = workdaysPrior * dailyAllowance - spentPrior;
    }

    // 5. Calculate Spent Today
    const spentToday = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "expense" &&
          t.bucketId === bucket.id &&
          tDate.getDate() === currentDay &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // 6. Calculate Remaining Today
    const availableToday = dailyAllowance + rollover;
    const remainingToday = availableToday - spentToday;

    // 7. Monthly calculations (effective, works with mixed rates)
    const totalSpentSoFar = spentPrior + spentToday;
    const todayDow = now.getDay();
    const isTodayWorkday = todayDow !== 0 && todayDow !== 6;
    const remainingWorkdaysAfterToday =
      workdaysCount - workdaysPrior - (isTodayWorkday ? 1 : 0);
    const remainingMonthly =
      remainingToday + remainingWorkdaysAfterToday * dailyAllowance;
    const monthlyTotal = totalSpentSoFar + remainingMonthly;

    // 8. Grid Data for Visualization
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
            t.bucketId === bucket.id &&
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
      rollover,
      spentToday,
      remainingToday,
      monthlyTotal,
      remainingMonthly,
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

      <div className="absolute top-4 right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 flex gap-2">
        <button
          onClick={() => onEdit(bucket)}
          className="text-orange-400 hover:text-teal-600 text-xs font-medium bg-white/50 px-2 py-1 rounded"
        >
          Edit
        </button>
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
            {/* Show leftover indicator only when there are leftovers available */}
            {(() => {
              const effectiveLeftover =
                trackerData.remainingToday - trackerData.dailyAllowance;
              if (effectiveLeftover > 0) {
                return (
                  <p className="text-xs font-medium text-teal-600">
                    +{formatCurrency(effectiveLeftover)} leftover
                  </p>
                );
              }
              return null;
            })()}
            <p className="text-[10px] text-gray-500 mt-2 font-medium">
              Monthly Remaining:{" "}
              <span
                className={
                  trackerData.remainingMonthly < 0
                    ? "text-red-500"
                    : "text-gray-700"
                }
              >
                {formatCurrency(trackerData.remainingMonthly)}
              </span>
              <span className="text-gray-400 font-normal">
                {" "}
                / {formatCurrency(trackerData.monthlyTotal)}
              </span>
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

      <div className="mt-4 pt-3 border-t border-orange-100 relative z-10">
        <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-bold">
          Monthly Overview
        </p>
        <div className="flex flex-wrap gap-1">
          {trackerData.gridData.map((dayData) => (
            <div
              key={dayData.day}
              title={`Day ${dayData.day}: ${formatCurrency(dayData.spent)} ${!dayData.isWorkday ? "(Weekend)" : ""
                }`}
              className={`w-3 h-3 rounded-sm transition-all ${dayData.status === "full"
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

      {/* Account Comparison */}
      {(() => {
        if (!bucket.targetAccountId) return null;
        const account = accounts.find((a) => a.id === bucket.targetAccountId);
        if (!account) return null;

        const isLiquid = account.balance >= trackerData.remainingMonthly;
        // Use max(0, ...) so we don't show negative remaining budget in the context of "what do I need to have in my account"
        const remainingToFund = Math.max(0, trackerData.remainingMonthly);

        return (
          <div
            className={`mt-4 mx-4 mb-2 p-3 rounded-lg border ${isLiquid
              ? "bg-blue-50 border-blue-100 text-blue-800"
              : "bg-red-50 border-red-100 text-red-800"
              }`}
          >
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold flex items-center gap-1">
                {isLiquid ? "Monthly Funds Covered" : "Low Funds Warning"}
                {!isLiquid && <AlertCircle size={12} />}
              </span>
              <span className="opacity-75">{account.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>
                Account: <strong>{formatCurrency(account.balance)}</strong>
              </span>
              <span className="mx-1 opacity-40">/</span>
              <span>
                Est. Remaining:{" "}
                <strong>{formatCurrency(remainingToFund)}</strong>
              </span>
            </div>
          </div>
        );
      })()}

      {/* View Transactions Toggle */}
      <button
        onClick={() => setShowTransactions(!showTransactions)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-100/50 rounded-lg transition-colors relative z-10"
      >
        {showTransactions ? (
          <>
            <ChevronUp size={16} />
            Hide Transactions
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            View Transactions ({bucketTransactions.length})
          </>
        )}
      </button>

      {/* Transactions List */}
      {showTransactions && (
        <div className="mt-3 border-t border-orange-100 pt-3 relative z-10">
          {bucketTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No transactions in this bucket yet
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bucketTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <ArrowDownLeft size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {getCategoryName(tx.categoryId)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(tx.date), "dd MMM yyyy")} ·{" "}
                        {getAccountName(tx.accountId)}
                      </p>
                      {tx.note && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {tx.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-orange-600">
                    -{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
