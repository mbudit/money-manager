import { useState, useMemo } from "react";
import { Plus, Search, X } from "lucide-react";
import { useMoney } from "../context/MoneyContext";
import { TransactionList } from "../components/Transactions/TransactionList";
import { AddTransactionModal } from "../components/Transactions/AddTransactionModal";
import type { Transaction } from "../types";

export function Transactions() {
  const { transactions, accounts, categories, deleteTransaction } = useMoney();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  };

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;

    const query = searchQuery.toLowerCase().trim();

    return transactions.filter((tx) => {
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

      // Search by note
      if (tx.note?.toLowerCase().includes(query)) return true;

      // Search by amount
      if (tx.amount.toString().includes(query)) return true;

      // Search by type
      if (tx.type.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [transactions, searchQuery, categories, accounts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
        >
          <Plus size={20} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

      {/* Results info when searching */}
      {searchQuery && (
        <p className="text-sm text-gray-500">
          Found {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} matching "{searchQuery}"
        </p>
      )}

      <TransactionList
        transactions={filteredTransactions}
        accounts={accounts}
        categories={categories}
        onEdit={handleEdit}
        onDelete={deleteTransaction}
      />

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={editingTransaction}
      />
    </div>
  );
}
