import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Wallet,
  Trash2,
} from "lucide-react";
import type { Transaction, Account, Category } from "../../types";
import { format } from "date-fns";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDelete?: (id: string) => void;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  onDelete,
}: TransactionListProps) {
  const getAccountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name || "Unknown Account";
  const getCategory = (id?: string) => categories.find((c) => c.id === id);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <Wallet size={32} />
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          No transactions yet
        </h3>
        <p className="text-gray-500">
          Add your first transaction to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Category / Note
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Amount
              </th>
              {onDelete && (
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((transaction) => {
              const category = getCategory(transaction.categoryId);
              const isExpense = transaction.type === "expense";
              const isIncome = transaction.type === "income";
              const isTransfer = transaction.type === "transfer";

              return (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(transaction.date), "dd MMM yyyy, HH:mm")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0`}
                        style={{
                          backgroundColor: isTransfer
                            ? "#6B7280"
                            : category?.color || "#9CA3AF",
                        }}
                      >
                        {isExpense && <ArrowDownLeft size={20} />}
                        {isIncome && <ArrowUpRight size={20} />}
                        {isTransfer && <ArrowRight size={20} />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {isTransfer
                            ? "Transfer"
                            : category?.name || "Uncategorized"}
                        </p>
                        {transaction.note && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {transaction.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {isTransfer ? (
                      <div className="flex items-center gap-1">
                        <span>{getAccountName(transaction.accountId)}</span>
                        <ArrowRight size={14} className="text-gray-400" />
                        <span>
                          {getAccountName(transaction.toAccountId || "")}
                        </span>
                      </div>
                    ) : (
                      getAccountName(transaction.accountId)
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${
                      isExpense
                        ? "text-red-600"
                        : isIncome
                          ? "text-teal-600"
                          : "text-gray-900"
                    }`}
                  >
                    {isExpense ? "-" : isIncome ? "+" : ""}
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(transaction.amount)}
                  </td>
                  {onDelete && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this transaction?",
                            )
                          ) {
                            onDelete(transaction.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                        title="Delete Transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
