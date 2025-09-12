import { useState } from "react"
import type { transactions } from "../../../types/types"

type TransactionFormProps = {
  userId: string
  onAdd: (transaction: transactions) => void
}

export default function TransactionForm({ userId, onAdd }: TransactionFormProps) {
  const today = new Date().toISOString().split("T")[0]
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState("")
  const [date, setDate] = useState(today)
  const [type, setType] = useState<"ingreso" | "egreso">("egreso") // 👈 nuevo state

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category || !date || !type) return

    const newTransaction: transactions = {
      id: Date.now().toString(),
      user_id: userId,
      amount,
      category,
      date,
      type, // 👈 ahora se pasa correctamente
    }

    onAdd(newTransaction)

    setAmount(0)
    setCategory("")
    setDate(today)
    setType("ingreso") // reset por defecto
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded space-y-4 bg-white shadow">
      <h2 className="text-lg font-bold">Agregar Transacción</h2>

      <input
        type="number"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full p-2 border rounded"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full p-2 border rounded"
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

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value as "ingreso" | "egreso")}
        className="w-full p-2 border rounded"
      >
        <option value="ingreso">Ingreso</option>
        <option value="egreso">Egreso</option>
      </select>

      <button type="submit" className="px-4 py-2 bg-[#2E6F40] text-white rounded hover:bg-custom-hover">
        Agregar
      </button>
    </form>
  )
}
