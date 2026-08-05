import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "../supabaseClient"
import type { User } from "@supabase/supabase-js"
import { useNavigate, useLocation } from "react-router-dom"
import { useToast } from "./ToastContext"

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const { showError } = useToast()

  useEffect(() => {
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error("Error obteniendo sesión:", err);
        showError("No pudimos verificar tu sesión. Probá recargar la página.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && location.pathname === "/") {
      navigate("/dashboard", { replace: true })
    }
  }, [user, location, navigate])

  const login = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setLoading(false)
  }

  const logout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      navigate('/')
    } catch (err) {
      console.error("Error cerrando sesión:", err)
      showError("No se pudo cerrar sesión. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}