import { Trash2, Tag, Pencil } from "lucide-react";
import type { Category } from "@/types";

interface CategoryColumnProps {
  title: string;
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (category: Category) => void;
  iconBgClass: string;
  iconColorClass: string;
  emptyMessage: string;
}

export function CategoryColumn({
  title,
  categories,
  onDelete,
  onEdit,
  iconBgClass,
  iconColorClass,
  emptyMessage,
}: CategoryColumnProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBgClass} ${iconColorClass}`}
        >
          <Tag size={16} />
        </div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        <span className="ml-auto text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {categories.length}
        </span>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm font-medium text-gray-700">
                {cat.name}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(cat)}
                className="p-1 text-gray-400 hover:text-teal-500 rounded-md hover:bg-teal-50"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete category "${cat.name}"?`)) onDelete(cat.id);
                }}
                className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 italic">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
