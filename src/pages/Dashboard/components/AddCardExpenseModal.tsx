import { useEffect, useState } from "react"
import { Landmark, ShoppingBag, X } from "lucide-react"
import type { cardExpense, creditCard, newCardExpense } from "../../../types/types"
import { formatArs } from "../../../lib/Finance"

type Props = {
  isOpen: boolean
  onClose: () => void
  cards: creditCard[]
  defaultCardId?: string | null
  onAdd: (expense: newCardExpense) => Promise<cardExpense | null>
}

const today = new Date().toISOString().split("T")[0]

const defaultForm = {
  tarjetaId: "",
  descripcion: "",
  montoTotal: 0,
  cuotasTotal: 1,
  fechaCompra: today,
}

export default function AddCardExpenseModal({ isOpen, onClose, cards, defaultCardId, onAdd }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setForm({ ...defaultForm, tarjetaId: defaultCardId ?? cards[0]?.id ?? "" })
      setError("")
    }
  }, [isOpen, defaultCardId, cards])

  if (!isOpen) return null

  const update = <K extends keyof typeof defaultForm>(key: K, value: (typeof defaultForm)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const montoCuota = form.cuotasTotal > 0 ? form.montoTotal / form.cuotasTotal : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.tarjetaId) {
      setError("Elegí con qué tarjeta fue el gasto")
      return
    }
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
    if (!form.fechaCompra) {
      setError("Ingresá la fecha de compra")
      return
    }

    const expense: newCardExpense = {
      tarjetaId: form.tarjetaId,
      descripcion: form.descripcion.trim(),
      montoTotal: form.montoTotal,
      cuotasTotal: form.cuotasTotal,
      fechaCompra: form.fechaCompra,
    }

    setSaving(true)
    const registered = await onAdd(expense)
    setSaving(false)

    if (!registered) {
      setError("No se pudo registrar el gasto")
      return
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#2E6F40] inline-flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Registrar gasto
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Cerrar formulario de gasto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cards.length === 0 ? (
          <p className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            Primero agregá una tarjeta.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarjeta</label>
              <select
                value={form.tarjetaId}
                onChange={e => update("tarjetaId", e.target.value)}
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                value={form.descripcion}
                onChange={e => update("descripcion", e.target.value)}
                placeholder="Ej: Compra en MercadoLibre"
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto total</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.montoTotal || ""}
                  onChange={e => update("montoTotal", Number(e.target.value))}
                  placeholder="30000"
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuotas</label>
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={form.cuotasTotal || ""}
                  onChange={e => update("cuotasTotal", Math.max(1, Math.round(Number(e.target.value))))}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de compra</label>
              <input
                type="date"
                value={form.fechaCompra}
                onChange={e => update("fechaCompra", e.target.value)}
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#2E6F40] text-white hover:bg-[#1f4e2a] disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Registrar gasto"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
