import { useMemo, useState } from "react"
import type { transactions } from "../../../types/types"
import { ArrowDownCircle, ArrowUpCircle, Pencil, Search, Trash2, X } from "lucide-react"
import { formatArs } from "../../../lib/Finance"

type Props = {
  transactions: transactions[]
  onDelete: (transaction: transactions) => void
  onEdit: (transaction: transactions) => void
}

type TypeFilter = "todos" | "ingreso" | "egreso"

const formatFecha = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export default function RecentTransactions({ transactions, onDelete, onEdit }: Props) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos")
  const [categoryFilter, setCategoryFilter] = useState("todas")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const categories = useMemo(
    () => Array.from(new Set(transactions.map(t => t.category))).sort(),
    [transactions]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return transactions.filter(t => {
      if (typeFilter !== "todos" && t.type !== typeFilter) return false
      if (categoryFilter !== "todas" && t.category !== categoryFilter) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      if (term) {
        const haystack = `${t.category} ${t.description ?? ""}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [transactions, search, typeFilter, categoryFilter, dateFrom, dateTo])

  const hasActiveFilters = search || typeFilter !== "todos" || categoryFilter !== "todas" || dateFrom || dateTo

  const clearFilters = () => {
    setSearch("")
    setTypeFilter("todos")
    setCategoryFilter("todas")
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-md p-6 flex flex-col max-h-[34rem]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-[#2E6F40]">Últimos movimientos</h2>
        <span className="text-xs text-slate-400">
          {filtered.length} de {transactions.length}
        </span>
      </div>

      {/* Barra de filtros */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por categoría o descripción..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-lg border border-slate-200 text-xs px-2.5 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="todos">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 text-xs px-2.5 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 max-w-[140px]"
          >
            <option value="todas">Todas las categorías</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 text-xs px-2.5 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            title="Desde"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 text-xs px-2.5 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            title="Hasta"
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg text-xs px-2.5 py-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      <ul className="space-y-3 overflow-y-auto pr-1">
        {filtered.map(t => (
          <li
            key={t.id}
            className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:shadow-md transition"
          >
            <div className="flex items-start space-x-3 min-w-0">
              {t.type === "egreso" ? (
                <ArrowDownCircle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
              ) : (
                <ArrowUpCircle className="w-6 h-6 text-[#2E6F40] mt-0.5 shrink-0" />
              )}

              <div className="min-w-0">
                <span className="font-semibold text-gray-800">{t.category}</span>
                {t.description && (
                  <p className="text-sm text-gray-500 truncate">{t.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div className="text-right">
                <p className={`font-bold ${t.type === "egreso" ? "text-red-600" : "text-[#2E6F40]"}`}>
                  {t.type === "egreso" ? "- " : "+ "}
                  {formatArs(t.amount)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatFecha(t.date)}</p>
              </div>

              <div className="flex flex-col gap-1">
                <button onClick={() => onEdit(t)} className="p-1 rounded hover:bg-gray-200" title="Editar">
                  <Pencil className="w-4 h-4 text-blue-600" />
                </button>
                <button onClick={() => onDelete(t)} className="p-1 rounded hover:bg-gray-200" title="Eliminar">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </li>
        ))}

        {filtered.length === 0 && (
          <li className="text-center text-slate-400 text-sm py-8">
            {transactions.length === 0 ? "Todavía no cargaste movimientos." : "Ningún movimiento coincide con los filtros."}
          </li>
        )}
      </ul>
    </div>
  )
}