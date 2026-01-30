import { useState } from "react";
import { Plus } from "lucide-react";
import { useMoney } from "../context/MoneyContext";
import { TransactionList } from "../components/Transactions/TransactionList";
import { AddTransactionModal } from "../components/Transactions/AddTransactionModal";

export function Transactions() {
  const { transactions, accounts, categories, deleteTransaction } = useMoney();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sort transactions by date descending
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

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

      <TransactionList
        transactions={sortedTransactions}
        accounts={accounts}
        categories={categories}
        onDelete={deleteTransaction}
      />

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
