import type {
  cardCycleItem,
  cardCycleSummary,
  cardExpense,
  creditCard,
  investmentPosition,
  investmentPurchase,
  investmentType,
  services,
  transactions,
} from "../types/types"

/** Etiquetas legibles para cada tipo de activo, compartidas entre la carga de compras y la ficha de posición. */
export const tipoLabel: Record<investmentType, string> = {
  CEDEAR: "CEDEAR",
  ACCION: "Acción",
  CRYPTO: "Crypto",
  BONO: "Bono",
  ETF: "ETF",
  OTRO: "Otro",
}

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
 * Agrupa operaciones (compras y ventas) de inversión en posiciones
 * consolidadas por activo + broker + tipo, llevando el costo promedio
 * ponderado de lo que queda tenido y la ganancia/pérdida realizada por
 * ventas, además de la no realizada si hay valuación actual cargada.
 */
export function buildInvestmentPositions(purchases: investmentPurchase[]): investmentPosition[] {
  const groups = new Map<string, investmentPurchase[]>()

  for (const p of purchases) {
    const key = `${p.broker}::${p.activo}::${p.tipo}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  return Array.from(groups.entries()).map(([key, ops]) => {
    const [broker, activo, tipo] = key.split("::") as [string, string, investmentPurchase["tipo"]]

    // Procesamos las operaciones en orden cronológico llevando costo promedio
    // ponderado: cada venta reduce cantidad y costo en proporción al costo
    // promedio vigente en ese momento; la diferencia contra lo recibido en
    // la venta es ganancia/pérdida realizada.
    // "fechaCompra" solo tiene precisión de día: si dos operaciones caen el
    // mismo día (típico al cargar todo junto), se desempata por created_at
    // (con hora) para respetar el orden real en que se cargaron.
    const cronologico = [...ops].sort((a, b) => {
      const porFecha = a.fechaCompra.localeCompare(b.fechaCompra)
      if (porFecha !== 0) return porFecha
      return a.created_at.localeCompare(b.created_at)
    })

    let cantidadTotal = 0
    let costoTotalArs = 0
    let gananciaRealizadaArs = 0

    for (const op of cronologico) {
      if (op.operacion === "venta") {
        const costoPromedioVigente = cantidadTotal > 0 ? costoTotalArs / cantidadTotal : 0
        // Por las dudas, nunca "vender" más de lo que la posición tenía hasta ese momento.
        const cantidadVendida = Math.min(op.cantidad, cantidadTotal)
        const costoDeLoVendido = cantidadVendida * costoPromedioVigente

        gananciaRealizadaArs += op.totalCompraArs - costoDeLoVendido
        cantidadTotal -= cantidadVendida
        costoTotalArs -= costoDeLoVendido
      } else {
        cantidadTotal += op.cantidad
        costoTotalArs += op.totalCompraArs
      }
    }

    const costoPromedioUnidad = cantidadTotal > 0 ? costoTotalArs / cantidadTotal : 0

    // Usamos la valuación actual más reciente entre las operaciones del grupo.
    const conValuacion = ops
      .filter(c => c.valorActualArs != null)
      .sort((a, b) => (b.actualizadoAt ?? "").localeCompare(a.actualizadoAt ?? ""))

    const masReciente = conValuacion[0]
    const precioActual = masReciente?.precioActual ?? null
    const tipoCambioActual = masReciente?.tipoCambioActual ?? null
    const actualizadoAt = masReciente?.actualizadoAt ?? null

    // Valor actual total = cantidad tenida hoy * última valorización cargada.
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
      moneda: ops[0].moneda,
      cantidadTotal,
      costoTotalArs,
      costoPromedioUnidad,
      precioActual,
      tipoCambioActual,
      valorActualArs,
      gananciaArs,
      gananciaPct,
      gananciaRealizadaArs,
      actualizadoAt,
      compras: ops.sort((a, b) => b.fechaCompra.localeCompare(a.fechaCompra)),
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
    if (valor <= 0) continue // posiciones cerradas (vendidas por completo) no aportan a la distribución
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

// ---------------------------------------------------------------------------
// Tarjetas de crédito: ciclos de facturación y cuotas.
//
// No se guarda una fila por cuota: cada gasto guarda el monto total y la
// cantidad de cuotas, y acá se calcula en qué ciclo (mes de cierre) cae cada
// una, a partir de la fecha de compra y el día de cierre de la tarjeta.
// ---------------------------------------------------------------------------

/** Parsea "YYYY-MM-DD" como fecha local, evitando el corrimiento de un día que da `new Date(str)` (UTC). */
function parseIsoDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Clave del ciclo (año*12 + mes, absoluto) al que pertenece una fecha: si cae
 * en o antes del día de cierre, es el ciclo que cierra ese mismo mes; si cae
 * después, es el que cierra el mes siguiente.
 */
function cardCycleKey(date: Date, diaCierre: number): number {
  const monthIndex = date.getFullYear() * 12 + date.getMonth()
  return date.getDate() <= diaCierre ? monthIndex : monthIndex + 1
}

/** Fecha de cierre (día `diaCierre`) del ciclo identificado por `cycleKey`. */
function cycleKeyToCierreDate(cycleKey: number, diaCierre: number): Date {
  const year = Math.floor(cycleKey / 12)
  const month = cycleKey % 12
  return new Date(year, month, diaCierre)
}

/** Primera fecha >= `desde` cuyo día del mes es `dia` (para calcular el próximo vencimiento). */
function proximaFechaConDia(desde: Date, dia: number): Date {
  const candidata = new Date(desde.getFullYear(), desde.getMonth(), dia)
  if (candidata < desde) {
    return new Date(desde.getFullYear(), desde.getMonth() + 1, dia)
  }
  return candidata
}

/** Clave del ciclo vigente hoy para una tarjeta, dado su día de cierre. */
export function currentCardCycleKey(diaCierre: number, now = new Date()): number {
  return cardCycleKey(now, diaCierre)
}

/**
 * Resumen del ciclo actual de una tarjeta: cuánto se acumuló hasta ahora (solo
 * las cuotas que caen en el ciclo abierto), cuánto queda comprometido contra
 * el cupo (ciclo actual + cuotas futuras todavía no cerradas), y el detalle
 * de qué cuota de qué gasto aporta al ciclo actual.
 */
export function buildCardCycleSummary(
  tarjeta: creditCard,
  gastos: cardExpense[],
  now = new Date()
): cardCycleSummary {
  const todayCycle = cardCycleKey(now, tarjeta.diaCierre)
  const fechaCierreActual = cycleKeyToCierreDate(todayCycle, tarjeta.diaCierre)
  const fechaVencimientoActual = proximaFechaConDia(fechaCierreActual, tarjeta.diaVencimiento)

  let resumenActual = 0
  let deudaPendiente = 0
  const items: cardCycleItem[] = []

  for (const gasto of gastos) {
    const baseCycle = cardCycleKey(parseIsoDate(gasto.fechaCompra), tarjeta.diaCierre)
    const montoCuota = gasto.montoTotal / gasto.cuotasTotal

    for (let k = 1; k <= gasto.cuotasTotal; k++) {
      const cycle = baseCycle + (k - 1)
      if (cycle === todayCycle) {
        resumenActual += montoCuota
        items.push({ gasto, cuotaNumero: k, montoCuota })
      }
      // La deuda pendiente incluye el ciclo actual (todavía no se pagó) y las cuotas futuras.
      if (cycle >= todayCycle) {
        deudaPendiente += montoCuota
      }
    }
  }

  const cupoDisponible = tarjeta.cupo != null ? tarjeta.cupo - deudaPendiente : null
  const cicloActualPagado = tarjeta.ultimoCicloPagado != null && tarjeta.ultimoCicloPagado >= todayCycle

  return {
    resumenActual,
    deudaPendiente,
    cupoDisponible,
    fechaCierreActual: toIsoDate(fechaCierreActual),
    fechaVencimientoActual: toIsoDate(fechaVencimientoActual),
    cicloActualPagado,
    items: items.sort((a, b) => a.gasto.fechaCompra.localeCompare(b.gasto.fechaCompra)),
  }
}