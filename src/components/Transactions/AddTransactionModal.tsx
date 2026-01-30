import { useState } from "react";
import { useMoney } from "../../context/MoneyContext";
import { Modal } from "../UI/Modal";
import { ArrowDownLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { RecurringTransaction } from "../../types";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "expense" | "income" | "transfer";

export function AddTransactionModal({
  isOpen,
  onClose,
}: AddTransactionModalProps) {
  const {
    accounts,
    categories,
    buckets,
    addTransaction,
    addRecurringTransaction,
  } = useMoney();
  const [activeTab, setActiveTab] = useState<TabType>("expense");

  // Form State
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedBucketId, setSelectedBucketId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [note, setNote] = useState("");

  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] =
    useState<RecurringTransaction["frequency"]>("monthly");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;
    if ((activeTab === "expense" || activeTab === "income") && !categoryId)
      return;
    if (activeTab === "transfer" && !toAccountId) return;

    try {
      if (isRecurring) {
        await addRecurringTransaction({
          amount: parseFloat(amount),
          type: activeTab,
          startDate: date,
          frequency,
          categoryId: activeTab === "transfer" ? undefined : categoryId,
          accountId,
          toAccountId: activeTab === "transfer" ? toAccountId : undefined,
          note,
        });
      } else {
        await addTransaction({
          amount: parseFloat(amount),
          type: activeTab,
          date,
          categoryId: activeTab === "transfer" ? undefined : categoryId,
          accountId,
          toAccountId: activeTab === "transfer" ? toAccountId : undefined,
          note,
        });
      }

      // Reset and close
      setAmount("");
      setNote("");
      setIsRecurring(false);
      onClose();
    } catch (error) {
      console.error("Failed to add transaction:", error);
      alert("Failed to save transaction. Please try again.");
    }
  };

  const filteredCategories = categories.filter((c) => {
    // 1. Must match transaction type (Expense/Income)
    if (c.type !== activeTab) return false;

    // 2. If bucket is selected, category MUST be in that bucket
    if (selectedBucketId) {
      const bucket = buckets.find((b) => b.id === selectedBucketId);
      return bucket?.categoryIds.includes(c.id);
    }

    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction">
      <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab("expense")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "expense"
              ? "bg-white text-red-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ArrowDownLeft size={16} /> Expense
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "income"
              ? "bg-white text-teal-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ArrowUpRight size={16} /> Income
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "transfer"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ArrowRight size={16} /> Transfer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recurring Toggle */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <input
            type="checkbox"
            id="recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
          />
          <label
            htmlFor="recurring"
            className="text-sm font-medium text-gray-700 select-none"
          >
            Repeat this transaction?
          </label>
        </div>

        {isRecurring && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(
                  e.target.value as RecurringTransaction["frequency"],
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}

        {/* Date Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {isRecurring ? "Start Date" : "Date"}
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500 font-medium">
              Rp
            </span>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-lg font-bold text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        {/* Bucket Filter (Optional) */}
        {activeTab === "expense" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Filter by Bucket (Optional)
            </label>
            <select
              value={selectedBucketId}
              onChange={(e) => {
                setSelectedBucketId(e.target.value);
                setCategoryId(""); // Reset category when bucket changes to avoid invalid state
              }}
              className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-blue-800"
            >
              <option value="">-- No Bucket Filter --</option>
              {buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.period})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Categories (Income/Expense Only) */}
        {activeTab !== "transfer" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {selectedBucketId ? "Bucket Category" : "Category"}
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            >
              <option value="">Select Category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Account Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {activeTab === "transfer" ? "From Account" : "Account"}
            </label>
            <select
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            >
              <option value="">Select Account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "transfer" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                To Account
              </label>
              <select
                required
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              >
                <option value="">Select Account</option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            placeholder="Add a note..."
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 mt-4"
        >
          Save Transaction
        </button>
      </form>
    </Modal>
  );
}
