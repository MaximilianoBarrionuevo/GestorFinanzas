import { supabase } from "../supabaseClient";
import type { User } from "../types/types";

export const userService = {

  async createUser(user: User) {
    const { data, error } = await supabase
      .from("Users")
      .insert([
        {
          email: user.email,
          name: user.name,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creando usuario:", error);
      throw error;
    }

    return data;
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Error obteniendo usuario:", error);
      throw error;
    }

    return data;
  },
};
