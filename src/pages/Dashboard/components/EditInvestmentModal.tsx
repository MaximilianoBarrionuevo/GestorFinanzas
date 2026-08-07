import { useEffect, useState } from "react"
import type { investmentPurchase, investmentType, newInvestmentPurchase } from "../../../types/types"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, purchase: newInvestmentPurchase) => void
  purchase: investmentPurchase | null
}

const tipos: investmentType[] = ["CEDEAR", "ACCION", "CRYPTO", "BONO", "ETF", "OTRO"]

export default function EditInvestmentModal({ isOpen, onClose, onSave, purchase }: Props) {
  const [form, setForm] = useState<newInvestmentPurchase | null>(null)

  useEffect(() => {
    if (purchase) {
      setForm({
        broker: purchase.broker,
        activo: purchase.activo,
        tipo: purchase.tipo,
        cantidad: purchase.cantidad,
        precioCompra: purchase.precioCompra,
        moneda: purchase.moneda,
        fechaCompra: purchase.fechaCompra,
        comision: purchase.comision,
        exchangeRate: purchase.exchangeRate,
        totalCompra: purchase.totalCompra,
        totalCompraArs: purchase.totalCompraArs,
      })
    }
  }, [purchase])

  if (!isOpen || !purchase || !form) return null

  const update = <K extends keyof newInvestmentPurchase>(key: K, value: newInvestmentPurchase[K]) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    const totalCompra = form.cantidad * form.precioCompra + (form.comision || 0)
    const totalCompraArs = form.moneda === "ARS" ? totalCompra : totalCompra * (form.exchangeRate || 0)

    onSave(purchase.id, { ...form, totalCompra, totalCompraArs })
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#2E6F40] mb-4">Editar compra</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Activo</label>
              <input
                type="text"
                value={form.activo}
                onChange={e => update("activo", e.target.value.toUpperCase())}
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Broker</label>
              <input
                type="text"
                value={form.broker}
                onChange={e => update("broker", e.target.value)}
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={form.tipo}
              onChange={e => update("tipo", e.target.value as investmentType)}
              className="w-full border rounded-lg p-2 mt-1"
            >
              {tipos.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cantidad</label>
              <input
                type="number"
                step="0.00000001"
                value={form.cantidad || ""}
                onChange={e => update("cantidad", Number(e.target.value))}
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio por unidad</label>
              <input
                type="number"
                step="0.00000001"
                value={form.precioCompra || ""}
                onChange={e => update("precioCompra", Number(e.target.value))}
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Moneda</label>
              <select
                value={form.moneda}
                onChange={e => update("moneda", e.target.value as "ARS" | "USD")}
                className="w-full border rounded-lg p-2 mt-1"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                value={form.fechaCompra}
                onChange={e => update("fechaCompra", e.target.value)}
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Comisión</label>
              <input
                type="number"
                step="0.01"
                value={form.comision || ""}
                onChange={e => update("comision", Number(e.target.value))}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            {form.moneda === "USD" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">TCR</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.exchangeRate || ""}
                  onChange={e => update("exchangeRate", Number(e.target.value))}
                  className="w-full border rounded-lg p-2 mt-1"
                  required
                />
              </div>
            )}
          </div>

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