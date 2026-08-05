import { ArrowDownRight, ArrowUpRight, CalendarClock, PiggyBank, Wallet } from "lucide-react"
import { formatArs } from "../../../lib/Finance"
import type { NetWorthSummary } from "../../../lib/Finance"
import type { services } from "../../../types/types"

type Props = {
  netWorth: NetWorthSummary
  ingresosMes: number
  egresosMes: number
  tasaAhorro: number | null
  proximoServicio: services | null
}

const formatFecha = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export default function SummaryCards({ netWorth, ingresosMes, egresosMes, tasaAhorro, proximoServicio }: Props) {
  const tasaColor =
    tasaAhorro === null
      ? "text-slate-500"
      : tasaAhorro >= 20
      ? "text-emerald-600"
      : tasaAhorro >= 0
      ? "text-amber-600"
      : "text-rose-600"

  return (
    <div className="space-y-4">
      {/* Hero: patrimonio neto */}
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-slate-900 to-emerald-950 text-white shadow-lg p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-300/80 inline-flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Patrimonio neto
            </p>
            <p className="text-3xl md:text-4xl font-bold mt-1.5">{formatArs(netWorth.patrimonioNeto)}</p>
            {!netWorth.patrimonioAValorActual && (
              <p className="text-xs text-emerald-200/70 mt-1.5">
                Incluye inversiones a costo de compra — cargá el valor actual en la pestaña Inversiones para ver la ganancia real.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-xl bg-white/10 px-3 py-2 min-w-[100px]">
              <p className="text-emerald-300/70 text-xs">Líquido</p>
              <p className="font-semibold">{formatArs(netWorth.saldoLiquido)}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 min-w-[100px]">
              <p className="text-emerald-300/70 text-xs">Ahorro ARS</p>
              <p className="font-semibold">{formatArs(netWorth.ahorroArs)}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 min-w-[100px]">
              <p className="text-emerald-300/70 text-xs">Inversiones</p>
              <p className="font-semibold">{formatArs(netWorth.valorInversiones)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas del mes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white/90 shadow-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xs md:text-sm text-slate-500">Ingresos del mes</h2>
              <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900">{formatArs(ingresosMes)}</p>
            </div>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/90 shadow-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xs md:text-sm text-slate-500">Egresos del mes</h2>
              <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900">{formatArs(egresosMes)}</p>
            </div>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5" />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/90 shadow-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xs md:text-sm text-slate-500">Tasa de ahorro</h2>
              <p className={`text-xl md:text-2xl font-bold mt-1 ${tasaColor}`}>
                {tasaAhorro === null ? "—" : `${tasaAhorro.toFixed(0)}%`}
              </p>
            </div>
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <PiggyBank className="w-4 h-4 md:w-5 md:h-5" />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/90 shadow-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xs md:text-sm text-slate-500">Próximo vencimiento</h2>
              {proximoServicio ? (
                <>
                  <p className="text-lg md:text-xl font-bold mt-1 text-slate-900 truncate">{proximoServicio.nombre}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatFecha(proximoServicio.proximo_pago)} · {formatArs(proximoServicio.monto)}
                  </p>
                </>
              ) : (
                <p className="text-xl md:text-2xl font-bold mt-1 text-slate-400">—</p>
              )}
            </div>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CalendarClock className="w-4 h-4 md:w-5 md:h-5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}