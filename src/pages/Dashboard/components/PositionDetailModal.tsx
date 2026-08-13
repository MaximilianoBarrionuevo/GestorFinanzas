import { useEffect, useState } from "react"
import { X, Pencil, Trash2, TrendingUp, TrendingDown, RefreshCw, Landmark } from "lucide-react"
import type { investmentPosition, investmentPurchase } from "../../../types/types"
import { formatArs, formatSigned, tipoLabel } from "../../../lib/Finance"
import ConfirmDeleteModal from "./ConfirmDeleteModal"

type Props = {
  position: investmentPosition | null
  onClose: () => void
  onUpdateValue: (purchaseIds: string[], precioActual: number, tipoCambioActual: number | null) => Promise<boolean>
  onEditPurchase: (purchase: investmentPurchase) => void
  onRemovePurchase: (id: string) => Promise<boolean>
}

/**
 * "Ficha completa" de una posición consolidada: resumen de costo/valor/ganancia,
 * formulario para actualizar el precio de mercado (se aplica a todas las compras
 * de la posición) y el detalle de cada compra individual con edición/borrado.
 */
export default function PositionDetailModal({
  position,
  onClose,
  onUpdateValue,
  onEditPurchase,
  onRemovePurchase,
}: Props) {
  const [precioActual, setPrecioActual] = useState(0)
  const [tipoCambioActual, setTipoCambioActual] = useState(0)
  const [savingValue, setSavingValue] = useState(false)
  const [valueError, setValueError] = useState("")
  const [purchaseToDelete, setPurchaseToDelete] = useState<investmentPurchase | null>(null)

  useEffect(() => {
    if (position) {
      setPrecioActual(position.precioActual ?? 0)
      setTipoCambioActual(position.tipoCambioActual ?? 0)
      setValueError("")
    }
  }, [position])

  if (!position) return null

  const requiereTcr = position.moneda === "USD"
  const ganancia = position.gananciaArs

  const handleUpdateValue = async (e: React.FormEvent) => {
    e.preventDefault()
    setValueError("")

    if (!precioActual || precioActual <= 0) {
      setValueError("Ingresá un precio actual válido")
      return
    }

    if (requiereTcr && (!tipoCambioActual || tipoCambioActual <= 0)) {
      setValueError("Esta posición está en USD: informá la TCR actual")
      return
    }

    setSavingValue(true)
    const ok = await onUpdateValue(
      position.compras.map(c => c.id),
      precioActual,
      requiereTcr ? tipoCambioActual : null
    )
    setSavingValue(false)

    if (!ok) setValueError("No se pudo actualizar el valor")
  }

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {tipoLabel[position.tipo]} · {position.broker}
              </p>
              <h2 className="text-2xl font-bold text-slate-900">{position.activo}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Cerrar ficha de la posición"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 pt-4 space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Cantidad</p>
                <p className="text-sm font-semibold text-slate-800">
                  {position.cantidadTotal.toLocaleString("es-AR", { maximumFractionDigits: 8 })}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Costo total</p>
                <p className="text-sm font-semibold text-slate-800">{formatArs(position.costoTotalArs)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Costo promedio / u.</p>
                <p className="text-sm font-semibold text-slate-800">{formatArs(position.costoPromedioUnidad)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Valor actual</p>
                <p className="text-sm font-semibold text-slate-800">
                  {position.valorActualArs != null ? formatArs(position.valorActualArs) : "sin cargar"}
                </p>
              </div>
            </div>

            {ganancia != null && (
              <div
                className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-2 ${
                  ganancia >= 0
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-rose-50 border-rose-100 text-rose-700"
                }`}
              >
                <p className="text-sm font-medium inline-flex items-center gap-2">
                  {ganancia >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  Ganancia / pérdida no realizada
                </p>
                <p className="text-lg font-bold">
                  {formatSigned(ganancia)} {position.gananciaPct != null && `(${position.gananciaPct.toFixed(1)}%)`}
                </p>
              </div>
            )}

            {/* Actualizar valor de mercado */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-sm font-semibold text-slate-700 mb-3 inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" /> Actualizar valor de mercado
              </p>
              <form onSubmit={handleUpdateValue} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-sm text-slate-700">Precio actual ({position.moneda}/u.)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.00000001"
                    value={precioActual || ""}
                    onChange={e => setPrecioActual(Number(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                {requiereTcr && (
                  <div>
                    <label className="text-sm text-slate-700">TCR actual</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={tipoCambioActual || ""}
                      onChange={e => setTipoCambioActual(Number(e.target.value))}
                      className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingValue}
                  className="h-11 rounded-xl bg-[#2E6F40] text-white font-medium hover:bg-[#1f4e2a] transition disabled:opacity-60"
                >
                  {savingValue ? "Actualizando..." : "Actualizar"}
                </button>
              </form>
              {valueError && <p className="text-sm text-red-600 mt-2">{valueError}</p>}
              {position.actualizadoAt && (
                <p className="text-xs text-slate-400 mt-2">
                  Última actualización: {new Date(position.actualizadoAt).toLocaleString("es-AR")}
                </p>
              )}
            </div>

            {/* Detalle de compras */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 inline-flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" /> Compras ({position.compras.length})
              </p>
              <div className="rounded-2xl border border-slate-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Fecha</th>
                      <th className="text-right font-medium px-3 py-2">Cantidad</th>
                      <th className="text-right font-medium px-3 py-2">Precio u.</th>
                      <th className="text-right font-medium px-3 py-2">Total</th>
                      <th className="text-right font-medium px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {position.compras.map(compra => (
                      <tr key={compra.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{compra.fechaCompra}</td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {compra.cantidad.toLocaleString("es-AR", { maximumFractionDigits: 8 })}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600 whitespace-nowrap">
                          {compra.moneda} {compra.precioCompra.toLocaleString("es-AR")}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600 whitespace-nowrap">
                          {formatArs(compra.totalCompraArs)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditPurchase(compra)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"
                              aria-label={`Editar compra del ${compra.fechaCompra}`}
                              title="Editar compra"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPurchaseToDelete(compra)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600"
                              aria-label={`Eliminar compra del ${compra.fechaCompra}`}
                              title="Eliminar compra"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={purchaseToDelete !== null}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={async () => {
          if (purchaseToDelete) await onRemovePurchase(purchaseToDelete.id)
          setPurchaseToDelete(null)
        }}
        message={
          purchaseToDelete
            ? `¿Eliminar la compra del ${purchaseToDelete.fechaCompra} (${purchaseToDelete.cantidad.toLocaleString("es-AR", { maximumFractionDigits: 8 })} u.)? Esta acción no se puede deshacer.`
            : undefined
        }
      />
    </>
  )
}
