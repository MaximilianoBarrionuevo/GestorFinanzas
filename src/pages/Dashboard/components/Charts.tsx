import { useState } from "react"
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
import type { transactions } from "../../../types/types"
import { isSameDay, isSameWeek, isSameMonth } from "date-fns"

type Props = {
    transactions: transactions[]
}

export default function Charts({ transactions }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<string>("Todas")
    const [selectedPeriod, setSelectedPeriod] = useState<"día" | "semana" | "mes">("mes")

    const now = new Date()
    const filteredTransactions = transactions.filter(t => {
        const [year, month, day] = t.date.split("-").map(Number)
        const tDate = new Date(year, month - 1, day)

        switch (selectedPeriod) {
            case "día":
                return isSameDay(tDate, now)
            case "semana":
                return isSameWeek(tDate, now, { weekStartsOn: 1 })
            case "mes":
                return isSameMonth(tDate, now)
        }
    })

    // 👉 Filtrar ingresos y egresos
    const incomes = filteredTransactions.filter(t => t.type === "ingreso")
    const expenses = filteredTransactions.filter(t => t.type === "egreso")

    const groupedExpenses = expenses.reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount)
        return acc
    }, {})

    let dataByCategory = Object.entries(groupedExpenses).map(([name, value]) => ({
        name,
        value,
    }))
    if (selectedCategory !== "Todas") {
        dataByCategory = dataByCategory.filter(d => d.name === selectedCategory)
    }

    let barData
    let totalIngresos = 0
    let totalEgresos = 0

    if (selectedCategory === "Todas") {
        totalIngresos = incomes.reduce((a, t) => a + t.amount, 0)
        totalEgresos = expenses.reduce((a, t) => a + Math.abs(t.amount), 0)
        barData = [
            { name: "Ingresos", value: totalIngresos },
            { name: "Egresos", value: totalEgresos },
        ]
    } else {
        totalIngresos = incomes
            .filter(t => t.category === selectedCategory)
            .reduce((a, t) => a + t.amount, 0)
        totalEgresos = groupedExpenses[selectedCategory] || 0
        barData = [
            { name: `Ingresos (${selectedCategory})`, value: totalIngresos },
            { name: `Egresos (${selectedCategory})`, value: totalEgresos },
        ]
    }

    const COLORS = ["#2E6F40", "#A0D861", "#47cc6a", "#6CB979"]

    return (
        <div className="space-y-6">
            {/* Resumen rápido */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                    <p className="text-sm text-gray-500">Ingresos</p>
                    <p className="text-xl font-bold text-[#2E6F40]">
                        ${totalIngresos.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                    <p className="text-sm text-gray-500">Egresos</p>
                    <p className="text-xl font-bold text-red-600">
                        ${totalEgresos.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-[#F4F5F6] rounded-2xl shadow-md p-4 flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-2">
                        <h2 className="text-lg font-semibold text-[#2D2D2D]">Gastos por categoría</h2>

                        <div className="flex gap-2">
                            <select
                                className="border rounded-md px-2 py-1 text-sm"
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                            >
                                <option value="Todas">Todas</option>
                                {Object.keys(groupedExpenses).map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="border rounded-md px-2 py-1 text-sm"
                                value={selectedPeriod}
                                onChange={e => setSelectedPeriod(e.target.value as "día" | "semana" | "mes")}
                            >
                                <option value="día">Día</option>
                                <option value="semana">Semana</option>
                                <option value="mes">Mes</option>
                            </select>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={dataByCategory}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={80}
                                label
                            >
                                {dataByCategory.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="bg-[#F4F5F6] rounded-2xl shadow-md p-4 flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-2 text-[#2D2D2D]">Ingresos vs Egresos</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={barData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="value">
                                {barData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.name.includes("Ingresos") ? "#2E6F40" : "#E63946"}
                                    />
                                ))}
                            </Bar>
                            <Legend />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
