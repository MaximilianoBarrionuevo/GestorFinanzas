import { useState } from "react"
import { CheckCircle2, ChevronRight, CreditCard, Plus, ShoppingBag, X } from "lucide-react"
import type { cardCycleSummary, cardExpense, creditCard as creditCardType, newCardExpense, newCreditCard } from "../../../types/types"
import { formatArs } from "../../../lib/Finance"
import AddCardExpenseModal from "./AddCardExpenseModal"
import CardDetailModal from "./CardDetailModal"
import EditCardExpenseModal from "./EditCardExpenseModal"

type Props = {
  cards: creditCardType[]
  expenses: cardExpense[]
  cycleSummaries: Map<string, cardCycleSummary>
  loading: boolean
  onAddCard: (card: newCreditCard) => Promise<creditCardType | null>
  onEditCard: (id: string, card: newCreditCard) => Promise<boolean>
  onRemoveCard: (id: string) => Promise<boolean>
  onAddExpense: (expense: newCardExpense) => Promise<cardExpense | null>
  onEditExpense: (id: string, expense: newCardExpense) => Promise<boolean>
  onRemoveExpense: (id: string) => Promise<boolean>
  onPayCycle: (card: creditCardType, summary: cardCycleSummary) => Promise<void>
}

const formatFecha = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

const defaultCardForm = {
  nombre: "",
  banco: "",
  cupo: 0,
  diaCierre: 1,
  diaVencimiento: 10,
}

