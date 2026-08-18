import { useEffect, useState } from "react"
import { Landmark } from "lucide-react"
import type { cardExpense, creditCard, newCardExpense } from "../../../types/types"
import { formatArs } from "../../../lib/Finance"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, expense: newCardExpense) => void
  expense: cardExpense | null
  cards: creditCard[]
}

export default function EditCardExpenseModal({ isOpen, onClose, onSave, expense, cards }: Props) {
  const [form, setForm] = useState<newCardExpense | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (expense) {
      setForm({
        tarjetaId: expense.tarjetaId,
        descripcion: expense.descripcion,
        montoTotal: expense.montoTotal,
        cuotasTotal: expense.cuotasTotal,
        fechaCompra: expense.fechaCompra,
      })
      setError("")
    }
  }, [expense])

  if (!isOpen || !expense || !form) return null

  const update = <K extends keyof newCardExpense>(key: K, value: newCardExpense[K]) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  const montoCuota = form.cuotasTotal > 0 ? form.montoTotal / form.cuotasTotal : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.descripcion.trim()) {
      setError("Ingresá una descripción")
      return
    }
    if (!form.montoTotal || form.montoTotal <= 0) {
      setError("Ingresá un monto mayor a cero")
      return
    }
    if (!form.cuotasTotal || form.cuotasTotal < 1) {
      setError("La cantidad de cuotas tiene que ser al menos 1")
      return
    }

    onSave(expense.id, { ...form, descripcion: form.descripcion.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-[#2E6F40] mb-4">Editar gasto</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tarjeta</label>
            <select
              value={form.tarjetaId}
              onChange={e => update("tarjetaId", e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            >
              {cards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.banco ? ` · ${c.banco}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={e => update("descripcion", e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto total</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.montoTotal || ""}
                onChange={e => update("montoTotal", Number(e.target.value))}
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cuotas</label>
              <input
                type="number"
                min={1}
                step="1"
                value={form.cuotasTotal || ""}
                onChange={e => update("cuotasTotal", Math.max(1, Math.round(Number(e.target.value))))}
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de compra</label>
            <input
              type="date"
              value={form.fechaCompra}
              onChange={e => update("fechaCompra", e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
              required
            />
          </div>

          {form.montoTotal > 0 && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center justify-between">
              <p className="text-sm text-slate-500 inline-flex items-center gap-1.5">
                <Landmark className="w-4 h-4" />
                {form.cuotasTotal > 1 ? `${form.cuotasTotal} cuotas de` : "Pago único de"}
              </p>
              <p className="text-sm font-semibold text-slate-800">{formatArs(montoCuota)}</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2E6F40] text-white hover:bg-[#1f4e2a]">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
