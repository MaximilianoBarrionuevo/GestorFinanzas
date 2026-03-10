import { supabase } from "../supabaseClient"
import type { savingsBalance } from "../types/types"

type SavingsRow = {
  user_id: string
  ars_balance: number
  usd_balance: number
}

const toModel = (row: SavingsRow): savingsBalance => ({
  user_id: row.user_id,
  ARS: Number(row.ars_balance) || 0,
  USD: Number(row.usd_balance) || 0,
})

export const savingsService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("savings_balances")
      .select("user_id, ars_balance, usd_balance")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (data) {
      return toModel(data as SavingsRow)
    }

    const { data: created, error: createError } = await supabase
      .from("savings_balances")
      .upsert([{ user_id: userId, ars_balance: 0, usd_balance: 0 }], { onConflict: "user_id" })
      .select("user_id, ars_balance, usd_balance")
      .single()

    if (createError) {
      throw createError
    }

    return toModel(created as SavingsRow)
  },

  async updateByUserId(userId: string, balances: { ARS: number; USD: number }) {
    const { data, error } = await supabase
      .from("savings_balances")
      .upsert(
        [{ user_id: userId, ars_balance: balances.ARS, usd_balance: balances.USD }],
        { onConflict: "user_id" }
      )
      .select("user_id, ars_balance, usd_balance")
      .single()

    if (error) {
      throw error
    }

    return toModel(data as SavingsRow)
  },
}