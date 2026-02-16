import { useState, useMemo, useEffect } from "react";
import { Wallet, Utensils, Armchair, CalendarDays } from "lucide-react";
import { useMoney } from "@/context/MoneyContext";
import type { Bucket } from "@/types";

interface AddBucketFormProps {
  onClose: () => void;
  editingBucket?: Bucket;
}

export function AddBucketForm({ onClose, editingBucket }: AddBucketFormProps) {
  const { addBucket, updateBucket, categories, accounts, transactions } =
    useMoney();
  const isEditMode = !!editingBucket;

  // Type: 'standard' | 'meal-tracker' | 'weekend-flex'
  const [bucketType, setBucketType] = useState<
    "standard" | "meal-tracker" | "weekend-flex"
  >("standard");

  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [color, setColor] = useState("#10B981");
  const [period, setPeriod] = useState<Bucket["period"]>("monthly");
  const [constraint, setConstraint] = useState<Bucket["constraint"]>("all");
  const [targetAccountId, setTargetAccountId] = useState<string>("");

  // Populate form when editing
  useEffect(() => {
    if (editingBucket) {
      setName(editingBucket.name);
      setLimit(editingBucket.limit.toString());
      setSelectedCategories(editingBucket.categoryIds || []);
      setColor(editingBucket.color);
      setPeriod(editingBucket.period || "monthly");
      setConstraint(editingBucket.constraint || "all");
      setTargetAccountId(editingBucket.targetAccountId || "");

      // Determine bucket type from properties
      if (editingBucket.isMealTracker) {
        setBucketType("meal-tracker");
      } else if (editingBucket.constraint === "weekends") {
        setBucketType("weekend-flex");
      } else {
        setBucketType("standard");
      }
    }
  }, [editingBucket]);

  // Calculate actual workdays in current month
  const workdayCount = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
    }
    return count;
  }, []);

  const handleTypeChange = (
    type: "standard" | "meal-tracker" | "weekend-flex",
  ) => {
    setBucketType(type);
    if (type === "meal-tracker") {
      if (!isEditMode) setName("Workday Lunch");
      setConstraint("workdays");
      setPeriod("monthly");
      setColor("#F97316"); // Orange
    } else if (type === "weekend-flex") {
      if (!isEditMode) setName("Weekend Fun");
      setConstraint("weekends");
      setPeriod("monthly");
      setColor("#8B5CF6"); // Purple
    } else {
      if (!isEditMode) setName("");
      setConstraint("all");
      setPeriod("monthly");
      setColor("#10B981"); // Teal
    }
  };

  // Compute the current rollover for a meal tracker at its current (old) rate
  const computeCurrentRollover = (): number => {
    if (!editingBucket) return 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const todayStart = new Date(currentYear, currentMonth, currentDay, 0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Check for existing valid snapshot
    if (
      editingBucket.rolloverSnapshot !== undefined &&
      editingBucket.rolloverSnapshotDate
    ) {
      const snapDate = new Date(editingBucket.rolloverSnapshotDate + "T00:00:00");
      if (
        snapDate.getMonth() === currentMonth &&
        snapDate.getFullYear() === currentYear
      ) {
        let wdSinceSnap = 0;
        let spentSinceSnap = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const d = new Date(currentYear, currentMonth, day);
          const dow = d.getDay();
          if (
            dow !== 0 &&
            dow !== 6 &&
            d.getTime() >= snapDate.getTime() &&
            d.getTime() < todayStartTime
          ) {
            wdSinceSnap++;
          }
        }
        spentSinceSnap = transactions
          .filter((t) => {
            const tDate = new Date(t.date);
            return (
              t.type === "expense" &&
              t.bucketId === editingBucket.id &&
              tDate.getMonth() === currentMonth &&
              tDate.getFullYear() === currentYear &&
              tDate.getTime() >= snapDate.getTime() &&
              tDate.getTime() < todayStartTime
            );
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return (
          editingBucket.rolloverSnapshot +
          wdSinceSnap * editingBucket.limit -
          spentSinceSnap
        );
      }
    }

    // No valid snapshot — compute from scratch at current (old) rate
    let workdaysPrior = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6 && d.getTime() < todayStartTime) {
        workdaysPrior++;
      }
    }
    const spentPrior = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "expense" &&
          t.bucketId === editingBucket.id &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear &&
          tDate.getTime() < todayStartTime
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return workdaysPrior * editingBucket.limit - spentPrior;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newLimit = parseFloat(limit) || 0;

    // Determine rollover snapshot values
    let rolloverSnapshotValue = editingBucket?.rolloverSnapshot;
    let rolloverSnapshotDateValue = editingBucket?.rolloverSnapshotDate;

    if (
      isEditMode &&
      editingBucket &&
      bucketType === "meal-tracker" &&
      newLimit !== editingBucket.limit
    ) {
      // Daily limit changed — freeze the current rollover
      rolloverSnapshotValue = computeCurrentRollover();
      const now = new Date();
      rolloverSnapshotDateValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }

    const bucketData = {
      name,
      limit: newLimit,
      categoryIds: selectedCategories,
      color,
      period,
      constraint,
      rollover: editingBucket?.rollover || false,
      isMealTracker: bucketType === "meal-tracker",
      targetAccountId: targetAccountId || undefined,
      ...(rolloverSnapshotValue !== undefined && {
        rolloverSnapshot: rolloverSnapshotValue,
      }),
      ...(rolloverSnapshotDateValue !== undefined && {
        rolloverSnapshotDate: rolloverSnapshotDateValue,
      }),
    };

    if (isEditMode && editingBucket) {
      await updateBucket(editingBucket.id, bucketData);
    } else {
      const now = new Date();
      await addBucket({
        ...bucketData,
        createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      } as any);
    }
    onClose();
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bucket Type Selector - Full Width */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { id: "standard", icon: Wallet, label: "Standard" },
          { id: "meal-tracker", icon: Utensils, label: "Workday Meal" },
          { id: "weekend-flex", icon: Armchair, label: "Weekend Flex" },
        ].map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() =>
              handleTypeChange(
                type.id as "standard" | "meal-tracker" | "weekend-flex",
              )
            }
            className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${bucketType === type.id
              ? "border-teal-500 bg-teal-50 text-teal-700"
              : "border-gray-100 bg-white text-gray-500 hover:bg-gray-50"
              }`}
          >
            <type.icon size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase text-center leading-tight">
              {type.label}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Main Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bucket Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="e.g., Fixed Costs, Groceries"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {bucketType === "meal-tracker"
                ? "Daily Allowance"
                : "Monthly Limit"}
            </label>
            <input
              type="number"
              required
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <select
                value={period}
                disabled={bucketType !== "standard"}
                onChange={(e) => setPeriod(e.target.value as Bucket["period"])}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 ${bucketType !== "standard"
                  ? "bg-gray-100 text-gray-500"
                  : "bg-white"
                  }`}
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Constraint
              </label>
              <select
                value={constraint}
                disabled={bucketType !== "standard"}
                onChange={(e) =>
                  setConstraint(e.target.value as Bucket["constraint"])
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 ${bucketType !== "standard"
                  ? "bg-gray-100 text-gray-500"
                  : "bg-white"
                  }`}
              >
                <option value="all">All Days</option>
                <option value="workdays">Mon-Fri Only</option>
                <option value="weekends">Weekends Only</option>
              </select>
            </div>
          </div>

          {/* Account Link Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to Account (Optional)
            </label>
            <select
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- No Specific Account Linked --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              If linked, the dashboard warning shows if this account has
              insufficient funds.
            </p>
          </div>
        </div>

        {/* Right Column: Context & Categories */}
        <div className="space-y-4 flex flex-col">
          {bucketType === "meal-tracker" && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600 mt-1">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-800">
                    Meal Tracker Logic
                  </h4>
                  <p className="text-xs text-orange-600 mt-1">
                    Auto-calculates daily allowance based on workdays (Mon-Fri).
                  </p>
                  <div className="mt-3 bg-white p-2 rounded border border-orange-200">
                    <p className="text-xs text-gray-500">Preview:</p>
                    <div className="flex justify-between items-center text-sm">
                      <span>
                        {parseFloat(limit) || 0} x {workdayCount} days ={" "}
                      </span>
                      <span className="font-bold text-orange-700">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format((parseFloat(limit) || 0) * workdayCount)}{" "}
                        / mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {bucketType === "weekend-flex" && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <p className="text-xs text-purple-700 flex items-center gap-2">
                <Armchair size={16} />
                Only counts transactions on <strong>Weekends (Sat/Sun)</strong>.
              </p>
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Categories
            </label>
            <div className="flex-1 min-h-[160px] max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {categories
                .filter((c) => c.type === "expense")
                .map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedCategories.includes(cat.id)
                      ? "bg-teal-50 border border-teal-200"
                      : "hover:bg-gray-50"
                      }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${selectedCategories.includes(cat.id)
                        ? "bg-teal-500"
                        : "bg-gray-300"
                        }`}
                    />
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </div>
                ))}
              {categories.filter((c) => c.type === "expense").length === 0 && (
                <p className="text-sm text-gray-400 p-2">
                  No expense categories found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
        >
          {isEditMode ? "Save Changes" : "Create Bucket"}
        </button>
      </div>
    </form>
  );
}
