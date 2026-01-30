import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Transaction } from "../../types";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
} from "date-fns";

interface MonthlyExpenseChartProps {
  transactions: Transaction[];
  currentDate: Date;
}

export function MonthlyExpenseChart({
  transactions,
  currentDate,
}: MonthlyExpenseChartProps) {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const data = days.map((day) => {
    const dayTransactions = transactions.filter(
      (t) => t.type === "expense" && isSameDay(new Date(t.date), day),
    );
    const amount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, "dd"),
      amount,
    };
  });

  return (
    <div className="h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            interval={2}
          />
          <Tooltip
            cursor={{ fill: "#F3F4F6" }}
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number | undefined) => [
              value !== undefined
                ? new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(value)
                : "Rp 0",
              "Amount",
            ]}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.amount > 0 ? "#EF4444" : "#E5E7EB"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
