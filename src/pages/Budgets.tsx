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
  const [editingBucket, setEditingBucket] = useState<Bucket | undefined>(
    undefined,
  );

  const handleEdit = (bucket: Bucket) => {
    setEditingBucket(bucket);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBucket(undefined);
  };

  // Helper to calculate spent amount for a bucket based on its ID and period constraints
  const getBucketSpent = (
    bucketId: string,
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
        // Must be explicitly linked to this bucket
        if (t.bucketId !== bucketId) return false;

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

        return t.type === "expense" && isPeriodMatch && isConstraintMatch;
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

      {/* Global Liquidity Check (Reconciliation) */}
      {(() => {
        const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        const totalRemainingNeeded = buckets.reduce((sum, bucket) => {
          // 1. Calculate Spent for this bucket
          let spent = 0;
          let limit = bucket.limit;

          if (bucket.isMealTracker) {
            // Meal Tracker Logic: Calculate Monthly Limit based on Workdays
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const daysInMonth = new Date(
              currentYear,
              currentMonth + 1,
              0,
            ).getDate();
            let workdaysCount = 0;
            for (let day = 1; day <= daysInMonth; day++) {
              const date = new Date(currentYear, currentMonth, day);
              const dayOfWeek = date.getDay();
              if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workdaysCount++;
              }
            }

            // Real Monthly Limit for Meal Tracker
            limit = bucket.limit * workdaysCount;

            // Spent strictly this month
            spent = transactions
              .filter((t) => {
                const tDate = new Date(t.date);
                return (
                  t.type === "expense" &&
                  t.bucketId === bucket.id &&
                  tDate.getMonth() === currentMonth &&
                  tDate.getFullYear() === currentYear
                );
              })
              .reduce((s, t) => s + t.amount, 0);
          } else {
            // Standard Bucket Logic
            spent = getBucketSpent(
              bucket.id,
              bucket.period || "monthly",
              bucket.constraint || "all",
            );
          }

          // Remaining needed for this bucket
          const remaining = Math.max(0, limit - spent);
          return sum + remaining;
        }, 0);

        const diff = totalCash - totalRemainingNeeded;
        const isOverAllocated = diff < -1000; // Tolerance

        return (
          <div
            className={`p-4 rounded-xl border ${isOverAllocated
              ? "bg-red-50 border-red-100"
              : "bg-teal-50 border-teal-100"
              }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full ${isOverAllocated
                  ? "bg-red-100 text-red-600"
                  : "bg-teal-100 text-teal-600"
                  }`}
              >
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3
                    className={`font-bold ${isOverAllocated ? "text-red-800" : "text-teal-800"
                      }`}
                  >
                    {isOverAllocated
                      ? "Insufficient Funds"
                      : "Budget Solvency Check"}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${isOverAllocated
                      ? "bg-red-200 text-red-700"
                      : "bg-teal-200 text-teal-700"
                      }`}
                  >
                    {isOverAllocated ? formatCurrency(diff) : "Liquid"}
                  </span>
                </div>

                <p
                  className={`text-sm mt-1 ${isOverAllocated ? "text-red-600" : "text-teal-600"
                    }`}
                >
                  Real: <strong>{formatCurrency(totalCash)}</strong>
                  <span className="mx-1">vs</span>
                  Remaining: <strong>{formatCurrency(totalRemainingNeeded)}</strong>
                  <span className="mx-2">|</span>
                  <span className="font-bold">
                    {diff >= 0 ? "Surplus: " : "Deficit: "}
                    {formatCurrency(diff)}
                  </span>
                </p>

                {isOverAllocated && (
                  <p className="text-xs mt-2 font-medium opacity-90 text-red-600">
                    Warning: You don't have enough cash to cover the remaining budget for this month.
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
                onEdit={handleEdit}
                onDelete={deleteBucket}
              />
            );
          }

          const spent = getBucketSpent(
            bucket.id,
            bucket.period || "monthly",
            bucket.constraint || "all",
          );

          return (
            <BudgetCard
              key={bucket.id}
              bucket={bucket}
              spent={spent}
              categories={categories}
              transactions={transactions}
              accounts={accounts}
              onEdit={handleEdit}
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
        onClose={handleCloseModal}
        title={editingBucket ? "Edit Bucket" : "Create New Bucket"}
        maxWidth="max-w-3xl"
      >
        <AddBucketForm
          onClose={handleCloseModal}
          editingBucket={editingBucket}
        />
      </Modal>
    </div>
  );
}
