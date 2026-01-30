import { Wallet, AlertCircle } from "lucide-react";
import type { Bucket, Category } from "@/types";

interface BudgetCardProps {
  bucket: Bucket;
  spent: number;
  categories: Category[]; // Using the full Category type from context/types
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

export function BudgetCard({
  bucket,
  spent,
  categories,
  onDelete,
  formatCurrency,
}: BudgetCardProps) {
  const percentage = Math.min((spent / bucket.limit) * 100, 100);
  const isOverBudget = spent > bucket.limit;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: bucket.color }}
          >
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{bucket.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {bucket.categoryIds.map((catId) => {
                const cat = categories.find((c) => c.id === catId);
                return cat ? (
                  <span
                    key={catId}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                  >
                    {cat.name}
                  </span>
                ) : null;
              })}
              {bucket.categoryIds.length === 0 && (
                <span className="text-xs text-red-400 italic">
                  No categories linked
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                {bucket.period || "Monthly"}
              </span>
              {bucket.constraint && bucket.constraint !== "all" && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
                  {bucket.constraint === "workdays" ? "Mon-Fri" : "Weekends"}
                </span>
              )}
              {bucket.rollover && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100">
                  Rollover
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <button
            onClick={() => {
              if (confirm("Delete this bucket?")) onDelete(bucket.id);
            }}
            className="text-gray-400 hover:text-red-500 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span className={isOverBudget ? "text-red-600" : "text-gray-600"}>
            {formatCurrency(spent)}
          </span>
          <span className="text-gray-400">
            of {formatCurrency(bucket.limit)}
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? "bg-red-500" : "bg-teal-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {isOverBudget && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle size={12} />
            Over budget by {formatCurrency(spent - bucket.limit)}
          </p>
        )}
      </div>
    </div>
  );
}
