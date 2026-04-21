import { useMemo, useState } from "react"
import { Landmark, TrendingUp, WalletCards } from "lucide-react"
import type { investmentPurchase } from "../../../types/types"

type Props = {
  userId: string
  onRegisterPurchase: (purchase: investmentPurchase) => Promise<boolean>
}

type AssetType = "CEDEAR" | "ACCION" | "CRYPTO" | "BONO" | "ETF" | "OTRO"
type Currency = "USD" | "ARS"

const today = new Date().toISOString().split("T")[0]

const walletSuggestions = ["Binance", "Bybit", "Lemon", "Belo", "Ripio", "Satoshi Tango", "Ualá", "Mercado Pago"]
const cedearSuggestions = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "SPY"]
const cryptoSuggestions = ["BTC", "ETH", "SOL", "USDT", "USDC", "BNB", "ADA", "XRP"]

const defaultForm = {
  broker: "",
  activo: "",
  tipo: "CEDEAR" as AssetType,
  cantidad: 0,
  precioCompra: 0,
  moneda: "USD" as Currency,
  fechaCompra: today,
  comision: 0,
  exchangeRate: 0,
}

const storageKey = (userId: string) => `investments:${userId}`

export default function InvestmentSection({ userId, onRegisterPurchase }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [purchases, setPurchases] = useState<investmentPurchase[]>(() => {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw) as investmentPurchase[]
      return parsed.map(item => ({
        ...item,
        exchangeRate: item.exchangeRate ?? null,
        totalCompraArs: item.totalCompraArs ?? item.totalCompra,
      }))
    } catch {
      return []
    }
  })

  const totalCompra = useMemo(() => {
    if (!form.cantidad || !form.precioCompra) return 0
    return form.cantidad * form.precioCompra + (form.comision || 0)
  }, [form.cantidad, form.precioCompra, form.comision])

  const totalCompraArs = useMemo(() => {
    if (!totalCompra) return 0
    if (form.moneda === "ARS") return totalCompra
    if (!form.exchangeRate) return 0
    return totalCompra * form.exchangeRate
  }, [form.exchangeRate, form.moneda, totalCompra])

  const totalInvertidoArs = useMemo(() => {
    return purchases.reduce((acc, p) => acc + p.totalCompraArs, 0)
  }, [purchases])

  const updateForm = <K extends keyof typeof defaultForm>(key: K, value: (typeof defaultForm)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!form.broker || !form.activo || !form.cantidad || !form.precioCompra || !form.fechaCompra) {
      setError("Completá todos los campos obligatorios")
      return
    }

    if (form.moneda === "USD" && (!form.exchangeRate || form.exchangeRate <= 0)) {
      setError("Si comprás en USD, tenés que informar la TCR para registrar bien el gasto en ARS")
      return
    }

    const purchase: investmentPurchase = {
      id: crypto.randomUUID(),
      user_id: userId,
      broker: form.broker,
      activo: form.activo.toUpperCase(),
      tipo: form.tipo,
      cantidad: form.cantidad,
      precioCompra: form.precioCompra,
      moneda: form.moneda,
      fechaCompra: form.fechaCompra,
      comision: form.comision || 0,
      exchangeRate: form.moneda === "USD" ? form.exchangeRate : null,
      totalCompra,
      totalCompraArs,
      created_at: new Date().toISOString(),
    }

    setSaving(true)
    const registered = await onRegisterPurchase(purchase)
    setSaving(false)

    if (!registered) {
      setError("No se pudo registrar la compra en movimientos")
      return
    }

    const next = [purchase, ...purchases]
    setPurchases(next)
    localStorage.setItem(storageKey(userId), JSON.stringify(next))
    setSuccess(`Compra registrada: ${purchase.cantidad} ${purchase.activo} a ${purchase.moneda} ${purchase.precioCompra.toLocaleString("es-AR")} c/u. Impacto en saldo ARS: ${purchase.totalCompraArs.toLocaleString("es-AR")}`)
    setForm(defaultForm)
  }

  const assetSuggestions = form.tipo === "CRYPTO" ? cryptoSuggestions : cedearSuggestions

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white/90 backdrop-blur-sm shadow-lg p-6 md:p-7 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 inline-flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Inversiones
          </h2>
          <p className="text-sm text-slate-500 mt-1">Compras de CEDEARs, acciones, crypto y más.</p>
        </div>

        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-2">
          <p className="text-xs text-emerald-700">Total invertido (histórico en ARS)</p>
          <p className="text-xl font-bold text-emerald-800">
            ARS {totalInvertidoArs.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-end">
        <div>
          <label className="text-sm text-slate-700">Billetera / Broker *</label>
          <input
            type="text"
            list="wallet-suggestions"
            value={form.broker}
            onChange={e => updateForm("broker", e.target.value)}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Ej: Binance / Cocos"
          />
          <datalist id="wallet-suggestions">
            {walletSuggestions.map(wallet => (
              <option key={wallet} value={wallet} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-sm text-slate-700">Activo *</label>
          <input
            type="text"
            list="asset-suggestions"
            value={form.activo}
            onChange={e => updateForm("activo", e.target.value)}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder={form.tipo === "CRYPTO" ? "Ej: BTC" : "Ej: AAPL"}
          />
          <datalist id="asset-suggestions">
            {assetSuggestions.map(asset => (
              <option key={asset} value={asset} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-sm text-slate-700">Tipo</label>
          <select
            value={form.tipo}
            onChange={e => updateForm("tipo", e.target.value as AssetType)}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="CEDEAR">CEDEAR</option>
            <option value="ACCION">Acción</option>
            <option value="CRYPTO">Crypto</option>
            <option value="BONO">Bono</option>
            <option value="ETF">ETF</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-700">Fecha de compra *</label>
          <input
            type="date"
            value={form.fechaCompra}
            onChange={e => updateForm("fechaCompra", e.target.value)}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="text-sm text-slate-700">Cantidad comprada *</label>
          <input
            type="number"
            min={0}
            step="0.00000001"
            required
            value={form.cantidad || ""}
            onChange={e => updateForm("cantidad", Number(e.target.value))}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Ej: 0.5"
          />
        </div>

        <div>
          <label className="text-sm text-slate-700">Valor del activo *</label>
          <input
            type="number"
            min={0}
            step="0.00000001"
            required
            value={form.precioCompra || ""}
            onChange={e => updateForm("precioCompra", Number(e.target.value))}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Ej: 100"
          />
        </div>

        <div>
          <label className="text-sm text-slate-700">Moneda</label>
          <select
            value={form.moneda}
            onChange={e => updateForm("moneda", e.target.value as Currency)}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-700">Comisión (opcional)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.comision || ""}
            onChange={e => updateForm("comision", Number(e.target.value))}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm text-slate-700">TCR dólar {form.moneda === "USD" ? "*" : "(opcional)"}</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.exchangeRate || ""}
            onChange={e => updateForm("exchangeRate", Number(e.target.value))}
            disabled={form.moneda !== "USD"}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Ej: 1300"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-xl bg-slate-900 text-white font-medium inline-flex items-center justify-center gap-2 hover:bg-slate-700 transition disabled:opacity-60"
        >
          <WalletCards className="w-4 h-4" />
          {saving ? "Guardando..." : "Registrar compra"}
        </button>
      </form>

      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex items-center justify-between">
        <p className="text-sm text-slate-500 inline-flex items-center gap-2"><Landmark className="w-4 h-4" /> Total de la operación</p>
        <p className="text-lg font-semibold text-slate-900">
          {form.moneda} {totalCompra.toLocaleString("es-AR")} · ARS {totalCompraArs.toLocaleString("es-AR")}
        </p>
      </div>

      {!!purchases.length && (
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <p className="px-4 py-3 bg-slate-50 text-sm font-medium text-slate-700">Últimas compras registradas</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2">Fecha</th>
                  <th className="text-left px-4 py-2">Tipo</th>
                  <th className="text-left px-4 py-2">Activo</th>
                  <th className="text-left px-4 py-2">Billetera</th>
                  <th className="text-right px-4 py-2">Cantidad</th>
                  <th className="text-right px-4 py-2">Precio unitario</th>
                  <th className="text-right px-4 py-2">Total</th>
                  <th className="text-right px-4 py-2">Impacto ARS</th>
                </tr>
              </thead>
              <tbody>
                {purchases.slice(0, 8).map(purchase => (
                  <tr key={purchase.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{purchase.fechaCompra}</td>
                    <td className="px-4 py-2">{purchase.tipo}</td>
                    <td className="px-4 py-2">{purchase.activo}</td>
                    <td className="px-4 py-2">{purchase.broker}</td>
                    <td className="px-4 py-2 text-right">{purchase.cantidad.toLocaleString("es-AR")}</td>
                    <td className="px-4 py-2 text-right">{purchase.moneda} {purchase.precioCompra.toLocaleString("es-AR")}</td>
                    <td className="px-4 py-2 text-right">{purchase.moneda} {purchase.totalCompra.toLocaleString("es-AR")}</td>
                    <td className="px-4 py-2 text-right">ARS {purchase.totalCompraArs.toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
    </section>
  )
}