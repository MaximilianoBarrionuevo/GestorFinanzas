import type { investmentPosition, investmentPurchase, services, transactions } from "../types/types"

export const formatArs = (value: number) =>
  `$${Math.round(value).toLocaleString("es-AR")}`

export const formatSigned = (value: number) =>
  `${value >= 0 ? "+" : "-"}${formatArs(Math.abs(value))}`

export type PeriodTotals = {
  ingresos: number
  egresos: number
  saldo: number
  invertido: number
  tasaAhorro: number | null // % de ingresos que no se gastó (ahorro + inversión), null si no hubo ingresos
}

/** Calcula ingresos/egresos/tasa de ahorro para un conjunto de transacciones. */
export function calcPeriodTotals(transactionsList: transactions[]): PeriodTotals {
  const ingresos = transactionsList
    .filter(t => t.type === "ingreso")
    .reduce((acc, t) => acc + t.amount, 0)

  const egresos = transactionsList
    .filter(t => t.type === "egreso")
    .reduce((acc, t) => acc + t.amount, 0)

  const invertido = transactionsList
    .filter(t => t.type === "egreso" && t.category.startsWith("Inversión"))
    .reduce((acc, t) => acc + t.amount, 0)

  const saldo = ingresos - egresos
  const tasaAhorro = ingresos > 0 ? (saldo / ingresos) * 100 : null

  return { ingresos, egresos, saldo, invertido, tasaAhorro }
}

/** Filtra transacciones que caen dentro del mes calendario actual. */
export function filterCurrentMonth(transactionsList: transactions[], now = new Date()) {
  return transactionsList.filter(t => {
    const [year, month] = t.date.split("-").map(Number)
    return year === now.getFullYear() && month === now.getMonth() + 1
  })
}

/** Suma el gasto fijo mensual estimado a partir de los servicios recurrentes. */
export function calcGastoFijoMensual(servicesList: services[]): number {
  return servicesList.reduce((acc, s) => {
    if (s.frecuencia === "mensual") return acc + s.monto
    if (s.frecuencia === "anual") return acc + s.monto / 12
    return acc // "unico" no es gasto recurrente
  }, 0)
}

/** Meses de "runway": cuánto dura el saldo líquido actual cubriendo el gasto fijo mensual. */
export function calcRunwayMeses(saldo: number, gastoFijoMensual: number): number | null {
  if (gastoFijoMensual <= 0) return null
  return saldo / gastoFijoMensual
}

/**
 * Agrupa compras individuales de inversión en posiciones consolidadas por
 * activo + broker, calculando costo promedio y ganancia/pérdida si hay
 * valuación actual cargada.
 */
