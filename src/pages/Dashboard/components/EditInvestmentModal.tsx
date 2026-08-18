import { useEffect, useState } from "react"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import type { investmentOperation, investmentPurchase, investmentType, newInvestmentPurchase } from "../../../types/types"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, purchase: newInvestmentPurchase) => void
  purchase: investmentPurchase | null
}

const tipos: investmentType[] = ["CEDEAR", "ACCION", "CRYPTO", "BONO", "ETF", "OTRO"]

export default function EditInvestmentModal({ isOpen, onClose, onSave, purchase }: Props) {
  const [form, setForm] = useState<newInvestmentPurchase | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (purchase) {
      setForm({
        broker: purchase.broker,
        activo: purchase.activo,
        tipo: purchase.tipo,
        operacion: purchase.operacion,
        cantidad: purchase.cantidad,
        precioCompra: purchase.precioCompra,
        moneda: purchase.moneda,
        fechaCompra: purchase.fechaCompra,
        comision: purchase.comision,
        exchangeRate: purchase.exchangeRate,
        totalCompra: purchase.totalCompra,
        totalCompraArs: purchase.totalCompraArs,
      })
      setError("")
    }
  }, [purchase])

  if (!isOpen || !purchase || !form) return null

  const esVenta = form.operacion === "venta"

  const update = <K extends keyof newInvestmentPurchase>(key: K, value: newInvestmentPurchase[K]) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setError("")

    if (!form.cantidad || form.cantidad <= 0) {
      setError("La cantidad tiene que ser mayor a cero")
      return
    }
    if (!form.precioCompra || form.precioCompra <= 0) {
      setError("El precio por unidad tiene que ser mayor a cero")
      return
    }
    if (form.moneda === "USD" && (!form.exchangeRate || form.exchangeRate <= 0)) {
      setError("Informá la TCR: es obligatoria para operaciones en USD")
      return
    }

    const bruto = form.cantidad * form.precioCompra
    // Igual que al cargar: en una venta la comisión se descuenta de lo recibido, en una compra se suma a lo pagado.
    const totalCompra = esVenta ? Math.max(0, bruto - (form.comision || 0)) : bruto + (form.comision || 0)
    const totalCompraArs = form.moneda === "ARS" ? totalCompra : totalCompra * (form.exchangeRate || 0)

    onSave(purchase.id, { ...form, totalCompra, totalCompraArs })
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#2E6F40] mb-4">{esVenta ? "Editar venta" : "Editar compra"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => update("operacion", "compra" as investmentOperation)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition ${
                !esVenta ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" /> Compra
            </button>
            <button
              type="button"
              onClick={() => update("operacion", "venta" as investmentOperation)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition ${
                esVenta ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" /> Venta
            </button>
          </div>

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
                min={0}
                step="0.00000001"
                value={form.cantidad || ""}
                onChange={e => update("cantidad", Number(e.target.value))}
                className="w-full border rounded-lg p-2 mt-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {esVenta ? "Precio de venta" : "Precio de compra"} por unidad
              </label>
              <input
                type="number"
                min={0}
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
              <label className="block text-sm font-medium text-gray-700">
                Comisión {esVenta && "(se descuenta de lo recibido)"}
              </label>
              <input
                type="number"
                min={0}
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
                  min={0}
                  step="0.01"
                  value={form.exchangeRate || ""}
                  onChange={e => update("exchangeRate", Number(e.target.value))}
                  className="w-full border rounded-lg p-2 mt-1"
                  required
                />
              </div>
            )}
          </div>

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
