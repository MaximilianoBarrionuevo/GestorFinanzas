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
  exchange_rate?: number | null
  total_compra: number
  total_compra_ars?: number | null
  precio_actual?: number | null
  tipo_cambio_actual?: number | null
  valor_actual_ars?: number | null
  actualizado_at?: string | null
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
  exchangeRate: row.exchange_rate ? Number(row.exchange_rate) : null,
  totalCompra: Number(row.total_compra),
  totalCompraArs: Number(row.total_compra_ars ?? row.total_compra),
  precioActual: row.precio_actual != null ? Number(row.precio_actual) : null,
  tipoCambioActual: row.tipo_cambio_actual != null ? Number(row.tipo_cambio_actual) : null,
  valorActualArs: row.valor_actual_ars != null ? Number(row.valor_actual_ars) : null,
  actualizadoAt: row.actualizado_at ?? null,
  created_at: row.created_at,
})

const SELECT_COLUMNS =
  "id, user_id, broker, activo, tipo, cantidad, precio_compra, moneda, fecha_compra, comision, exchange_rate, total_compra, total_compra_ars, precio_actual, tipo_cambio_actual, valor_actual_ars, actualizado_at, created_at"

export const investmentsService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("Inversiones")
      .select(SELECT_COLUMNS)
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
      exchange_rate: purchase.exchangeRate,
      total_compra: purchase.totalCompra,
      total_compra_ars: purchase.totalCompraArs,
    }

    const { data, error } = await supabase
      .from("Inversiones")
      .insert([payload])
      .select(SELECT_COLUMNS)
      .single()

    if (error) {
      throw error
    }

    return toModel(data as InvestmentRow)
  },

  /** Actualiza el valor actual de una compra puntual (precio de mercado + TCR si aplica). */
  async updateCurrentValue(
    id: string,
    params: { precioActual: number; tipoCambioActual: number | null; valorActualArs: number }
  ) {
    const { data, error } = await supabase
      .from("Inversiones")
      .update({
        precio_actual: params.precioActual,
        tipo_cambio_actual: params.tipoCambioActual,
        valor_actual_ars: params.valorActualArs,
        actualizado_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .single()

    if (error) {
      throw error
    }

    return toModel(data as InvestmentRow)
  },

  /** Corrige los datos de una compra ya cargada (fecha, cantidad, precio, etc). */
  async update(
    id: string,
    purchase: Omit<newInvestmentPurchase, never>
  ) {
    const payload = {
      broker: purchase.broker,
      activo: purchase.activo,
      tipo: purchase.tipo,
      cantidad: purchase.cantidad,
      precio_compra: purchase.precioCompra,
      moneda: purchase.moneda,
      fecha_compra: purchase.fechaCompra,
      comision: purchase.comision,
      exchange_rate: purchase.exchangeRate,
      total_compra: purchase.totalCompra,
      total_compra_ars: purchase.totalCompraArs,
    }

    const { data, error } = await supabase
      .from("Inversiones")
      .update(payload)
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .single()

    if (error) {
      throw error
    }

    return toModel(data as InvestmentRow)
  },

  async remove(id: string) {
    const { error } = await supabase.from("Inversiones").delete().eq("id", id)

    if (error) {
      throw error
    }
  },
}