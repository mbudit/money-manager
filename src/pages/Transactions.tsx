import { useState, useMemo } from "react";
import { Plus, Search, X } from "lucide-react";
import { useMoney } from "../context/MoneyContext";
import { useUI } from "../context/UIContext";
import { TransactionList } from "../components/Transactions/TransactionList";
import type { Transaction } from "../types";

export function Transactions() {
  const { transactions, accounts, categories, buckets, deleteTransaction } =
    useMoney();
  const { openAddTransactionModal } = useUI();

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleEdit = (transaction: Transaction) => {
    openAddTransactionModal(transaction);
  };


  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Filter by date range
    if (startDate) {
      result = result.filter((tx) => tx.date.substring(0, 10) >= startDate);
    }
    if (endDate) {
      result = result.filter((tx) => tx.date.substring(0, 10) <= endDate);
    }

    if (!searchQuery.trim()) return result;

    const query = searchQuery.toLowerCase().trim();

    return result.filter((tx) => {
      // Search by category name
      const category = categories.find((c) => c.id === tx.categoryId);
      if (category?.name.toLowerCase().includes(query)) return true;

      // Search by account name
      const account = accounts.find((a) => a.id === tx.accountId);
      if (account?.name.toLowerCase().includes(query)) return true;

      // Search by toAccount name (for transfers)
      if (tx.toAccountId) {
        const toAccount = accounts.find((a) => a.id === tx.toAccountId);
        if (toAccount?.name.toLowerCase().includes(query)) return true;
      }

      // Search by bucket name
      if (tx.bucketId) {
        const bucket = buckets.find((b) => b.id === tx.bucketId);
        if (bucket?.name.toLowerCase().includes(query)) return true;
      }
      // Also match "no bucket" search
      if (!tx.bucketId && "no bucket".includes(query)) return true;

      // Search by note
      if (tx.note?.toLowerCase().includes(query)) return true;

      // Search by amount
      if (tx.amount.toString().includes(query)) return true;

      // Search by type
      if (tx.type.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [
    transactions,
    searchQuery,
    categories,
    accounts,
    buckets,
    startDate,
    endDate,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        <button
          onClick={() => openAddTransactionModal()}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
        >

          <Plus size={20} />
          <span>Add Transaction</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by category, account, note, or amount..."
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Date Filters */}
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-gray-600"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-gray-600"
          />
        </div>
      </div>

      {/* Results info when searching */}
      {(searchQuery || startDate || endDate) && (
        <p className="text-sm text-gray-500">
          Found {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? "s" : ""}
          {searchQuery && ` matching "${searchQuery}"`}
          {startDate && ` from ${startDate}`}
          {endDate && ` to ${endDate}`}
        </p>
      )}

      <TransactionList
        transactions={filteredTransactions}
        accounts={accounts}
        categories={categories}
        buckets={buckets}
        onEdit={handleEdit}
        onDelete={deleteTransaction}
      />
    </div>
  );
}
