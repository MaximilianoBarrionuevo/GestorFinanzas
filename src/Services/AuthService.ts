import { supabase } from "../supabaseClient";

export const authService = {
  register: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error("No se pudo crear el usuario");

    const { error: dbError } = await supabase.from("Users").insert([
      {
        id: user.id,
        email,
      },
    ]);

    if (dbError) throw dbError;

    return user;
  },

  login: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  logout: async () => {
    return await supabase.auth.signOut();
  },
};
