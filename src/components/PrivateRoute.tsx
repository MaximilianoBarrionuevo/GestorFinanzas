import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../Context/AuthContext"
import LoadingScreen from "./LoadingScreen"

type Props = {
  children: ReactNode
}

/**
 * Protege una ruta a nivel de router: si no hay sesión, redirige a /login
 * antes de montar cualquier componente hijo. Evita depender de que cada
 * página implemente su propio chequeo de auth.
 */
export const PrivateRoute = ({ children }: Props) => {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}