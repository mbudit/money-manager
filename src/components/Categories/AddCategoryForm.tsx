import { useState, useEffect } from "react";
import { useMoney } from "@/context/MoneyContext";
import type { Category } from "@/types";

interface CategoryFormProps {
  onClose: () => void;
  initialData?: Category;
}

export function AddCategoryForm({ onClose, initialData }: CategoryFormProps) {
  const { addCategory, updateCategory } = useMoney();
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<"income" | "expense">(
    initialData?.type || "expense",
  );
  const [color, setColor] = useState(initialData?.color || "#EF4444");

  // Update state if initialData changes (e.g. when opening modal for different category)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setColor(initialData.color);
    }
  }, [initialData]);

  const colors = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#84CC16",
    "#10B981",
    "#06B6D4",
    "#0EA5E9",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#D946EF",
    "#EC4899",
    "#64748B",
    "#9CA3AF",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      await updateCategory(initialData.id, { name, type, color });
    } else {
      await addCategory({ name, type, color });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder="e.g., Groceries"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${type === "expense"
                ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${type === "income"
                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
          >
            Income
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Color
        </label>
        <div className="flex flex-wrap gap-3">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-105"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
        >
          {initialData ? "Update Category" : "Create Category"}
        </button>
      </div>
    </form>
  );
}
