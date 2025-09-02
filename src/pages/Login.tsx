import { useForm } from "react-hook-form";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

type LoginFormData = {
    email: string;
    password: string;
};

export default function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>();

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        setError("");

        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            setError(error.message);
        } else {
            navigate("/dashboard");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white shadow-md rounded-lg p-6 w-full max-w-md"
            >
                <h2 className="text-2xl font-bold mb-4">Iniciar sesión</h2>

                <input
                    type="email"
                    placeholder="Correo electrónico"
                    className="w-full p-2 border rounded mb-2"
                    {...register("email", { required: "El correo es obligatorio" })}
                />
                {errors.email && (
                    <p className="text-red-500 text-sm mb-2">{errors.email.message}</p>
                )}

                <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full p-2 border rounded mb-2"
                    {...register("password", {
                        required: "La contraseña es obligatoria",
                    })}
                />
                {errors.password && (
                    <p className="text-red-500 text-sm mb-2">
                        {errors.password.message}
                    </p>
                )}

                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                    disabled={loading}
                >
                    {loading ? "Ingresando..." : "Ingresar"}
                </button>
            </form>
        </div>
    );
}
