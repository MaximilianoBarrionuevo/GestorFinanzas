import { useCallback, useEffect, useState } from "react"
import type { services } from "../types/types"
import { servicesService } from "../Services/ServicesService"
import { useToast } from "../Context/ToastContext"

export function useServices(userId: string | undefined) {
  const [servicesList, setServicesList] = useState<services[]>([])
  const [loading, setLoading] = useState(true)
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    if (!userId) {
      setServicesList([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    servicesService
      .getByUserId(userId)
      .then(data => {
        if (!cancelled) setServicesList(data)
      })
      .catch(() => {
        if (!cancelled) showError("No pudimos cargar tus servicios. Probá recargar la página.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, showError])

  const addService = useCallback(
    async (service: Omit<services, "id">) => {
      if (!userId) return null
      try {
        const data = await servicesService.create(userId, service)
        setServicesList(prev => [data, ...prev])
        showSuccess("Servicio agregado")
        return data
      } catch {
        showError("No se pudo agregar el servicio. Intentá de nuevo.")
        return null
      }
    },
    [userId, showError, showSuccess]
  )

  const editService = useCallback(
    async (id: string, updates: Partial<Omit<services, "id" | "user_id" | "created_at">>) => {
      if (!userId) return null
      try {
        const data = await servicesService.update(userId, id, updates)
        setServicesList(prev => prev.map(s => (s.id === id ? data : s)))
        showSuccess("Servicio actualizado")
        return data
      } catch {
        showError("No se pudo actualizar el servicio. Intentá de nuevo.")
        return null
      }
    },
    [userId, showError, showSuccess]
  )

  const removeService = useCallback(
    async (id: string) => {
      if (!userId) return false
      try {
        await servicesService.remove(userId, id)
        setServicesList(prev => prev.filter(s => s.id !== id))
        showSuccess("Servicio eliminado")
        return true
      } catch {
        showError("No se pudo eliminar el servicio. Intentá de nuevo.")
        return false
      }
    },
    [userId, showError, showSuccess]
  )

  return { servicesList, loading, addService, editService, removeService }
}