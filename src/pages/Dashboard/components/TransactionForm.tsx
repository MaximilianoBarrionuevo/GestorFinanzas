import { useState } from "react"
import type { transactions } from "../../../types/types"
import { DollarSign, Calendar, FileText, Tag, ArrowDownCircle, ArrowUpCircle } from "lucide-react"

type NewTransaction = Omit<transactions, "id" | "user_id">

type TransactionFormProps = {
  onAdd: (transaction: NewTransaction) => void | Promise<void>
}

export default function TransactionForm({ onAdd }: TransactionFormProps) {
  const today = new Date().toISOString().split("T")[0]
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(today)
  const [type, setType] = useState<"ingreso" | "egreso">("egreso")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!category || !date) {
      setError("Completá la categoría y la fecha")
      return
    }

    if (!amount || amount <= 0) {
      setError("Ingresá un monto mayor a cero")
      return
    }

    setSaving(true)
    await onAdd({ amount, category, description, date, type })
    setSaving(false)

    setAmount(0)
    setCategory("")
    setDescription("")
    setDate(today)
    setType("egreso")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 border border-slate-100 rounded-2xl bg-white/90 backdrop-blur-sm shadow-md space-y-5"
    >
      <h2 className="text-xl font-bold text-[#2E6F40] text-center">
        Agregar transacción
      </h2>

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setType("egreso")}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition ${
              type === "egreso" ? "bg-rose-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" /> Egreso
          </button>
          <button
            type="button"
            onClick={() => setType("ingreso")}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition ${
              type === "ingreso" ? "bg-[#2E6F40] text-white" : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" /> Ingreso
          </button>
        </div>
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-200">
          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Ej: 5000"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="flex-1 outline-none text-sm"
          />
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categoría
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-200">
          <Tag className="w-5 h-5 text-gray-400 mr-2" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent"
          >
            <option value="">Seleccionar categoría</option>
            <option value="Sueldo">Sueldo</option>
            <option value="Gimnasio">Gimnasio</option>
            <option value="Comida">Comida</option>
            <option value="Casino">Casino</option>
            <option value="Varios">Varios</option>
            <option value="Indumentaria">Indumentaria</option>
            <option value="Almacén">Almacén</option>
            <option value="Transporte">Transporte</option>
            <option value="Servicios">Servicios</option>
            <option value="Entretenimiento">Entretenimiento</option>
            <option value="Ahorro/Inversión">Ahorro/Inversión</option>
          </select>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-200">
          <FileText className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Ej: Pago de luz"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
        </div>
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-200">
          <Calendar className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {/* Botón */}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#2E6F40] text-white py-2.5 rounded-xl hover:bg-[#1f4e2a] transition font-medium disabled:opacity-60"
      >
        {saving ? "Agregando..." : "Agregar"}
      </button>
    </form>
  )
}