export default function CreditCardsSection({
  cards,
  expenses,
  cycleSummaries,
  loading,
  onAddCard,
  onEditCard,
  onRemoveCard,
  onAddExpense,
  onEditExpense,
  onRemoveExpense,
  onPayCycle,
}: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(defaultCardForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [payingId, setPayingId] = useState<string | null>(null)

  const [expenseModalCardId, setExpenseModalCardId] = useState<string | null>(null)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [detailCardId, setDetailCardId] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState<cardExpense | null>(null)

  const updateForm = <K extends keyof typeof defaultCardForm>(key: K, value: (typeof defaultCardForm)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.nombre.trim()) {
      setError("Ingresá un nombre para la tarjeta")
      return
    }
    if (!form.diaCierre || form.diaCierre < 1 || form.diaCierre > 28) {
      setError("El día de cierre tiene que estar entre 1 y 28")
      return
    }
    if (!form.diaVencimiento || form.diaVencimiento < 1 || form.diaVencimiento > 28) {
      setError("El día de vencimiento tiene que estar entre 1 y 28")
      return
    }

    const card: newCreditCard = {
      nombre: form.nombre.trim(),
      banco: form.banco.trim() || null,
      cupo: form.cupo > 0 ? form.cupo : null,
      diaCierre: form.diaCierre,
      diaVencimiento: form.diaVencimiento,
    }

    setSaving(true)
    const registered = await onAddCard(card)
    setSaving(false)

    if (!registered) {
      setError("No se pudo agregar la tarjeta")
      return
    }

    setForm(defaultCardForm)
    setFormOpen(false)
  }

  const openExpenseModal = (cardId: string | null) => {
    setExpenseModalCardId(cardId)
    setExpenseModalOpen(true)
  }

  const handlePay = async (card: creditCardType, summary: cardCycleSummary) => {
    setPayingId(card.id)
    await onPayCycle(card, summary)
    setPayingId(null)
  }

  const detailCard = cards.find(c => c.id === detailCardId) ?? null
  const detailSummary = detailCardId ? cycleSummaries.get(detailCardId) ?? null : null
  const detailExpenses = expenses.filter(e => e.tarjetaId === detailCardId)

  if (loading) {
    return (
      <section className="rounded-3xl border border-emerald-100 bg-white/90 shadow-lg p-6 text-slate-400 text-sm">
        Cargando tarjetas...
      </section>
    )
  }

  return (
    <>
    <section className="rounded-3xl border border-emerald-100 bg-white/90 backdrop-blur-sm shadow-lg p-6 md:p-7 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 inline-flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Tarjetas de crédito
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Un gasto con tarjeta no impacta en "Movimientos" hasta que pagás el resumen — hasta entonces solo consume cupo.
          </p>
        </div>

        {cards.length > 0 && (
          <button
            onClick={() => openExpenseModal(cards[0].id)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 border border-emerald-200 rounded-lg px-3 py-2"
          >
            <ShoppingBag className="w-4 h-4" /> Registrar gasto
          </button>
        )}
      </div>

      {!formOpen && (
        <button
          onClick={() => setFormOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition py-3 font-medium"
        >
          <Plus className="w-4 h-4" /> Agregar tarjeta
        </button>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Nueva tarjeta</p>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                setForm(defaultCardForm)
                setError("")
              }}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Cerrar formulario"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-700">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => updateForm("nombre", e.target.value)}
                placeholder="Ej: Visa Santander"
                className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="text-sm text-slate-700">Banco (opcional)</label>
              <input
                type="text"
                value={form.banco}
                onChange={e => updateForm("banco", e.target.value)}
                placeholder="Ej: Santander"
                className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                value={form.cupo || ""}
                onChange={e => updateForm("cupo", Number(e.target.value))}
                placeholder="500000"
                className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="text-sm text-slate-700">Día de cierre</label>
              <input
                type="number"
                min={1}
                max={28}
                value={form.diaCierre || ""}
                onChange={e => updateForm("diaCierre", Number(e.target.value))}
                className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="text-sm text-slate-700">Día de vencimiento</label>
              <input
                type="number"
                min={1}
                max={28}
                value={form.diaVencimiento || ""}
                onChange={e => updateForm("diaVencimiento", Number(e.target.value))}
                className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-[#2E6F40] text-white font-medium hover:bg-[#1f4e2a] transition disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Agregar tarjeta"}
          </button>
        </form>
      )}

      {cards.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Todavía no cargaste ninguna tarjeta.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(card => {
            const summary = cycleSummaries.get(card.id)
            if (!summary) return null

            const cupoUsadoPct =
              card.cupo && card.cupo > 0 ? Math.min(100, (summary.deudaPendiente / card.cupo) * 100) : null

            return (
              <div key={card.id} className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{card.nombre}</p>
                    {card.banco && <p className="text-xs text-slate-500">{card.banco}</p>}
                  </div>
                  <button
                    onClick={() => setDetailCardId(card.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 border border-emerald-200 rounded-lg px-2.5 py-1.5 shrink-0"
                  >
                    Ficha completa <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Resumen actual</p>
                    <p className="text-xl font-bold text-slate-900">{formatArs(summary.resumenActual)}</p>
                  </div>
                  <p className="text-xs text-slate-500">Vence {formatFecha(summary.fechaVencimientoActual)}</p>
                </div>

                {cupoUsadoPct != null && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Cupo disponible</span>
                      <span>{formatArs(summary.cupoDisponible ?? 0)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cupoUsadoPct >= 90 ? "bg-rose-500" : cupoUsadoPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${cupoUsadoPct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openExpenseModal(card.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2.5 py-2"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Registrar gasto
                  </button>
                  <button
                    onClick={() => handlePay(card, summary)}
                    disabled={summary.cicloActualPagado || summary.resumenActual <= 0 || payingId === card.id}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-2 transition ${
                      summary.cicloActualPagado
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {summary.cicloActualPagado ? "Ciclo pagado" : payingId === card.id ? "Pagando..." : "Pagar resumen"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>

    <AddCardExpenseModal
      isOpen={expenseModalOpen}
      onClose={() => setExpenseModalOpen(false)}
      cards={cards}
      defaultCardId={expenseModalCardId}
      onAdd={onAddExpense}
    />

    <CardDetailModal
      card={detailCard}
      summary={detailSummary}
      expenses={detailExpenses}
      onClose={() => setDetailCardId(null)}
      onEditCard={onEditCard}
      onRemoveCard={onRemoveCard}
      onEditExpense={setEditingExpense}
      onRemoveExpense={onRemoveExpense}
    />

    <EditCardExpenseModal
      isOpen={editingExpense !== null}
      onClose={() => setEditingExpense(null)}
      onSave={onEditExpense}
      expense={editingExpense}
      cards={cards}
    />
    </>
  )
}
