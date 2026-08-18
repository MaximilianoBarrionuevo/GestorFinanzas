export type transactions = {
  id: string
  user_id: string
  amount: number
  category: string
  description: string
  date: string
  type: "ingreso" | "egreso"
}

export type services = {
  id?: string
  user_id: string
  nombre: string
  monto: number
  frecuencia: "mensual" | "anual" | "unico"
  proximo_pago: string
  created_at?: string
}

export type savingsBalance = {
  user_id: string
  ARS: number
  USD: number
}

export type investmentType = "CEDEAR" | "ACCION" | "CRYPTO" | "BONO" | "ETF" | "OTRO"
export type investmentCurrency = "USD" | "ARS"
export type investmentOperation = "compra" | "venta"

export type investmentPurchase = {
  id: string
  user_id: string
  broker: string
  activo: string
  tipo: investmentType
  // "compra": suma a la posición. "venta": la reduce y realiza ganancia/pérdida
  // contra el costo promedio vigente al momento de la operación.
  operacion: investmentOperation
  cantidad: number
  // Precio por unidad de la operación: precio pagado si es compra, precio
  // cobrado si es venta.
  precioCompra: number
  moneda: investmentCurrency
  fechaCompra: string
  comision: number
  exchangeRate: number | null
  // Total de la operación ya neto de comisión: lo pagado (compra, incluye
  // comisión) o lo recibido (venta, descuenta comisión).
  totalCompra: number
  totalCompraArs: number
  // Valuación actual (opcional): permite calcular ganancia/pérdida no realizada.
  precioActual: number | null
  tipoCambioActual: number | null
  valorActualArs: number | null
  actualizadoAt: string | null
  created_at: string
}

export type newInvestmentPurchase = Omit<
  investmentPurchase,
  "id" | "user_id" | "created_at" | "precioActual" | "tipoCambioActual" | "valorActualArs" | "actualizadoAt"
>

// Posición consolidada: agrupa todas las operaciones (compras y ventas) de
// un mismo activo+broker+tipo para mostrar cantidad tenida, costo promedio
// de lo que queda, ganancia/pérdida no realizada y realizada.
export type investmentPosition = {
  key: string
  broker: string
  activo: string
  tipo: investmentType
  moneda: investmentCurrency
  cantidadTotal: number
  costoTotalArs: number
  costoPromedioUnidad: number
  precioActual: number | null
  tipoCambioActual: number | null
  valorActualArs: number | null
  gananciaArs: number | null
  gananciaPct: number | null
  // Ganancia/pérdida ya realizada por ventas previas de esta posición
  // (contra el costo promedio vigente al momento de cada venta).
  gananciaRealizadaArs: number
  actualizadoAt: string | null
  compras: investmentPurchase[]
}

export type creditCard = {
  id: string
  user_id: string
  nombre: string
  banco: string | null
  cupo: number | null
  diaCierre: number // 1-28
  diaVencimiento: number // 1-28
  // Clave del último ciclo (año*12+mes) marcado como pagado con "Pagar resumen".
  ultimoCicloPagado: number | null
  created_at: string
}

export type newCreditCard = Omit<creditCard, "id" | "user_id" | "ultimoCicloPagado" | "created_at">

// Una compra con tarjeta de crédito, potencialmente en cuotas. No se guarda
// una fila por cuota: se calcula en qué ciclo cae cada una a partir de
// fechaCompra + el día de cierre de la tarjeta.
export type cardExpense = {
  id: string
  user_id: string
  tarjetaId: string
  descripcion: string
  montoTotal: number
  cuotasTotal: number
  fechaCompra: string
  created_at: string
}

export type newCardExpense = Omit<cardExpense, "id" | "user_id" | "created_at">

// Resumen del ciclo actual de una tarjeta: cuánto se acumuló hasta ahora,
// cupo disponible, y el detalle de qué cuota de qué gasto aporta a este ciclo.
export type cardCycleItem = {
  gasto: cardExpense
  cuotaNumero: number
  montoCuota: number
}

export type cardCycleSummary = {
  resumenActual: number
  deudaPendiente: number
  cupoDisponible: number | null
  fechaCierreActual: string
  fechaVencimientoActual: string
  cicloActualPagado: boolean
  items: cardCycleItem[]
}