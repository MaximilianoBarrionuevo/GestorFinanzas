import { useEffect, useMemo, useState } from "react"
import { Landmark, WalletCards, X } from "lucide-react"
import type { investmentPosition, investmentPurchase, newInvestmentPurchase } from "../../../types/types"
import { formatArs, tipoLabel } from "../../../lib/Finance"

type LoadMode = "monto" | "cantidad"

type Props = {
  isOpen: boolean
  onClose: () => void
  positions: investmentPosition[]
  onRegisterSale: (sale: newInvestmentPurchase) => Promise<investmentPurchase | null>
}

const today = new Date().toISOString().split("T")[0]

const defaultForm = {
  positionKey: "",
  loadMode: "monto" as LoadMode,
  montoTotal: 0, // usado en modo "monto": cuánto querés vender, en la moneda de la posición
  cantidad: 0, // usado en modo "cantidad": cuántas unidades vendés
  precioVenta: 0, // precio por unidad al que vendés
  fechaVenta: today,
  comision: 0,
  exchangeRate: 0,
}

/**
 * Modal dedicado para vender parte o toda una posición existente. Separado
 * del formulario de "Registrar una compra" porque el flujo es distinto: acá
 * se elige una posición ya tenida (no se tipea activo/broker a mano) y el
 * resultado es un ingreso de caja, no un egreso.
 */
