import { useEffect, useState } from "react"
import { CreditCard, Pencil, Trash2, X } from "lucide-react"
import type { cardCycleSummary, cardExpense, creditCard, newCreditCard } from "../../../types/types"
import { formatArs } from "../../../lib/Finance"
import ConfirmDeleteModal from "./ConfirmDeleteModal"

type Props = {
  card: creditCard | null
  summary: cardCycleSummary | null
  expenses: cardExpense[]
  onClose: () => void
  onEditCard: (id: string, card: newCreditCard) => Promise<boolean>
  onRemoveCard: (id: string) => Promise<boolean>
  onEditExpense: (expense: cardExpense) => void
  onRemoveExpense: (id: string) => Promise<boolean>
}

const formatFecha = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

type PendingDelete = { type: "card" } | { type: "expense"; id: string; descripcion: string }

export default function CardDetailModal({
  card,
  summary,
  expenses,
  onClose,
  onEditCard,
  onRemoveCard,
  onEditExpense,
  onRemoveExpense,
}: Props) {
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<newCreditCard | null>(null)
  const [editError, setEditError] = useState("")
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  useEffect(() => {
    if (card) {
      setEditForm({
        nombre: card.nombre,
        banco: card.banco,
        cupo: card.cupo,
        diaCierre: card.diaCierre,
        diaVencimiento: card.diaVencimiento,
      })
      setEditMode(false)
      setEditError("")
    }
  }, [card])

  if (!card || !summary || !editForm) return null

  const cupoUsadoPct = card.cupo && card.cupo > 0 ? Math.min(100, (summary.deudaPendiente / card.cupo) * 100) : null

  const updateEditForm = <K extends keyof newCreditCard>(key: K, value: newCreditCard[K]) => {
    setEditForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError("")

    if (!editForm.nombre.trim()) {
      setEditError("Ingresá un nombre para la tarjeta")
      return
    }
    if (!editForm.diaCierre || editForm.diaCierre < 1 || editForm.diaCierre > 28) {
      setEditError("El día de cierre tiene que estar entre 1 y 28")
      return
    }
    if (!editForm.diaVencimiento || editForm.diaVencimiento < 1 || editForm.diaVencimiento > 28) {
      setEditError("El día de vencimiento tiene que estar entre 1 y 28")
      return
    }

    setSaving(true)
    const ok = await onEditCard(card.id, editForm)
    setSaving(false)

    if (ok) setEditMode(false)
  }

  const historial = [...expenses].sort((a, b) => b.fechaCompra.localeCompare(a.fechaCompra))

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 inline-flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> {card.banco || "Tarjeta de crédito"}
              </p>
              <h2 className="text-2xl font-bold text-slate-900">{card.nombre}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Cerrar ficha de la tarjeta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 pt-4 space-y-6">
            {/* Resumen del ciclo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Resumen actual</p>
                <p className="text-sm font-semibold text-slate-800">{formatArs(summary.resumenActual)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Cupo disponible</p>
                <p className="text-sm font-semibold text-slate-800">
                  {summary.cupoDisponible != null ? formatArs(summary.cupoDisponible) : "sin límite"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Cierra</p>
                <p className="text-sm font-semibold text-slate-800">{formatFecha(summary.fechaCierreActual)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Vence</p>
                <p className="text-sm font-semibold text-slate-800">{formatFecha(summary.fechaVencimientoActual)}</p>
              </div>
            </div>

            {cupoUsadoPct != null && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Cupo usado</span>
                  <span>
                    {formatArs(summary.deudaPendiente)} de {formatArs(card.cupo ?? 0)}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cupoUsadoPct >= 90 ? "bg-rose-500" : cupoUsadoPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${cupoUsadoPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cuotas que componen el ciclo actual */}
            {summary.items.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Compone el resumen actual
                </p>
                <ul className="space-y-1.5">
                  {summary.items.map(item => (
                    <li
                      key={`${item.gasto.id}-${item.cuotaNumero}`}
                      className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                    >
                      <span className="text-slate-600">
                        {item.gasto.descripcion}
                        {item.gasto.cuotasTotal > 1 && (
                          <span className="text-slate-400"> · cuota {item.cuotaNumero}/{item.gasto.cuotasTotal}</span>
                        )}
                      </span>
                      <span className="font-medium text-slate-800">{formatArs(item.montoCuota)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Editar / eliminar tarjeta */}
            {editMode ? (
              <form onSubmit={handleSaveCard} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-700">Nombre</label>
                    <input
                      type="text"
                      value={editForm.nombre}
                      onChange={e => updateEditForm("nombre", e.target.value)}
                      className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-700">Banco (opcional)</label>
                    <input
                      type="text"
                      value={editForm.banco ?? ""}
                      onChange={e => updateEditForm("banco", e.target.value || null)}
                      className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-slate-700">Cupo (opcional)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editForm.cupo ?? ""}
                      onChange={e => updateEditForm("cupo", e.target.value ? Number(e.target.value) : null)}
                      className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-700">Día de cierre</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={editForm.diaCierre || ""}
                      onChange={e => updateEditForm("diaCierre", Number(e.target.value))}
                      className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-700">Día de vencimiento</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={editForm.diaVencimiento || ""}
                      onChange={e => updateEditForm("diaVencimiento", Number(e.target.value))}
                      className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                </div>
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-[#2E6F40] text-white hover:bg-[#1f4e2a] text-sm disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar tarjeta
                </button>
                <button
                  onClick={() => setPendingDelete({ type: "card" })}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 border border-rose-200 rounded-lg px-2.5 py-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar tarjeta
                </button>
              </div>
            )}

            {/* Historial completo de gastos */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Gastos ({historial.length})
              </p>
              {historial.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Todavía no cargaste ningún gasto.</p>
              ) : (
                <div className="rounded-2xl border border-slate-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="text-left font-medium px-3 py-2">Fecha</th>
                        <th className="text-left font-medium px-3 py-2">Descripción</th>
                        <th className="text-right font-medium px-3 py-2">Cuotas</th>
                        <th className="text-right font-medium px-3 py-2">Total</th>
                        <th className="text-right font-medium px-3 py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map(gasto => (
                        <tr key={gasto.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatFecha(gasto.fechaCompra)}</td>
                          <td className="px-3 py-2 text-slate-600">{gasto.descripcion}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{gasto.cuotasTotal}</td>
                          <td className="px-3 py-2 text-right text-slate-600 whitespace-nowrap">
                            {formatArs(gasto.montoTotal)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => onEditExpense(gasto)}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"
                                aria-label={`Editar gasto ${gasto.descripcion}`}
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setPendingDelete({ type: "expense", id: gasto.id, descripcion: gasto.descripcion })}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600"
                                aria-label={`Eliminar gasto ${gasto.descripcion}`}
                                title="Eliminar"
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
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return
          if (pendingDelete.type === "card") {
            const ok = await onRemoveCard(card.id)
            if (ok) onClose()
          } else {
            await onRemoveExpense(pendingDelete.id)
          }
          setPendingDelete(null)
        }}
        message={
          pendingDelete?.type === "card"
            ? `¿Eliminar la tarjeta "${card.nombre}"? Se borran también todos sus gastos cargados. Esta acción no se puede deshacer.`
            : pendingDelete
            ? `¿Eliminar el gasto "${pendingDelete.descripcion}"? Esta acción no se puede deshacer.`
            : undefined
        }
      />
    </>
  )
}
