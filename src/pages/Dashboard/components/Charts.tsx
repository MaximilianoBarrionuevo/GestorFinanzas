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
import { ArrowDownRight, ArrowUpRight, BarChart3, PieChart as PieChartIcon } from "lucide-react"
import type { transactions } from "../../../types/types"
import { formatArs } from "../../../lib/Finance"
import { isSameDay, isSameWeek, isSameMonth } from "date-fns"

type Props = {
    transactions: transactions[]
}

const SELECT_CLASS =
    "rounded-lg border border-slate-200 text-xs px-2.5 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"

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
                <div className="rounded-2xl border border-slate-100 bg-white/90 shadow-md p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs md:text-sm text-slate-500">Ingresos</p>
                            <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900">{formatArs(totalIngresos)}</p>
                        </div>
                        <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white/90 shadow-md p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs md:text-sm text-slate-500">Egresos</p>
                            <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900">{formatArs(totalEgresos)}</p>
                        </div>
                        <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                            <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5" />
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-md p-4 md:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h2 className="text-lg font-semibold text-slate-900 inline-flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4 text-emerald-600" /> Gastos por categoría
                        </h2>

                        <div className="flex gap-2">
                            <select
                                className={SELECT_CLASS}
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
                                className={SELECT_CLASS}
                                value={selectedPeriod}
                                onChange={e => setSelectedPeriod(e.target.value as "día" | "semana" | "mes")}
                            >
                                <option value="día">Día</option>
                                <option value="semana">Semana</option>
                                <option value="mes">Mes</option>
                            </select>
                        </div>
                    </div>

                    {dataByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={dataByCategory} dataKey="value" nameKey="name" outerRadius={80} label>
                                    {dataByCategory.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatArs(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-16">No hay gastos para este período.</p>
                    )}
                </div>

                {/* Bar Chart */}
                <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-md p-4 md:p-5">
                    <h2 className="text-lg font-semibold text-slate-900 inline-flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-emerald-600" /> Ingresos vs Egresos
                    </h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={barData}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value: number) => formatArs(value)} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
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
