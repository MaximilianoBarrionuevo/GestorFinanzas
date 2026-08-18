import { useCallback, useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import { useToast } from "../Context/ToastContext"

type MpStatus = {
  connected: boolean
  lastSyncedAt: string | null
  connectedAt: string | null
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("No hay sesión activa")

  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `Error ${res.status}`)
  }

  return body
}

export function useMercadoPago(userId: string | undefined) {
  const [status, setStatus] = useState<MpStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const { showError, showSuccess } = useToast()

  const refreshStatus = useCallback(async () => {
    if (!userId) {
      setStatus(null)
      setLoading(false)
      return
    }
    try {
      const data = await authedFetch("/api/mercadopago/status")
      setStatus(data)
    } catch {
      // Silencioso a propósito: si esto falla (ej. todavía no se configuró el
      // backend), la UI simplemente se comporta como "no conectado" en vez de
      // spamear un toast de error en cada carga del dashboard.
      setStatus({ connected: false, lastSyncedAt: null, connectedAt: null })
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    refreshStatus()
  }, [refreshStatus])

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const data = await authedFetch("/api/mercadopago/connect")
      window.location.href = data.url
    } catch {
      showError("No se pudo iniciar la conexión con Mercado Pago.")
      setConnecting(false)
    }
  }, [showError])

  const disconnect = useCallback(async () => {
    try {
      await authedFetch("/api/mercadopago/disconnect", { method: "POST" })
      setStatus({ connected: false, lastSyncedAt: null, connectedAt: null })
      showSuccess("Mercado Pago desconectado")
    } catch {
      showError("No se pudo desconectar la cuenta.")
    }
  }, [showError, showSuccess])

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const data = await authedFetch("/api/mercadopago/sync", { method: "POST" })
      showSuccess(data.imported > 0 ? `Se importaron ${data.imported} movimientos nuevos` : "No hay movimientos nuevos")
      await refreshStatus()
      return data as { imported: number; revisados: number }
    } catch (err) {
      showError(err instanceof Error ? err.message : "No se pudo sincronizar con Mercado Pago")
      return null
    } finally {
      setSyncing(false)
    }
  }, [showError, showSuccess, refreshStatus])

  return { status, loading, connecting, syncing, connect, disconnect, sync }
}
