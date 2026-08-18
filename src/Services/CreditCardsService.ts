import { supabase } from "../supabaseClient"
import type { creditCard, newCreditCard } from "../types/types"

type CardRow = {
  id: string
  user_id: string
  nombre: string
  banco: string | null
  cupo: number | null
  dia_cierre: number
  dia_vencimiento: number
  ultimo_ciclo_pagado: number | null
  created_at: string
}

const toModel = (row: CardRow): creditCard => ({
  id: row.id,
  user_id: row.user_id,
  nombre: row.nombre,
  banco: row.banco,
  cupo: row.cupo != null ? Number(row.cupo) : null,
  diaCierre: Number(row.dia_cierre),
  diaVencimiento: Number(row.dia_vencimiento),
  ultimoCicloPagado: row.ultimo_ciclo_pagado,
  created_at: row.created_at,
})

const SELECT_COLUMNS = "id, user_id, nombre, banco, cupo, dia_cierre, dia_vencimiento, ultimo_ciclo_pagado, created_at"

export const creditCardsService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("Tarjetas")
      .select(SELECT_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return (data as CardRow[]).map(toModel)
  },

  async create(userId: string, card: newCreditCard) {
    const payload = {
      user_id: userId,
      nombre: card.nombre,
      banco: card.banco,
      cupo: card.cupo,
      dia_cierre: card.diaCierre,
      dia_vencimiento: card.diaVencimiento,
    }

    const { data, error } = await supabase.from("Tarjetas").insert([payload]).select(SELECT_COLUMNS).single()

    if (error) throw error
    return toModel(data as CardRow)
  },

  async update(userId: string, id: string, card: newCreditCard) {
    const payload = {
      nombre: card.nombre,
      banco: card.banco,
      cupo: card.cupo,
      dia_cierre: card.diaCierre,
      dia_vencimiento: card.diaVencimiento,
    }

    const { data, error } = await supabase
      .from("Tarjetas")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error
    return toModel(data as CardRow)
  },

  /** Marca el ciclo indicado (año*12+mes) como pagado, para no duplicar el pago del mismo ciclo. */
  async markCyclePaid(userId: string, id: string, cycleKey: number) {
    const { data, error } = await supabase
      .from("Tarjetas")
      .update({ ultimo_ciclo_pagado: cycleKey })
      .eq("id", id)
      .eq("user_id", userId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) throw error
    return toModel(data as CardRow)
  },

  async remove(userId: string, id: string) {
    const { error } = await supabase.from("Tarjetas").delete().eq("id", id).eq("user_id", userId)
    if (error) throw error
  },
}
