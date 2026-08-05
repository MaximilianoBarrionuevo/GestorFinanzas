export type transactions = {
  id: string
  user_id: string
  amount: number
  category: string
  description: string
  date: string
  type: "ingreso" | "egreso"
}

export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

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

export type investmentPurchase = {
  id: string
  user_id: string
  broker: string
  activo: string
  tipo: investmentType
  cantidad: number
  precioCompra: number
  moneda: investmentCurrency
  fechaCompra: string
  comision: number
  exchangeRate: number | null
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

// Posición consolidada: agrupa todas las compras de un mismo activo+broker
// para mostrar cantidad total, costo promedio y ganancia/pérdida.
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
  actualizadoAt: string | null
  compras: investmentPurchase[]
}