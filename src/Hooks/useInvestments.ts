import { useCallback, useEffect, useMemo, useState } from "react"
import type { investmentPurchase, newInvestmentPurchase } from "../types/types"
import { investmentsService } from "../Services/InvestmentsService"
import { buildInvestmentPositions } from "../lib/Finance"
import { useToast } from "../Context/ToastContext"

export function useInvestments(userId: string | undefined) {
  const [purchases, setPurchases] = useState<investmentPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    if (!userId) {
      setPurchases([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    investmentsService
      .getByUserId(userId)
      .then(data => {
        if (!cancelled) setPurchases(data)
      })
      .catch(() => {
        if (!cancelled) showError("No pudimos cargar tus inversiones. Probá recargar la página.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, showError])

  const addPurchase = useCallback(
    async (purchase: newInvestmentPurchase) => {
      if (!userId) return null
      try {
        const data = await investmentsService.create(userId, purchase)
        setPurchases(prev => [data, ...prev])
        showSuccess("Compra registrada")
        return data
      } catch {
        showError("No se pudo registrar la compra. Intentá de nuevo.")
        return null
      }
    },
    [userId, showError, showSuccess]
  )

  /**
   * Aplica un precio de mercado actual a todas las compras de una misma
   * posición (activo+broker), para que la ganancia/pérdida se calcule sobre
   * el total tenido, no solo sobre el último lote comprado.
   */
  const updatePositionCurrentValue = useCallback(
    async (purchaseIds: string[], precioActual: number, tipoCambioActual: number | null) => {
      if (!userId) return false
      try {
        const updated = await Promise.all(
          purchaseIds.map(id => {
            const purchase = purchases.find(p => p.id === id)
            const valorActualArs = purchase
              ? purchase.cantidad * precioActual * (tipoCambioActual ?? 1)
              : 0
            return investmentsService.updateCurrentValue(userId, id, { precioActual, tipoCambioActual, valorActualArs })
          })
        )
        setPurchases(prev => prev.map(p => updated.find(u => u.id === p.id) ?? p))
        showSuccess("Valor de mercado actualizado")
        return true
      } catch {
        showError("No se pudo actualizar el valor. Intentá de nuevo.")
        return false
      }
    },
    [userId, purchases, showError, showSuccess]
  )

  const editPurchase = useCallback(
    async (id: string, purchase: newInvestmentPurchase) => {
      if (!userId) return false
      try {
        const data = await investmentsService.update(userId, id, purchase)
        setPurchases(prev => prev.map(p => (p.id === id ? data : p)))
        showSuccess("Compra actualizada")
        return true
      } catch {
        showError("No se pudo editar la compra. Intentá de nuevo.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  const removePurchase = useCallback(
    async (id: string) => {
      if (!userId) return false
      try {
        await investmentsService.remove(userId, id)
        setPurchases(prev => prev.filter(p => p.id !== id))
        showSuccess("Compra eliminada")
        return true
      } catch {
        showError("No se pudo eliminar la compra. Intentá de nuevo.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  const positions = useMemo(() => buildInvestmentPositions(purchases), [purchases])

  return { purchases, positions, loading, addPurchase, updatePositionCurrentValue, editPurchase, removePurchase }
}