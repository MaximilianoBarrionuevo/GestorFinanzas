import { useCallback, useEffect, useState } from "react"
import type { savingsBalance } from "../types/types"
import { savingsService } from "../Services/SavingsService"
import { useToast } from "../Context/ToastContext"

const empty: savingsBalance = { user_id: "", ARS: 0, USD: 0 }

export function useSavings(userId: string | undefined) {
  const [savings, setSavings] = useState<savingsBalance>(empty)
  const [loading, setLoading] = useState(true)
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    if (!userId) {
      setSavings(empty)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    savingsService
      .getByUserId(userId)
      .then(data => {
        if (!cancelled) setSavings(data)
      })
      .catch(() => {
        if (!cancelled) showError("No pudimos cargar tus ahorros. Probá recargar la página.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, showError])

  const updateSavings = useCallback(
    async (balances: { ARS: number; USD: number }) => {
      if (!userId) return false
      try {
        const updated = await savingsService.updateByUserId(userId, balances)
        setSavings(updated)
        showSuccess("Movimiento de ahorro guardado")
        return true
      } catch {
        showError("No se pudo guardar el movimiento de ahorro.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  return { savings, loading, updateSavings }
}