import { useState } from "react"
import type { transactions } from "../../../types/types"

type Props = {
    transactions: transactions[]
}

export default function CategoryHistoryCard({ transactions }: Props) {
    // Obtener todas las categorías disponibles
    const categories = Array.from(new Set(transactions.map(t => t.category)))

    const [selectedCat, setSelectedCat] = useState<string>(categories[0] || "")

    // Filtrar histórico completo por categoría
    const filtered = transactions.filter(t => t.category === selectedCat)

    const totalIngresos = filtered
        .filter(t => t.type === "ingreso")
        .reduce((a, t) => a + t.amount, 0)

    const totalEgresos = filtered
        .filter(t => t.type === "egreso")
        .reduce((a, t) => a + Math.abs(t.amount), 0)

    const balance = totalIngresos - totalEgresos

    return (
        <div className="bg-white shadow-md rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-[#2D2D2D]">
                    Balance histórico por categoría
                </h2>

                <select
                    value={selectedCat}
                    onChange={e => setSelectedCat(e.target.value)}
                    className="border rounded-md px-2 py-1 text-sm"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-[#F4F5F6] p-3 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Ingresos</p>
                    <p className="text-xl font-bold text-[#2E6F40]">
                        ${totalIngresos.toLocaleString()}
                    </p>
                </div>

                <div className="bg-[#F4F5F6] p-3 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Egresos</p>
                    <p className="text-xl font-bold text-red-600">
                        ${totalEgresos.toLocaleString()}
                    </p>
                </div>

                <div className="bg-[#F4F5F6] p-3 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Balance</p>
                    <p className={`text-xl font-bold ${balance >= 0 ? "text-[#2E6F40]" : "text-red-600"}`}>
                        ${balance.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    )
}
