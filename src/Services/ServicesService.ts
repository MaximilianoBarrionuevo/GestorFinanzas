import { supabase } from "../supabaseClient"
import type { services } from "../types/types"

type NewService = Omit<services, "id" | "user_id" | "created_at">

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
}