export function buildInvestmentPositions(purchases: investmentPurchase[]): investmentPosition[] {
  const groups = new Map<string, investmentPurchase[]>()

  for (const p of purchases) {
    const key = `${p.broker}::${p.activo}::${p.tipo}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  return Array.from(groups.entries()).map(([key, compras]) => {
    const [broker, activo, tipo] = key.split("::") as [string, string, investmentPurchase["tipo"]]
    const cantidadTotal = compras.reduce((acc, c) => acc + c.cantidad, 0)
    const costoTotalArs = compras.reduce((acc, c) => acc + c.totalCompraArs, 0)
    const costoPromedioUnidad = cantidadTotal > 0 ? costoTotalArs / cantidadTotal : 0

    // Usamos la valuación actual más reciente entre las compras del grupo.
    const conValuacion = compras
      .filter(c => c.valorActualArs != null)
      .sort((a, b) => (b.actualizadoAt ?? "").localeCompare(a.actualizadoAt ?? ""))

    const masReciente = conValuacion[0]
    const precioActual = masReciente?.precioActual ?? null
    const tipoCambioActual = masReciente?.tipoCambioActual ?? null
    const actualizadoAt = masReciente?.actualizadoAt ?? null

    // Valor actual total = suma de (cantidad de cada compra * su valorización más reciente disponible),
    // usando la última valorización cargada como proxy para las compras sin actualizar del mismo activo.
    const valorActualArs = precioActual != null
      ? cantidadTotal * precioActual * (tipoCambioActual ?? 1)
      : null

    const gananciaArs = valorActualArs != null ? valorActualArs - costoTotalArs : null
    const gananciaPct = gananciaArs != null && costoTotalArs > 0 ? (gananciaArs / costoTotalArs) * 100 : null

    return {
      key,
      broker,
      activo,
      tipo,
      moneda: compras[0].moneda,
      cantidadTotal,
      costoTotalArs,
      costoPromedioUnidad,
      precioActual,
      tipoCambioActual,
      valorActualArs,
      gananciaArs,
      gananciaPct,
      actualizadoAt,
      compras: compras.sort((a, b) => b.fechaCompra.localeCompare(a.fechaCompra)),
    }
  })
}

/** Calcula la próxima fecha de vencimiento de un servicio recurrente, a partir de su vencimiento actual. */
export function calcProximaFecha(fechaActual: string, frecuencia: "mensual" | "anual" | "unico"): string {
  const [year, month, day] = fechaActual.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  if (frecuencia === "mensual") date.setMonth(date.getMonth() + 1)
  if (frecuencia === "anual") date.setFullYear(date.getFullYear() + 1)

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Estado de vencimiento de un servicio, para decidir qué mostrar en la card. */
export function calcEstadoServicio(proximoPago: string, now = new Date()) {
  const todayStr = now.toISOString().split("T")[0]
  const diffDays = Math.round(
    (new Date(proximoPago).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays < 0) return { estado: "vencido" as const, diffDays }
  if (diffDays <= 5) return { estado: "por_vencer" as const, diffDays }
  return { estado: "vigente" as const, diffDays }
}
export type AllocationSlice = {
  tipo: string
  valorArs: number
  pct: number
}

/** Distribución del portfolio por tipo de activo (CEDEAR, CRYPTO, etc), a valor actual si está disponible. */
export function calcAllocationByType(positions: investmentPosition[]): AllocationSlice[] {
  const totals = new Map<string, number>()

  for (const p of positions) {
    const valor = p.valorActualArs ?? p.costoTotalArs
    totals.set(p.tipo, (totals.get(p.tipo) ?? 0) + valor)
  }

  const total = Array.from(totals.values()).reduce((a, b) => a + b, 0)

  return Array.from(totals.entries())
    .map(([tipo, valorArs]) => ({ tipo, valorArs, pct: total > 0 ? (valorArs / total) * 100 : 0 }))
    .sort((a, b) => b.valorArs - a.valorArs)
}

/** Serie de costo acumulado invertido en una posición a lo largo del tiempo, para graficar. */
export function calcCostoAcumulado(compras: investmentPurchase[]) {
  const ordenadas = [...compras].sort((a, b) => a.fechaCompra.localeCompare(b.fechaCompra))
  let acumulado = 0
  return ordenadas.map(c => {
    acumulado += c.totalCompraArs
    return { fecha: c.fechaCompra, costoAcumulado: acumulado }
  })
}

export type NetWorthSummary = {
  saldoLiquido: number
  ahorroArs: number
  valorInversiones: number
  patrimonioNeto: number
  patrimonioAValorActual: boolean // false si alguna inversión no tiene valuación cargada
}

/** Patrimonio neto = saldo líquido + ahorro (ARS+USD convertido) + inversiones (a valor actual si está disponible, si no a costo). */
export function calcNetWorth(
  saldo: number,
  ahorroArs: number,
  positions: investmentPosition[]
): NetWorthSummary {
  const valorInversiones = positions.reduce(
    (acc, p) => acc + (p.valorActualArs ?? p.costoTotalArs),
    0
  )
  const patrimonioAValorActual = positions.length === 0 || positions.every(p => p.valorActualArs != null)

  return {
    saldoLiquido: saldo,
    ahorroArs,
    valorInversiones,
    patrimonioNeto: saldo + ahorroArs + valorInversiones,
    patrimonioAValorActual,
  }
}