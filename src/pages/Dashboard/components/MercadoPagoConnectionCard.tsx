import { Link2, RefreshCw, Unlink, Wallet } from "lucide-react"

type MpStatus = {
  connected: boolean
  lastSyncedAt: string | null
  connectedAt: string | null
}

type Props = {
  status: MpStatus | null
  loading: boolean
  connecting: boolean
  syncing: boolean
  onConnect: () => void
  onDisconnect: () => void
  onSync: () => void
}

export default function MercadoPagoConnectionCard({
  status,
  loading,
  connecting,
  syncing,
  onConnect,
  onDisconnect,
  onSync,
}: Props) {
  if (loading) return null

  const connected = status?.connected ?? false

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 backdrop-blur-sm shadow-md p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="p-2 rounded-xl bg-sky-50 text-sky-600 shrink-0">
          <Wallet className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Mercado Pago</p>
          <p className="text-xs text-slate-500 truncate">
            {connected
              ? status?.lastSyncedAt
                ? `Última sincronización: ${new Date(status.lastSyncedAt).toLocaleString("es-AR")}`
                : "Conectado — todavía no sincronizaste"
              : "Conectá tu cuenta para importar movimientos automáticamente"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {connected ? (
          <>
            <button
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 border border-emerald-200 rounded-lg px-3 py-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar ahora"}
            </button>
            <button
              onClick={onDisconnect}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-rose-600 px-2 py-2"
              title="Desconectar Mercado Pago"
              aria-label="Desconectar Mercado Pago"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="inline-flex items-center gap-1.5 text-sm font-medium bg-[#2E6F40] text-white rounded-lg px-3 py-2 hover:bg-[#1f4e2a] transition disabled:opacity-60"
          >
            <Link2 className="w-4 h-4" />
            {connecting ? "Redirigiendo..." : "Conectar Mercado Pago"}
          </button>
        )}
      </div>
    </div>
  )
}
