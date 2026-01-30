import { useState } from "react";
import { Plus } from "lucide-react";
import { useMoney } from "@/context/MoneyContext";
import { Modal } from "@/components/UI/Modal";
import { AddCategoryForm } from "@/components/Categories/AddCategoryForm";
import { CategoryColumn } from "@/components/Categories/CategoryColumn";
import type { Category } from "@/types";

export function Categories() {
  const { categories, addCategory, deleteCategory } = useMoney();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group by type
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const seedDefaults = async () => {
    if (
      !confirm(
        "Add default categories? This will add common categories to your list.",
      )
    )
      return;

    const defaults: Omit<Category, "id">[] = [
      // Expense
      { name: "Food & Dining", type: "expense", color: "#EF4444" },
      { name: "Transportation", type: "expense", color: "#F59E0B" },
      { name: "Housing", type: "expense", color: "#3B82F6" },
      { name: "Utilities", type: "expense", color: "#6366F1" },
      { name: "Health & Fitness", type: "expense", color: "#10B981" },
      { name: "Entertainment", type: "expense", color: "#8B5CF6" },
      { name: "Shopping", type: "expense", color: "#EC4899" },
      { name: "Education", type: "expense", color: "#14B8A6" },
      // Income
      { name: "Salary", type: "income", color: "#3B82F6" },
      { name: "Freelance", type: "income", color: "#8B5CF6" },
      { name: "Investments", type: "income", color: "#10B981" },
      { name: "Gifts", type: "income", color: "#F59E0B" },
    ];

    // Simple promise all to add them one by one (Firestore batch would be better but context manages singular adds)
    // Actually Context addCategory is singular. We can iterate.
    for (const cat of defaults) {
      // Optional: check if name exists to prevent duplicates?
      // For now, just add.
      await addCategory(cat);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
        <div className="flex gap-2">
          <button
            onClick={seedDefaults}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Add Defaults
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Expense Column */}
        <CategoryColumn
          title="Expense"
          categories={expenseCategories}
          onDelete={deleteCategory}
          iconBgClass="bg-red-100"
          iconColorClass="text-red-600"
          emptyMessage="No expense categories."
        />

        {/* Income Column */}
        <CategoryColumn
          title="Income"
          categories={incomeCategories}
          onDelete={deleteCategory}
          iconBgClass="bg-blue-100"
          iconColorClass="text-blue-600"
          emptyMessage="No income categories."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Category"
      >
        <AddCategoryForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
