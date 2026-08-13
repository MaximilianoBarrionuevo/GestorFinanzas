import { useCallback, useEffect, useState } from "react"
import type { transactions } from "../types/types"
import { transactionService } from "../Services/TransactionService"
import { useToast } from "../Context/ToastContext"

export function useTransactions(userId: string | undefined) {
  const [transactionsList, setTransactionsList] = useState<transactions[]>([])
  const [loading, setLoading] = useState(true)
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    if (!userId) {
      setTransactionsList([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    transactionService
      .getByUserId(userId)
      .then(data => {
        if (!cancelled) setTransactionsList(data)
      })
      .catch(() => {
        if (!cancelled) showError("No pudimos cargar tus transacciones. Probá recargar la página.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, showError])

  const addTransaction = useCallback(
    async (transaction: Omit<transactions, "id" | "user_id">) => {
      if (!userId) return null
      try {
        const data = await transactionService.create(userId, transaction)
        setTransactionsList(prev => [data, ...prev])
        showSuccess("Transacción agregada")
        return data
      } catch {
        showError("No se pudo agregar la transacción. Intentá de nuevo.")
        return null
      }
    },
    [userId, showError, showSuccess]
  )

  const editTransaction = useCallback(
    async (id: string, updatedData: Partial<transactions>) => {
      if (!userId) return false
      try {
        const data = await transactionService.update(userId, id, updatedData)
        setTransactionsList(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)))
        showSuccess("Transacción actualizada")
        return true
      } catch {
        showError("No se pudo editar la transacción. Intentá de nuevo.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  const removeTransaction = useCallback(
    async (id: string) => {
      if (!userId) return false
      try {
        await transactionService.remove(userId, id)
        setTransactionsList(prev => prev.filter(t => t.id !== id))
        showSuccess("Transacción eliminada")
        return true
      } catch {
        showError("No se pudo eliminar la transacción. Intentá de nuevo.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  return { transactionsList, loading, addTransaction, editTransaction, removeTransaction }
}