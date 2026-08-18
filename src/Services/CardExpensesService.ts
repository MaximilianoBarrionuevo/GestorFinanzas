import { supabase } from "../supabaseClient"
import type { cardExpense, newCardExpense } from "../types/types"

type CardExpenseRow = {
  id: string
  user_id: string
  tarjeta_id: string
  descripcion: string
  monto_total: number
  cuotas_total: number
  fecha_compra: string
  created_at: string
}

const toModel = (row: CardExpenseRow): cardExpense => ({
  id: row.id,
  user_id: row.user_id,
  tarjetaId: row.tarjeta_id,
  descripcion: row.descripcion,
  montoTotal: Number(row.monto_total),
  cuotasTotal: Number(row.cuotas_total),
  fechaCompra: row.fecha_compra,
  created_at: row.created_at,
})

const SELECT_COLUMNS = "id, user_id, tarjeta_id, descripcion, monto_total, cuotas_total, fecha_compra, created_at"

export const cardExpensesService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("GastosTarjeta")
      .select(SELECT_COLUMNS)
      .eq("user_id", userId)
      .order("fecha_compra", { ascending: false })

    if (error) throw error
    return (data as CardExpenseRow[]).map(toModel)
  },

  async create(userId: string, expense: newCardExpense) {
    const payload = {
      user_id: userId,
      tarjeta_id: expense.tarjetaId,
      descripcion: expense.descripcion,
      monto_total: expense.montoTotal,
      cuotas_total: expense.cuotasTotal,
      fecha_compra: expense.fechaCompra,
    }

    const { data, error } = await supabase.from("GastosTarjeta").insert([payload]).select(SELECT_COLUMNS).single()

    if (error) throw error
    return toModel(data as CardExpenseRow)
  },

  async update(userId: string, id: string, expense: newCardExpense) {
    const payload = {
      tarjeta_id: expense.tarjetaId,
      descripcion: expense.descripcion,
      monto_total: expense.montoTotal,
      cuotas_total: expense.cuotasTotal,
      fecha_compra: expense.fechaCompra,
    }

    const { data, error } = await supabase
      .from("GastosTarjeta")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error
    return toModel(data as CardExpenseRow)
  },

  async remove(userId: string, id: string) {
    const { error } = await supabase.from("GastosTarjeta").delete().eq("id", id).eq("user_id", userId)
    if (error) throw error
  },
}
