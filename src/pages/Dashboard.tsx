import { useMoney } from "../context/MoneyContext";

import { TransactionList } from "../components/Transactions/TransactionList";
import { Wallet, ArrowUp, ArrowDown } from "lucide-react";

export function Dashboard() {
  const { accounts, transactions, categories, buckets } = useMoney();

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Calculate this month's income and expense
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  const income = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Get recent 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 text-white shadow-lg shadow-teal-600/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wallet size={24} />
            </div>
            <span className="font-medium text-teal-50">Total Balance</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            {formatCurrency(totalBalance)}
          </h2>
          <p className="text-teal-100 text-sm mt-2">
            {" "}
            across {accounts.length} accounts
          </p>
        </div>

        {/* Income */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
              <ArrowUp size={24} />
            </div>
            <span className="font-medium text-gray-500">
              Income (This Month)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {formatCurrency(income)}
          </h2>
        </div>

        {/* Expense */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <ArrowDown size={24} />
            </div>
            <span className="font-medium text-gray-500">
              Expense (This Month)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {formatCurrency(expense)}
          </h2>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <TransactionList
          transactions={recentTransactions}
          accounts={accounts}
          categories={categories}
          buckets={buckets}
        />
      </div>
    </div>
  );
}
