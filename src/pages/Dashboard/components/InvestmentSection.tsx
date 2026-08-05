import { useMemo, useState } from "react"
import {
  ChevronDown,
  Landmark,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react"
import type { investmentPosition, investmentPurchase, newInvestmentPurchase } from "../../../types/types"
import { formatArs, formatSigned } from "../../../lib/Finance"

type Props = {
  positions: investmentPosition[]
  loading: boolean
  onRegisterPurchase: (purchase: newInvestmentPurchase) => Promise<investmentPurchase | null>
  onUpdatePositionValue: (purchaseIds: string[], precioActual: number, tipoCambioActual: number | null) => Promise<boolean>
  onRemovePurchase: (id: string) => Promise<boolean>
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

const tipoLabel: Record<AssetType, string> = {
  CEDEAR: "CEDEAR",
  ACCION: "Acción",
  CRYPTO: "Crypto",
  BONO: "Bono",
  ETF: "ETF",
  OTRO: "Otro",
}

export default function InvestmentSection({
  positions,
  loading,
  onRegisterPurchase,
  onUpdatePositionValue,
  onRemovePurchase,
}: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [valuationKey, setValuationKey] = useState<string | null>(null)
  const [valuationPrice, setValuationPrice] = useState(0)
  const [valuationRate, setValuationRate] = useState(0)

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

  const totales = useMemo(() => {
    const costo = positions.reduce((acc, p) => acc + p.costoTotalArs, 0)
    const valorActual = positions.reduce((acc, p) => acc + (p.valorActualArs ?? p.costoTotalArs), 0)
    const ganancia = valorActual - costo
    return { costo, valorActual, ganancia }
  }, [positions])

  const updateForm = <K extends keyof typeof defaultForm>(key: K, value: (typeof defaultForm)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.broker || !form.activo || !form.cantidad || !form.precioCompra || !form.fechaCompra) {
      setError("Completá todos los campos obligatorios")
      return
    }

    if (form.moneda === "USD" && (!form.exchangeRate || form.exchangeRate <= 0)) {
      setError("Si comprás en USD, tenés que informar la TCR para registrar bien el gasto en ARS")
      return
    }

    const purchase: newInvestmentPurchase = {
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
    }

    setSaving(true)
    const registered = await onRegisterPurchase(purchase)
    setSaving(false)

    if (!registered) {
      setError("No se pudo registrar la compra")
      return
    }

    setForm(defaultForm)
    setFormOpen(false)
  }

  const assetSuggestions = form.tipo === "CRYPTO" ? cryptoSuggestions : cedearSuggestions

  const openValuation = (position: investmentPosition) => {
    setValuationKey(position.key)
    setValuationPrice(position.precioActual ?? 0)
    setValuationRate(position.tipoCambioActual ?? 0)
  }

  const submitValuation = async (position: investmentPosition) => {
    if (!valuationPrice) return
    const needsRate = position.moneda === "USD"
    if (needsRate && !valuationRate) return

    const ids = position.compras.map(c => c.id)
    const ok = await onUpdatePositionValue(ids, valuationPrice, needsRate ? valuationRate : null)
    if (ok) setValuationKey(null)
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-emerald-100 bg-white/90 shadow-lg p-6 text-slate-400 text-sm">
        Cargando inversiones...
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white/90 backdrop-blur-sm shadow-lg p-6 md:p-7 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 inline-flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Inversiones
          </h2>
          <p className="text-sm text-slate-500 mt-1">Tu portfolio de CEDEARs, acciones, crypto y más.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-2">
            <p className="text-xs text-slate-500">Costo total</p>
            <p className="text-lg font-bold text-slate-800">{formatArs(totales.costo)}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-2">
            <p className="text-xs text-emerald-700">Valor actual</p>
            <p className="text-lg font-bold text-emerald-800">{formatArs(totales.valorActual)}</p>
          </div>
          {totales.costo > 0 && (
            <div
              className={`rounded-2xl border px-4 py-2 ${
                totales.ganancia >= 0
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-rose-50 border-rose-100 text-rose-700"
              }`}
            >
              <p className="text-xs opacity-80">Ganancia / pérdida</p>
              <p className="text-lg font-bold">{formatSigned(totales.ganancia)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Botón para abrir el formulario de carga (antes estaba siempre abierto y ocupaba 9 campos de golpe) */}
      {!formOpen && (
        <button
          onClick={() => setFormOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition py-3 font-medium"
        >
          <Plus className="w-4 h-4" /> Registrar una compra
        </button>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 md:p-5 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Nueva compra</p>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                setForm(defaultForm)
                setError("")
              }}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Cerrar formulario"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Paso 1: qué compraste */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">¿Qué compraste?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(tipoLabel) as AssetType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateForm("tipo", t)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      form.tipo === t
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {tipoLabel[t]}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  list="asset-suggestions"
                  value={form.activo}
                  onChange={e => updateForm("activo", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder={form.tipo === "CRYPTO" ? "Activo, ej: BTC" : "Activo, ej: AAPL"}
                />
                <datalist id="asset-suggestions">
                  {assetSuggestions.map(asset => (
                    <option key={asset} value={asset} />
                  ))}
                </datalist>
              </div>

              <div>
                <input
                  type="text"
                  list="wallet-suggestions"
                  value={form.broker}
                  onChange={e => updateForm("broker", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Broker / billetera, ej: Binance"
                />
                <datalist id="wallet-suggestions">
                  {walletSuggestions.map(wallet => (
                    <option key={wallet} value={wallet} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Paso 2: cuánto */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">¿Cuánto?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-sm text-slate-700">Cantidad</label>
                <input
                  type="number"
                  min={0}
                  step="0.00000001"
                  value={form.cantidad || ""}
                  onChange={e => updateForm("cantidad", Number(e.target.value))}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="0.5"
                />
              </div>

              <div>
                <label className="text-sm text-slate-700">Precio por unidad</label>
                <input
                  type="number"
                  min={0}
                  step="0.00000001"
                  value={form.precioCompra || ""}
                  onChange={e => updateForm("precioCompra", Number(e.target.value))}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="text-sm text-slate-700">Moneda</label>
                <div className="mt-1 flex rounded-xl border border-slate-200 overflow-hidden">
                  {(["USD", "ARS"] as Currency[]).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateForm("moneda", c)}
                      className={`flex-1 py-2.5 text-sm font-medium transition ${
                        form.moneda === c ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-700">Fecha</label>
                <input
                  type="date"
                  value={form.fechaCompra}
                  onChange={e => updateForm("fechaCompra", e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          {/* Paso 3: costos, solo si aplica */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Costos {form.moneda !== "USD" && "(comisión opcional)"}
            </p>
            <div className="grid grid-cols-2 gap-3">
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

              {form.moneda === "USD" && (
                <div>
                  <label className="text-sm text-slate-700">TCR (tipo de cambio) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.exchangeRate || ""}
                    onChange={e => updateForm("exchangeRate", Number(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="1300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Resumen en vivo */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between">
            <p className="text-sm text-slate-500 inline-flex items-center gap-2">
              <Landmark className="w-4 h-4" /> Total de la operación
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {form.moneda} {totalCompra.toLocaleString("es-AR")}
              {form.moneda === "USD" && ` · ${formatArs(totalCompraArs)}`}
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-[#2E6F40] text-white font-medium inline-flex items-center justify-center gap-2 hover:bg-[#1f4e2a] transition disabled:opacity-60"
          >
            <WalletCards className="w-4 h-4" />
            {saving ? "Guardando..." : "Registrar compra"}
          </button>
        </form>
      )}

      {/* Portfolio consolidado por posición */}
      {positions.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Todavía no cargaste ninguna inversión.</p>
      ) : (
        <div className="rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
          {positions.map(position => {
            const isExpanded = expandedKey === position.key
            const isValuating = valuationKey === position.key
            const ganancia = position.gananciaArs

            return (
              <div key={position.key} className="bg-white">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : position.key)}
                    className="flex items-center gap-2 flex-1 min-w-[180px] text-left"
                  >
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    <div>
                      <p className="font-semibold text-slate-900">{position.activo}</p>
                      <p className="text-xs text-slate-500">
                        {tipoLabel[position.tipo]} · {position.broker} · {position.cantidadTotal.toLocaleString("es-AR")} u.
                      </p>
                    </div>
                  </button>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Costo</p>
                    <p className="text-sm font-medium text-slate-700">{formatArs(position.costoTotalArs)}</p>
                  </div>

                  <div className="text-right min-w-[110px]">
                    <p className="text-xs text-slate-400">Valor actual</p>
                    <p className="text-sm font-medium text-slate-900">
                      {position.valorActualArs != null ? formatArs(position.valorActualArs) : "sin cargar"}
                    </p>
                  </div>

                  <div className={`text-right min-w-[110px] ${ganancia == null ? "text-slate-300" : ganancia >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    <p className="text-xs opacity-70 inline-flex items-center gap-1 justify-end">
                      {ganancia != null && (ganancia >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
                      Ganancia
                    </p>
                    <p className="text-sm font-semibold">
                      {ganancia != null ? `${formatSigned(ganancia)} (${position.gananciaPct?.toFixed(1)}%)` : "—"}
                    </p>
                  </div>

                  <button
                    onClick={() => (isValuating ? setValuationKey(null) : openValuation(position))}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                    title="Actualizar valor actual"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {isValuating && (
                  <div className="px-4 pb-4 flex flex-wrap items-end gap-3 bg-slate-50/60">
                    <div>
                      <label className="text-xs text-slate-600">Precio actual ({position.moneda}/u.)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.00000001"
                        value={valuationPrice || ""}
                        onChange={e => setValuationPrice(Number(e.target.value))}
                        className="mt-1 w-40 rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        placeholder="Ej: 145"
                      />
                    </div>
                    {position.moneda === "USD" && (
                      <div>
                        <label className="text-xs text-slate-600">TCR actual</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={valuationRate || ""}
                          onChange={e => setValuationRate(Number(e.target.value))}
                          className="mt-1 w-32 rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          placeholder="Ej: 1350"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => submitValuation(position)}
                      className="h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700"
                    >
                      Guardar valor
                    </button>
                    {valuationPrice > 0 && (position.moneda !== "USD" || valuationRate > 0) && (
                      <p className="text-xs text-slate-500">
                        Nuevo valor: {formatArs(position.cantidadTotal * valuationPrice * (position.moneda === "USD" ? valuationRate : 1))}
                      </p>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <table className="w-full text-xs">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="text-left font-medium py-1.5">Fecha</th>
                          <th className="text-right font-medium py-1.5">Cantidad</th>
                          <th className="text-right font-medium py-1.5">Precio unitario</th>
                          <th className="text-right font-medium py-1.5">Total</th>
                          <th className="text-right font-medium py-1.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {position.compras.map(compra => (
                          <tr key={compra.id} className="border-t border-slate-100">
                            <td className="py-1.5 text-slate-600">{compra.fechaCompra}</td>
                            <td className="py-1.5 text-right text-slate-600">{compra.cantidad.toLocaleString("es-AR")}</td>
                            <td className="py-1.5 text-right text-slate-600">
                              {compra.moneda} {compra.precioCompra.toLocaleString("es-AR")}
                            </td>
                            <td className="py-1.5 text-right text-slate-600">{formatArs(compra.totalCompraArs)}</td>
                            <td className="py-1.5 text-right">
                              <button
                                onClick={() => onRemovePurchase(compra.id)}
                                className="p-1 rounded hover:bg-rose-50 text-rose-500"
                                title="Eliminar esta compra"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}