import { Plus, Trash2, Pencil } from "lucide-react";
import { useMoney } from "../context/MoneyContext";
import { useState } from "react";
import { Modal } from "../components/UI/Modal";
import type { Account } from "../types";

export function Accounts() {
  const { accounts, deleteAccount } = useMoney();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

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
