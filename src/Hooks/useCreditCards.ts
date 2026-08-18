import { useCallback, useEffect, useMemo, useState } from "react"
import type { cardCycleSummary, cardExpense, creditCard, newCardExpense, newCreditCard } from "../types/types"
import { creditCardsService } from "../Services/CreditCardsService"
import { cardExpensesService } from "../Services/CardExpensesService"
import { buildCardCycleSummary } from "../lib/Finance"
import { useToast } from "../Context/ToastContext"

export function useCreditCards(userId: string | undefined) {
  const [cards, setCards] = useState<creditCard[]>([])
  const [expenses, setExpenses] = useState<cardExpense[]>([])
  const [loading, setLoading] = useState(true)
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    if (!userId) {
      setCards([])
      setExpenses([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([creditCardsService.getByUserId(userId), cardExpensesService.getByUserId(userId)])
      .then(([cardsData, expensesData]) => {
        if (!cancelled) {
          setCards(cardsData)
          setExpenses(expensesData)
        }
      })
      .catch(() => {
        if (!cancelled) showError("No pudimos cargar tus tarjetas. Probá recargar la página.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, showError])

  const addCard = useCallback(
    async (card: newCreditCard) => {
      if (!userId) return null
      try {
        const data = await creditCardsService.create(userId, card)
        setCards(prev => [...prev, data])
        showSuccess("Tarjeta agregada")
        return data
      } catch {
        showError("No se pudo agregar la tarjeta. Intentá de nuevo.")
        return null
      }
    },
    [userId, showError, showSuccess]
  )

  const editCard = useCallback(
    async (id: string, card: newCreditCard) => {
      if (!userId) return false
      try {
        const data = await creditCardsService.update(userId, id, card)
        setCards(prev => prev.map(c => (c.id === id ? data : c)))
        showSuccess("Tarjeta actualizada")
        return true
      } catch {
        showError("No se pudo actualizar la tarjeta. Intentá de nuevo.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  const removeCard = useCallback(
    async (id: string) => {
      if (!userId) return false
      try {
        await creditCardsService.remove(userId, id)
        setCards(prev => prev.filter(c => c.id !== id))
        // Los gastos de la tarjeta se borran en cascada en la base; reflejamos lo mismo en memoria.
        setExpenses(prev => prev.filter(e => e.tarjetaId !== id))
        showSuccess("Tarjeta eliminada")
        return true
      } catch {
        showError("No se pudo eliminar la tarjeta. Intentá de nuevo.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  /** Marca el ciclo actual como pagado, para no duplicar "Pagar resumen" del mismo ciclo. */
  const markCyclePaid = useCallback(
    async (id: string, cycleKey: number) => {
      if (!userId) return false
      try {
        const data = await creditCardsService.markCyclePaid(userId, id, cycleKey)
        setCards(prev => prev.map(c => (c.id === id ? data : c)))
        return true
      } catch {
        showError("No se pudo marcar el ciclo como pagado.")
        return false
      }
    },
    [userId, showError]
  )

  const addExpense = useCallback(
    async (expense: newCardExpense) => {
      if (!userId) return null
      try {
        const data = await cardExpensesService.create(userId, expense)
        setExpenses(prev => [data, ...prev])
        showSuccess("Gasto registrado")
        return data
      } catch {
        showError("No se pudo registrar el gasto. Intentá de nuevo.")
        return null
      }
    },
    [userId, showError, showSuccess]
  )

  const editExpense = useCallback(
    async (id: string, expense: newCardExpense) => {
      if (!userId) return false
      try {
        const data = await cardExpensesService.update(userId, id, expense)
        setExpenses(prev => prev.map(e => (e.id === id ? data : e)))
        showSuccess("Gasto actualizado")
        return true
      } catch {
        showError("No se pudo editar el gasto. Intentá de nuevo.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  const removeExpense = useCallback(
    async (id: string) => {
      if (!userId) return false
      try {
        await cardExpensesService.remove(userId, id)
        setExpenses(prev => prev.filter(e => e.id !== id))
        showSuccess("Gasto eliminado")
        return true
      } catch {
        showError("No se pudo eliminar el gasto. Intentá de nuevo.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  // Resumen de ciclo (actual + cupo disponible) por tarjeta, recalculado cuando cambian tarjetas o gastos.
  const cycleSummaries = useMemo(() => {
    const map = new Map<string, cardCycleSummary>()
    for (const card of cards) {
      const cardExpenses = expenses.filter(e => e.tarjetaId === card.id)
      map.set(card.id, buildCardCycleSummary(card, cardExpenses))
    }
    return map
  }, [cards, expenses])

  return {
    cards,
    expenses,
    cycleSummaries,
    loading,
    addCard,
    editCard,
    removeCard,
    markCyclePaid,
    addExpense,
    editExpense,
    removeExpense,
  }
}
