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
  created_at: string
}

export type newInvestmentPurchase = Omit<investmentPurchase, "id" | "user_id" | "created_at">
