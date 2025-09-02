import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { transactions } from "../../../types/types"

type Props = {
    transactions: transactions[]
}

export default function Charts({ transactions }: Props) {
    // 👉 Mock: agrupar por categoría solo egresos
    const expenses = transactions.filter(t => t.type === "egreso");

    const dataByCategory: { name: string; value: number }[] = Object.entries(
        expenses.reduce((acc: Record<string, number>, t) => {
            acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    const barData = [
        {
            name: "Ingresos",
            value: transactions.filter(t => t.type === "ingreso").reduce((a, t) => a + t.amount, 0),
        },
        {
            name: "Egresos",
            value: transactions.filter(t => t.type === "egreso").reduce((a, t) => a + Math.abs(t.amount), 0),
        },
    ];


    const COLORS = ["#2E6F40", "#A0D861", "#47cc6a", "#6CB979"];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#F4F5F6] rounded-2xl shadow-md p-4">
                <h2 className="text-lg font-semibold mb-2 text-[#2D2D2D]">Gastos por categoría</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie data={dataByCategory} dataKey="value" nameKey="name" outerRadius={80} label>
                            {dataByCategory.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Bar chart */}
            <div className="bg-[#F4F5F6] rounded-2xl shadow-md p-4">
                <h2 className="text-lg font-semibold mb-2 text-[#2D2D2D]">Ingresos vs Egresos</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#A0D861" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
