import { useForm } from "react-hook-form"
import { useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import { Mail, Lock, CheckCircle2 } from "lucide-react"
import { useAuth } from "../Context/AuthContext"

type LoginFormData = {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = Boolean((location.state as { justRegistered?: boolean } | null)?.justRegistered)
  const { login } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError("")

    try {
      await login(data.email, data.password)
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#2E6F40] via-[#6CB979] to-[#A0D861]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col">
        <img src="./LogoCashFlow.webp" alt="Logo Cash Flow" className="w-full object-contain h-52" />
        <h2 className="text-2xl font-bold text-center mb-6 text-[#2E6F40]">
          Bienvenido de nuevo
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          Inicia sesión para seguir gestionando tus finanzas
        </p>

        {justRegistered && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg py-2 px-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Cuenta creada. Revisá tu email para confirmarla y después iniciá sesión.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Correo electrónico</label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#A0D861]">
              <Mail className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="email"
                placeholder="ejemplo@email.com"
                className="flex-1 outline-none text-sm"
                {...register("email", { required: "El correo es obligatorio" })}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#A0D861]">
              <Lock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="********"
                className="flex-1 outline-none text-sm"
                {...register("password", { required: "La contraseña es obligatoria" })}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#2E6F40] text-white py-2 rounded-lg hover:bg-[#1f4e2a] transition"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {/* Extra Links */}
        <p className="text-sm text-center text-gray-500 mt-6">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-[#2E6F40] font-semibold hover:underline">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  )
}