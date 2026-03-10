import { supabase } from "../supabaseClient"
import type { transactions } from "../types/types"

type NewTransaction = Omit<transactions, "id" | "user_id">
type UpdateTransaction = Partial<Omit<transactions, "id" | "user_id">>

export const transactionService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("Transacciones")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return data as transactions[]
  },

  async getRecentByUserId(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from("Transacciones")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return data as transactions[]
  },

  async create(userId: string, transaction: NewTransaction) {
    const { data, error } = await supabase
      .from("Transacciones")
      .insert([{ ...transaction, user_id: userId }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as transactions
  },

  async update(id: string, updatedData: UpdateTransaction) {
    const { data, error } = await supabase
      .from("Transacciones")
      .update(updatedData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as transactions
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("Transacciones")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      throw error
    }

    return data as transactions
  },

  async remove(id: string) {
    const { error } = await supabase.from("Transacciones").delete().eq("id", id)

    if (error) {
      throw error
    }
  },
}