import { useState } from "react"
import type { transactions } from "../../../types/types"
import { DollarSign, Calendar, FileText, Tag, ArrowDownCircle, ArrowUpCircle } from "lucide-react"

type TransactionFormProps = {
  userId: string
  onAdd: (transaction: transactions) => void
}

export default function TransactionForm({ userId, onAdd }: TransactionFormProps) {
  const today = new Date().toISOString().split("T")[0]
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(today)
  const [type, setType] = useState<"ingreso" | "egreso">("egreso")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category || !date || !type) return

    const newTransaction: transactions = {
      id: Date.now().toString(),
      user_id: userId,
      amount,
      category,
      description,
      date,
      type,
    }

    onAdd(newTransaction)

    setAmount(0)
    setCategory("")
    setDescription("")
    setDate(today)
    setType("ingreso")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 border rounded-2xl bg-white shadow-md space-y-5"
    >
      <h2 className="text-xl font-bold text-[#2E6F40] text-center">
        Agregar Transacción
      </h2>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto
        </label>
        <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#A0D861]">
          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="number"
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
        <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#A0D861]">
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
        <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#A0D861]">
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
        <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#A0D861]">
          <Calendar className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo
        </label>
        <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#A0D861]">
          {type === "ingreso" ? (
            <ArrowUpCircle className="w-5 h-5 text-green-500 mr-2" />
          ) : (
            <ArrowDownCircle className="w-5 h-5 text-red-500 mr-2" />
          )}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "ingreso" | "egreso")}
            className="flex-1 outline-none text-sm bg-transparent"
          >
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>
      </div>

      {/* Botón */}
      <button
        type="submit"
        className="w-full bg-[#2E6F40] text-white py-2 rounded-lg hover:bg-[#1f4e2a] transition"
      >
        Agregar
      </button>
    </form>
  )
}
