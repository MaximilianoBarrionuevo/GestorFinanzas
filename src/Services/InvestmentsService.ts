import { supabase } from "../supabaseClient"
import type { investmentPurchase, newInvestmentPurchase } from "../types/types"

type InvestmentRow = {
  id: string
  user_id: string
  broker: string
  activo: string
  tipo: investmentPurchase["tipo"]
  cantidad: number
  precio_compra: number
  moneda: investmentPurchase["moneda"]
  fecha_compra: string
  comision: number | null
  total_compra: number
  created_at: string
}

const toModel = (row: InvestmentRow): investmentPurchase => ({
  id: row.id,
  user_id: row.user_id,
  broker: row.broker,
  activo: row.activo,
  tipo: row.tipo,
  cantidad: Number(row.cantidad),
  precioCompra: Number(row.precio_compra),
  moneda: row.moneda,
  fechaCompra: row.fecha_compra,
  comision: Number(row.comision || 0),
  totalCompra: Number(row.total_compra),
  created_at: row.created_at,
})

export const investmentsService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("Inversiones")
      .select("id, user_id, broker, activo, tipo, cantidad, precio_compra, moneda, fecha_compra, comision, total_compra, created_at")
      .eq("user_id", userId)
      .order("fecha_compra", { ascending: false })

    if (error) {
      throw error
    }

    return (data as InvestmentRow[]).map(toModel)
  },

  async create(userId: string, purchase: newInvestmentPurchase) {
    const payload = {
      user_id: userId,
      broker: purchase.broker,
      activo: purchase.activo,
      tipo: purchase.tipo,
      cantidad: purchase.cantidad,
      precio_compra: purchase.precioCompra,
      moneda: purchase.moneda,
      fecha_compra: purchase.fechaCompra,
      comision: purchase.comision,
      total_compra: purchase.totalCompra,
    }

    const { data, error } = await supabase
      .from("Inversiones")
      .insert([payload])
      .select("id, user_id, broker, activo, tipo, cantidad, precio_compra, moneda, fecha_compra, comision, total_compra, created_at")
      .single()

    if (error) {
      throw error
    }

    return toModel(data as InvestmentRow)
  },
}
