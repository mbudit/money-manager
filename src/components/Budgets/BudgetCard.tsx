import { useState } from "react";
import { Wallet, AlertCircle, ChevronDown, ChevronUp, ArrowDownLeft } from "lucide-react";
import type { Bucket, Category, Transaction, Account } from "@/types";
import { format } from "date-fns";

interface BudgetCardProps {
  bucket: Bucket;
  spent: number;
  categories: Category[];
  transactions: Transaction[];
  accounts: Account[];
  onEdit: (bucket: Bucket) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

export function BudgetCard({
  bucket,
  spent,
  categories,
  transactions,
  accounts,
  onEdit,
  onDelete,
  formatCurrency,
}: BudgetCardProps) {
  const [showTransactions, setShowTransactions] = useState(false);

  const percentage = Math.min((spent / bucket.limit) * 100, 100);
  const isOverBudget = spent > bucket.limit;

  // Get transactions for this bucket
  const bucketTransactions = transactions
    .filter((t) => t.bucketId === bucket.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategoryName = (id?: string) =>
    categories.find((c) => c.id === id)?.name || "Uncategorized";

  const getAccountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name || "Unknown";

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
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => onEdit(bucket)}
            className="text-gray-400 hover:text-teal-600 text-sm"
          >
            Edit
          </button>
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
            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? "bg-red-500" : "bg-teal-500"
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

      {/* View Transactions Toggle */}
      <button
        onClick={() => setShowTransactions(!showTransactions)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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
        <div className="mt-3 border-t border-gray-100 pt-3">
          {bucketTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No transactions in this bucket yet
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bucketTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <ArrowDownLeft size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {getCategoryName(tx.categoryId)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(tx.date), "dd MMM yyyy")} · {getAccountName(tx.accountId)}
                      </p>
                      {tx.note && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {tx.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-600">
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