export default function RegisterSaleModal({ isOpen, onClose, positions, onRegisterSale }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const sellablePositions = useMemo(() => positions.filter(p => p.cantidadTotal > 0), [positions])
  const selectedPosition = useMemo(
    () => sellablePositions.find(p => p.key === form.positionKey) ?? null,
    [sellablePositions, form.positionKey]
  )

  // Reinicia el formulario cada vez que se abre, para no arrastrar datos de la venta anterior.
  useEffect(() => {
    if (isOpen) {
      setForm(defaultForm)
      setError("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const moneda = selectedPosition?.moneda ?? "USD"
  const requiereTcr = moneda === "USD"

  const cantidadCalculada = (() => {
    if (form.loadMode === "cantidad") return form.cantidad
    if (!form.montoTotal || !form.precioVenta) return 0
    return form.montoTotal / form.precioVenta
  })()

  const totalBruto =
    form.loadMode === "monto" ? form.montoTotal || 0 : (form.cantidad || 0) * (form.precioVenta || 0)
  // La comisión se descuenta de lo recibido (al revés que en una compra, donde se suma a lo pagado).
  const totalRecibido = totalBruto ? Math.max(0, totalBruto - (form.comision || 0)) : 0
  const totalRecibidoArs = !totalRecibido
    ? 0
    : moneda === "ARS"
    ? totalRecibido
    : form.exchangeRate
    ? totalRecibido * form.exchangeRate
    : 0

  const updateForm = <K extends keyof typeof defaultForm>(key: K, value: (typeof defaultForm)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSelectPosition = (key: string) => {
    setForm({ ...defaultForm, positionKey: key })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedPosition) {
      setError("Elegí qué posición estás vendiendo")
      return
    }

    const cantidadValida = cantidadCalculada > 0
    const montoBaseValido = form.loadMode === "monto" ? form.montoTotal > 0 : form.cantidad > 0

    if (!montoBaseValido || !form.precioVenta || !form.fechaVenta) {
      setError("Completá todos los campos obligatorios")
      return
    }

    if (!cantidadValida) {
      setError("Revisá el monto y el precio: la cantidad calculada tiene que ser mayor a cero")
      return
    }

    if (cantidadCalculada > selectedPosition.cantidadTotal) {
      setError(
        `No podés vender más de lo que tenés: ${selectedPosition.cantidadTotal.toLocaleString("es-AR", {
          maximumFractionDigits: 8,
        })} unidades disponibles`
      )
      return
    }

    if (requiereTcr && (!form.exchangeRate || form.exchangeRate <= 0)) {
      setError("Esta posición está en USD: informá la TCR para registrar bien el ingreso en ARS")
      return
    }

    const sale: newInvestmentPurchase = {
      broker: selectedPosition.broker,
      activo: selectedPosition.activo,
      tipo: selectedPosition.tipo,
      operacion: "venta",
      cantidad: cantidadCalculada,
      precioCompra: form.precioVenta,
      moneda,
      fechaCompra: form.fechaVenta,
      comision: form.comision || 0,
      exchangeRate: requiereTcr ? form.exchangeRate : null,
      totalCompra: totalRecibido,
      totalCompraArs: totalRecibidoArs,
    }

    setSaving(true)
    const registered = await onRegisterSale(sale)
    setSaving(false)

    if (!registered) {
      setError("No se pudo registrar la venta")
      return
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-rose-700">Registrar venta</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Cerrar formulario de venta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Qué vendés */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">¿Qué vendés?</p>
            {sellablePositions.length === 0 ? (
              <p className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                Todavía no tenés ninguna posición con saldo para vender.
              </p>
            ) : (
              <select
                value={form.positionKey}
                onChange={e => handleSelectPosition(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option value="">Elegí una posición</option>
                {sellablePositions.map(p => (
                  <option key={p.key} value={p.key}>
                    {p.activo} · {tipoLabel[p.tipo]} · {p.broker} —{" "}
                    {p.cantidadTotal.toLocaleString("es-AR", { maximumFractionDigits: 8 })} disponibles
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedPosition && (
            <>
              {/* Cuánto */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">¿Cuánto vendés?</p>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => updateForm("loadMode", "monto")}
                      className={`px-3 py-1.5 font-medium transition ${
                        form.loadMode === "monto" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      Por monto
                    </button>
                    <button
                      type="button"
                      onClick={() => updateForm("loadMode", "cantidad")}
                      className={`px-3 py-1.5 font-medium transition ${
                        form.loadMode === "cantidad" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      Por cantidad
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {form.loadMode === "monto" ? (
                    <div>
                      <label className="text-sm text-slate-700">Vendés ({moneda})</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.montoTotal || ""}
                        onChange={e => updateForm("montoTotal", Number(e.target.value))}
                        className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        placeholder={moneda === "USD" ? "200" : "300000"}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm text-slate-700">Cantidad a vender</label>
                      <input
                        type="number"
                        min={0}
                        max={selectedPosition.cantidadTotal}
                        step="0.00000001"
                        value={form.cantidad || ""}
                        onChange={e => updateForm("cantidad", Number(e.target.value))}
                        className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        placeholder="0.5"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-slate-700">Precio de venta ({moneda}/u.)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.00000001"
                      value={form.precioVenta || ""}
                      onChange={e => updateForm("precioVenta", Number(e.target.value))}
                      className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200"
                      placeholder="100"
                    />
                  </div>
                </div>

                <p
                  className={`text-xs mt-2 ${
                    cantidadCalculada > selectedPosition.cantidadTotal ? "text-rose-600" : "text-slate-500"
                  }`}
                >
                  Disponés de{" "}
                  <span className="font-semibold">
                    {selectedPosition.cantidadTotal.toLocaleString("es-AR", { maximumFractionDigits: 8 })}
                  </span>{" "}
                  unidades de {selectedPosition.activo}
                  {form.loadMode === "monto" && form.montoTotal > 0 && form.precioVenta > 0 && (
                    <>
                      {" "}
                      · eso son{" "}
                      <span className="font-semibold">
                        {cantidadCalculada.toLocaleString("es-AR", { maximumFractionDigits: 8 })}
                      </span>{" "}
                      unidades
                      {cantidadCalculada > selectedPosition.cantidadTotal && " — más de lo que tenés disponible"}
                    </>
                  )}
                  .
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-700">Fecha</label>
                  <input
                    type="date"
                    value={form.fechaVenta}
                    onChange={e => updateForm("fechaVenta", e.target.value)}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-700">Comisión (se descuenta de lo recibido)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.comision || ""}
                    onChange={e => updateForm("comision", Number(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {requiereTcr && (
                <div>
                  <label className="text-sm text-slate-700">TCR (tipo de cambio) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.exchangeRate || ""}
                    onChange={e => updateForm("exchangeRate", Number(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="1300"
                  />
                </div>
              )}

              {/* Resumen en vivo */}
              <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 flex items-center justify-between">
                <p className="text-sm text-rose-700 inline-flex items-center gap-2">
                  <Landmark className="w-4 h-4" /> Total recibido
                </p>
                <p className="text-lg font-semibold text-rose-900">
                  {moneda} {totalRecibido.toLocaleString("es-AR")}
                  {moneda === "USD" && ` · ${formatArs(totalRecibidoArs)}`}
                </p>
              </div>
            </>
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
              disabled={saving || !selectedPosition}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-medium inline-flex items-center justify-center gap-2 hover:bg-rose-700 transition disabled:opacity-60"
            >
              <WalletCards className="w-4 h-4" />
              {saving ? "Guardando..." : "Registrar venta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
