import { supabase } from "../supabaseClient"
import type { services } from "../types/types"

type NewService = Omit<services, "id" | "user_id" | "created_at">
type UpdateService = Partial<Omit<services, "id" | "user_id" | "created_at">>

export const servicesService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("Servicios")
      .select("*")
      .eq("user_id", userId)
      .order("proximo_pago", { ascending: true })

    if (error) {
      throw error
    }

    return data as services[]
  },

  async create(userId: string, service: NewService) {
    const { data, error } = await supabase
      .from("Servicios")
      .insert([{ ...service, user_id: userId }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as services
  },

  async update(userId: string, id: string, updatedData: UpdateService) {
    const { data, error } = await supabase
      .from("Servicios")
      .update(updatedData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as services
  },

  async remove(userId: string, id: string) {
    const { error } = await supabase
      .from("Servicios")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      throw error
    }
  },

  async getById(userId: string, id: string) {
    const { data, error } = await supabase
      .from("Servicios")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) {
      throw error
    }

    return data as services
  },
}