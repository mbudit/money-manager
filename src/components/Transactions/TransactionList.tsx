import { useState, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Wallet,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  Calendar,
  Plus,
} from "lucide-react";
import type { Transaction, Account, Category, Bucket } from "../../types";
import { format } from "date-fns";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  buckets?: Bucket[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onAdd?: (defaultDate: string) => void;
}

type SortField = "date" | "category" | "account" | "amount";
type SortDirection = "asc" | "desc";

interface DayGroup {
  dateKey: string;
  label: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  buckets = [],
  onEdit,
  onDelete,
  onAdd,
}: TransactionListProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const getAccountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name || "Unknown Account";
  const getCategory = (id?: string) => categories.find((c) => c.id === id);
  const getBucketName = (id?: string) => {
    if (!id) return null;
    return buckets.find((b) => b.id === id)?.name || null;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "date" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp size={14} className="opacity-0 group-hover:opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp size={14} className="text-teal-600" />
    ) : (
      <ChevronDown size={14} className="text-teal-600" />
    );
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "category": {
          const catA = getCategory(a.categoryId)?.name || (a.type === "transfer" ? "Transfer" : "Uncategorized");
          const catB = getCategory(b.categoryId)?.name || (b.type === "transfer" ? "Transfer" : "Uncategorized");
          comparison = catA.localeCompare(catB);
          break;
        }
        case "account": {
          const accA = getAccountName(a.accountId);
          const accB = getAccountName(b.accountId);
          comparison = accA.localeCompare(accB);
          break;
        }
        case "amount":
          comparison = a.amount - b.amount;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [transactions, sortField, sortDirection, accounts, categories]);

  // Group sorted transactions by date
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups = new Map<string, Transaction[]>();

    for (const tx of sortedTransactions) {
      const dateKey = tx.date.substring(0, 10); // "YYYY-MM-DD"
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(tx);
    }

    return Array.from(groups.entries()).map(([dateKey, txs]) => {
      const totalIncome = txs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = txs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        dateKey,
        label: format(new Date(dateKey), "EEEE, dd MMM yyyy"),
        transactions: txs,
        totalIncome,
        totalExpense,
      };
    });
  }, [sortedTransactions]);

  const colCount = 5 + (onEdit || onDelete ? 1 : 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  // Compute default datetime for a day group (date from group + time from latest transaction)
  const getDefaultDateForGroup = (group: DayGroup): string => {
    const latestTx = [...group.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    if (latestTx) {
      return format(new Date(latestTx.date), "yyyy-MM-dd'T'HH:mm");
    }
    return `${group.dateKey}T12:00`;
  };

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
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th
                onClick={() => handleSort("date")}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
              >
                <div className="flex items-center gap-1">
                  Time
                  <SortIcon field="date" />
                </div>
              </th>
              <th
                onClick={() => handleSort("category")}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
              >
                <div className="flex items-center gap-1">
                  Category / Note
                  <SortIcon field="category" />
                </div>
              </th>
              <th
                onClick={() => handleSort("account")}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
              >
                <div className="flex items-center gap-1">
                  Account
                  <SortIcon field="account" />
                </div>
              </th>
              <th
                onClick={() => handleSort("amount")}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-100 transition-colors group select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  Amount
                  <SortIcon field="amount" />
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                Bucket
              </th>
              {(onEdit || onDelete) && (
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dayGroups.map((group) => (
              <>
                {/* Date group header */}
                <tr key={`header-${group.dateKey}`} className="bg-gray-50/80">
                  <td colSpan={colCount} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-teal-600" />
                        <span className="text-sm font-semibold text-gray-700">
                          {group.label}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          · {group.transactions.length} transaction{group.transactions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium">
                        {group.totalIncome > 0 && (
                          <span className="text-teal-600">
                            +{formatCurrency(group.totalIncome)}
                          </span>
                        )}
                        {group.totalExpense > 0 && (
                          <span className="text-red-600">
                            -{formatCurrency(group.totalExpense)}
                          </span>
                        )}
                        {onAdd && (
                          <button
                            onClick={() => onAdd(getDefaultDateForGroup(group))}
                            className="ml-1 p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                            title="Add transaction for this day"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Transactions for this day */}
                {group.transactions.map((transaction) => {
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
                        {format(new Date(transaction.date), "HH:mm")}
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
                        className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${isExpense
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
                      <td className="px-6 py-4 text-sm text-center">
                        {(() => {
                          const name = getBucketName(transaction.bucketId);
                          return (
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${name
                                ? "bg-blue-100 text-blue-700"
                                : transaction.bucketId
                                  ? "bg-gray-100 text-gray-400 line-through"
                                  : "bg-gray-100 text-gray-500"
                                }`}
                            >
                              {name || (transaction.bucketId ? "Deleted" : "No Bucket")}
                            </span>
                          );
                        })()}
                      </td>
                      {(onEdit || onDelete) && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(transaction)}
                                className="text-gray-400 hover:text-teal-600 transition-colors p-2 hover:bg-teal-50 rounded-full"
                                title="Edit Transaction"
                              >
                                <Pencil size={18} />
                              </button>
                            )}
                            {onDelete && (
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
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile List View */}
      <div className="block md:hidden">
        {dayGroups.map((group) => (
          <div key={`mobile-group-${group.dateKey}`}>
            {/* Mobile Date Header */}
            <div className="bg-gray-50/90 px-4 py-3 border-b border-gray-100 sticky top-0 backdrop-blur-sm z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {group.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  {group.totalIncome > 0 && (
                    <span className="text-teal-600">
                      +{formatCurrency(group.totalIncome)}
                    </span>
                  )}
                  {group.totalExpense > 0 && (
                    <span className="text-red-600">
                      -{formatCurrency(group.totalExpense)}
                    </span>
                  )}
                  {onAdd && (
                    <button
                      onClick={() => onAdd(getDefaultDateForGroup(group))}
                      className="ml-1 p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                      title="Add transaction for this day"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Transaction Items */}
            <div className="divide-y divide-gray-100">
              {group.transactions.map((transaction) => {
                const category = getCategory(transaction.categoryId);
                const isExpense = transaction.type === "expense";
                const isIncome = transaction.type === "income";
                const isTransfer = transaction.type === "transfer";

                return (
                  <div key={transaction.id} className="p-4 bg-white active:bg-gray-50">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 mt-1`}
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

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-medium text-gray-900 truncate">
                              {isTransfer
                                ? "Transfer"
                                : category?.name || "Uncategorized"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              {isTransfer ? (
                                <div className="flex items-center gap-1">
                                  <span>{getAccountName(transaction.accountId)}</span>
                                  <ArrowRight size={12} />
                                  <span>{getAccountName(transaction.toAccountId || "")}</span>
                                </div>
                              ) : (
                                <span>{getAccountName(transaction.accountId)}</span>
                              )}
                              <span>•</span>
                              <span>{format(new Date(transaction.date), "HH:mm")}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p
                              className={`font-semibold ${isExpense
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
                                maximumFractionDigits: 0
                              }).format(transaction.amount)}
                            </p>
                            {transaction.bucketId && (() => {
                              const name = getBucketName(transaction.bucketId);
                              return (
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${name ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400 line-through"}`}>
                                  {name || "Deleted"}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {(transaction.note || onEdit || onDelete) && (
                          <div className="flex justify-between items-end mt-2">
                            <p className="text-sm text-gray-500 line-clamp-1 flex-1 mr-2">
                              {transaction.note}
                            </p>

                            {(onEdit || onDelete) && (
                              <div className="flex gap-1 shrink-0">
                                {onEdit && (
                                  <button
                                    onClick={() => onEdit(transaction)}
                                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm("Delete this transaction?")) {
                                        onDelete(transaction.id);
                                      }
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
