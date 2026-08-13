import { useEffect, useState } from "react"
import { History } from "lucide-react"
import type { transactions } from "../../../types/types"
import { formatArs } from "../../../lib/Finance"

type Props = {
    transactions: transactions[]
}

export default function CategoryHistoryCard({ transactions }: Props) {
    // Obtener todas las categorías disponibles
    const categories = Array.from(new Set(transactions.map(t => t.category))).sort()

    const [selectedCat, setSelectedCat] = useState<string>("")

    // Si la categoría seleccionada ya no existe (o todavía no había ninguna
    // cuando se montó el componente), sincronizarla con la primera disponible.
    useEffect(() => {
        if (categories.length > 0 && !categories.includes(selectedCat)) {
            setSelectedCat(categories[0])
        }
    }, [categories, selectedCat])

    // Filtrar histórico completo por categoría
    const filtered = transactions.filter(t => t.category === selectedCat)

    const totalIngresos = filtered
        .filter(t => t.type === "ingreso")
        .reduce((a, t) => a + t.amount, 0)

    const totalEgresos = filtered
        .filter(t => t.type === "egreso")
        .reduce((a, t) => a + Math.abs(t.amount), 0)

    const balance = totalIngresos - totalEgresos

    if (categories.length === 0) {
        return (
            <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-slate-900 inline-flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" /> Balance histórico por categoría
                </h2>
                <p className="text-sm text-slate-400 text-center py-6">
                    Todavía no hay movimientos para agrupar por categoría.
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-md p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-semibold text-slate-900 inline-flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" /> Balance histórico por categoría
                </h2>

                <select
                    value={selectedCat}
                    onChange={e => setSelectedCat(e.target.value)}
                    className="rounded-lg border border-slate-200 text-xs px-2.5 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                    <p className="text-xs text-slate-500">Ingresos</p>
                    <p className="text-lg font-bold text-[#2E6F40] mt-0.5">{formatArs(totalIngresos)}</p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                    <p className="text-xs text-slate-500">Egresos</p>
                    <p className="text-lg font-bold text-red-600 mt-0.5">{formatArs(totalEgresos)}</p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className={`text-lg font-bold mt-0.5 ${balance >= 0 ? "text-[#2E6F40]" : "text-red-600"}`}>
                        {balance >= 0 ? formatArs(balance) : `-${formatArs(Math.abs(balance))}`}
                    </p>
                </div>
            </div>
        </div>
    )
}
