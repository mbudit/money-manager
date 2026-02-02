import {
  Plus,
  Trash2,
  Pencil,
  ArrowRightLeft,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMoney } from "../context/MoneyContext";
import { useState, useMemo, useEffect } from "react";
import { Modal } from "../components/UI/Modal";
import type { Account, TransactionType } from "../types";
import { TransactionList } from "../components/Transactions/TransactionList";

export function Accounts() {
  const { accounts, deleteAccount, transactions, categories, buckets } =
    useMoney();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Transaction View State
  const [viewingTransactionsAccount, setViewingTransactionsAccount] =
    useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset states when closing or changing account
  useEffect(() => {
    if (!viewingTransactionsAccount) {
      setSearchQuery("");
      setFilterType("all");
      setSelectedMonth("");
      setCurrentPage(1);
    }
  }, [viewingTransactionsAccount]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, selectedMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const filteredTransactions = useMemo(() => {
    if (!viewingTransactionsAccount) return [];

    let result = transactions.filter(
      (t) =>
        t.accountId === viewingTransactionsAccount.id ||
        t.toAccountId === viewingTransactionsAccount.id,
    );

    // Apply Type Filter
    if (filterType !== "all") {
      result = result.filter((t) => t.type === filterType);
    }

    // Apply Month Filter
    if (selectedMonth) {
      result = result.filter((t) => t.date.startsWith(selectedMonth));
    }

    // Apply Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((tx) => {
        // Search by category name
        const category = categories.find((c) => c.id === tx.categoryId);
        if (category?.name.toLowerCase().includes(query)) return true;

        // Search by account name (other side of transfer)
        const account = accounts.find((a) => a.id === tx.accountId);
        if (account?.name.toLowerCase().includes(query)) return true;

        if (tx.toAccountId) {
          const toAccount = accounts.find((a) => a.id === tx.toAccountId);
          if (toAccount?.name.toLowerCase().includes(query)) return true;
        }

        // Search by bucket name
        if (tx.bucketId) {
          const bucket = buckets.find((b) => b.id === tx.bucketId);
          if (bucket?.name.toLowerCase().includes(query)) return true;
        }
        if (!tx.bucketId && "no bucket".includes(query)) return true;

        // Search by note
        if (tx.note?.toLowerCase().includes(query)) return true;

        // Search by amount
        if (tx.amount.toString().includes(query)) return true;

        return false;
      });
    }

    return result;
  }, [
    transactions,
    viewingTransactionsAccount,
    filterType,
    searchQuery,
    selectedMonth,
    categories,
    accounts,
    buckets,
  ]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Accounts</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden"
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10"
              style={{ backgroundColor: account.color }}
            />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    {account.type}
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 mt-1">
                    {account.name}
                  </h3>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.name.charAt(0)}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewingTransactionsAccount(account)}
                      className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="View Transactions"
                    >
                      <ArrowRightLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Account"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this account?",
                          )
                        ) {
                          deleteAccount(account.id);
                        }
                      }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm text-gray-400 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(account.balance)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? "Edit Account" : "Add New Account"}
      >
        <AccountForm
          onClose={() => setIsModalOpen(false)}
          initialData={editingAccount || undefined}
        />
      </Modal>

      {/* Transactions Modal */}
      {viewingTransactionsAccount && (
        <Modal
          isOpen={!!viewingTransactionsAccount}
          onClose={() => setViewingTransactionsAccount(null)}
          title={`Transactions - ${viewingTransactionsAccount.name}`}
          maxWidth="max-w-4xl"
        >
          <div className="flex flex-col h-[70vh] -mx-6 px-6">
            {/* Filters Header */}
            <div className="mb-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Type Filters and Month */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2 text-sm overflow-x-auto pb-1 no-scrollbar">
                  {(["all", "income", "expense", "transfer"] as const).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 rounded-full capitalize whitespace-nowrap transition-colors ${
                          filterType === type
                            ? "bg-teal-600 text-white font-medium"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {type}
                      </button>
                    ),
                  )}
                </div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              <TransactionList
                transactions={paginatedTransactions}
                accounts={accounts}
                categories={categories}
                buckets={buckets}
              />
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function AccountForm({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData?: Account;
}) {
  const { addAccount, updateAccount } = useMoney();
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<Account["type"]>(
    initialData?.type || "cash",
  );
  const [balance, setBalance] = useState(
    initialData ? initialData.balance.toString() : "",
  );
  const [color, setColor] = useState(initialData?.color || "#10B981");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accountData = {
      name,
      type,
      balance: parseFloat(balance) || 0,
      color,
    };

    if (initialData) {
      updateAccount(initialData.id, accountData);
    } else {
      addAccount(accountData);
    }
    onClose();
  };

  const colors = [
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#6366F1",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
          placeholder="e.g., Main Wallet"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as Account["type"])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
        >
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="ewallet">E-Wallet</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {initialData ? "Current Balance" : "Initial Balance"}
        </label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Tag
        </label>
        <div className="flex gap-2 flex-wrap">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${
                color === c
                  ? "scale-110 ring-2 ring-offset-2 ring-gray-400"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
        >
          {initialData ? "Save Changes" : "Save Account"}
        </button>
      </div>
    </form>
  );
}
