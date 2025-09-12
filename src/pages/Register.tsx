import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../Services/AuthService";
import { Mail, Lock } from "lucide-react";

type RegisterFormData = {
  email: string;
  password: string;
};

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError("");

    try {
      await authService.register(data.email, data.password);
      alert("Cuenta creada. Revisá tu email para confirmar.");
      navigate("/login");
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2E6F40] to-[#A0D861] p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl">
        <img src="./LogoCashFlow.webp" alt="Logo Cash Flow" className="w-full object-contain h-52" />
        {/* Título */}
        <h2 className="text-3xl font-bold text-center mb-2 text-[#2E6F40]">
          Crear Cuenta
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Regístrate y comienza a gestionar tus finanzas
        </p>

        {error && (
          <div className="mb-4 text-red-500 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="email"
                className="w-full border rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2E6F40] transition"
                {...register("email", {
                  required: "El email es obligatorio",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Formato de email inválido",
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                className="w-full border rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2E6F40] transition"
                {...register("password", {
                  required: "La contraseña es obligatoria",
                  minLength: {
                    value: 6,
                    message: "Mínimo 6 caracteres",
                  },
                })}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#2E6F40] to-[#6CB979] text-white py-3 rounded-lg font-semibold shadow hover:opacity-90 transition"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="text-[#2E6F40] font-semibold hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
