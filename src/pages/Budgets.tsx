import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { useMoney } from "@/context/MoneyContext";
import { Modal } from "@/components/UI/Modal";
import { MealTrackerCard } from "@/components/Dashboard/MealTrackerCard";
import { AddBucketForm } from "@/components/Budgets/AddBucketForm";
import { BudgetCard } from "@/components/Budgets/BudgetCard";
import type { Bucket } from "@/types";

export function Budgets() {
  const { buckets, categories, transactions, accounts, deleteBucket } =
    useMoney();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to calculate spent amount for a bucket based on its categories and period constraints
  const getBucketSpent = (
    bucketCategoryIds: string[],
    period: Bucket["period"],
    constraint: Bucket["constraint"],
  ) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // Calculate start of week (Sunday as 0)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);

        // 1. Check Period
        let isPeriodMatch = false;
        if (period === "monthly") {
          isPeriodMatch =
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear;
        } else if (period === "weekly") {
          isPeriodMatch = tDate >= startOfWeek;
        } else if (period === "daily") {
          isPeriodMatch =
            tDate.getDate() === currentDay &&
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear;
        }

        // 2. Check Constraint
        let isConstraintMatch = true;
        const tDay = tDate.getDay(); // 0 = Sunday, 6 = Saturday
        if (constraint === "workdays") {
          isConstraintMatch = tDay >= 1 && tDay <= 5;
        } else if (constraint === "weekends") {
          isConstraintMatch = tDay === 0 || tDay === 6;
        }

        return (
          t.type === "expense" &&
          bucketCategoryIds.includes(t.categoryId || "") &&
          isPeriodMatch &&
          isConstraintMatch
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Budgets (Buckets)</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Bucket</span>
        </button>
      </div>

      {/* Global Liquidity Check (Reconciliation) - Simplified */}
      {(() => {
        const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        const totalBudgeted = buckets.reduce((sum, bucket) => {
          if (bucket.isMealTracker) {
            // Project Meal Daily Rate to Monthly (approx 22 days)
            return sum + bucket.limit * 22;
          }
          return sum + bucket.limit;
        }, 0);

        const diff = totalCash - totalBudgeted;
        const isOverAllocated = diff < -1; // Tolerance

        return (
          <div
            className={`p-4 rounded-xl border ${
              isOverAllocated
                ? "bg-red-50 border-red-100"
                : "bg-teal-50 border-teal-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full ${
                  isOverAllocated
                    ? "bg-red-100 text-red-600"
                    : "bg-teal-100 text-teal-600"
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3
                    className={`font-bold ${
                      isOverAllocated ? "text-red-800" : "text-teal-800"
                    }`}
                  >
                    {isOverAllocated
                      ? "Over-Allocated (Panic!)"
                      : "Budget is Safe"}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isOverAllocated
                        ? "bg-red-200 text-red-700"
                        : "bg-teal-200 text-teal-700"
                    }`}
                  >
                    {isOverAllocated ? formatCurrency(diff) : "Liquid"}
                  </span>
                </div>

                <p
                  className={`text-sm mt-1 ${
                    isOverAllocated ? "text-red-600" : "text-teal-600"
                  }`}
                >
                  Total Real Money: <strong>{formatCurrency(totalCash)}</strong>
                  <span className="mx-2">vs</span>
                  Total Budgeted:{" "}
                  <strong>{formatCurrency(totalBudgeted)}</strong>
                </p>

                {isOverAllocated && (
                  <p className="text-xs mt-2 font-medium opacity-90 text-red-600">
                    Warning: You have budgeted more money than you actually
                    have. Reduce bucket limits immediately.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {buckets.map((bucket) => {
          if (bucket.isMealTracker) {
            return (
              <MealTrackerCard
                key={bucket.id}
                bucket={bucket}
                onDelete={deleteBucket}
              />
            );
          }

          const spent = getBucketSpent(
            bucket.categoryIds,
            bucket.period || "monthly",
            bucket.constraint || "all",
          );

          return (
            <BudgetCard
              key={bucket.id}
              bucket={bucket}
              spent={spent}
              categories={categories}
              onDelete={deleteBucket}
              formatCurrency={formatCurrency}
            />
          );
        })}

        {buckets.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-400 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
            <p>
              No buckets created yet. Start by creating a fixed cost or flex
              pool bucket.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Bucket"
      >
        <AddBucketForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
