import { useState, useEffect } from "react"
import type { transactions } from "../../../types/types"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updatedData: Partial<transactions>) => void
  transaction: transactions | null
}

export default function EditTransactionModal({ isOpen, onClose, onSave, transaction }: Props) {
  const [formData, setFormData] = useState<Partial<transactions>>({})

  useEffect(() => {
    if (transaction) {
      setFormData({
        category: transaction.category,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        description: transaction.description,
      })
    }
  }, [transaction])

  if (!isOpen || !transaction) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === "amount" ? Number(value) : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(transaction.id, formData)
    onClose()
  }

  return (
   <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-[#2E6F40] mb-4">Editar transacción</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <input
              type="text"
              name="category"
              value={formData.category || ""}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Monto</label>
            <input
              type="number"
              name="amount"
              value={formData.amount || ""}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              name="type"
              value={formData.type || ""}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
              required
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              name="date"
              value={formData.date || ""}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <input
              type="text"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2E6F40] text-white hover:bg-[#1f4e2a]"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
