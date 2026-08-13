import { useState } from "react"
import { CalendarClock, DollarSign, Repeat, Tag } from "lucide-react"
import type { services } from "../../../types/types"

type ServiceFormProps = {
  userId: string
  onAdd: (service: Omit<services, "id">) => void | Promise<void>
}

export default function ServiceForm({ userId, onAdd }: ServiceFormProps) {
  const [nombre, setNombre] = useState("")
  const [monto, setMonto] = useState(0)
  const [frecuencia, setFrecuencia] = useState<"mensual" | "anual" | "unico">("mensual")
  const [proximoPago, setProximoPago] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!nombre || !monto || monto <= 0 || !proximoPago) {
      setError("Completá el nombre, un monto mayor a cero y la fecha de vencimiento")
      return
    }

    const newService: Omit<services, "id"> = {
      user_id: userId,
      nombre,
      monto,
      frecuencia,
      proximo_pago: proximoPago,
    }

    setSaving(true)
    await onAdd(newService)
    setSaving(false)

    setNombre("")
    setMonto(0)
    setFrecuencia("mensual")
    setProximoPago("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 border border-slate-100 rounded-2xl bg-white/90 backdrop-blur-sm shadow-md space-y-5"
    >
      <h2 className="text-xl font-bold text-[#2E6F40] text-center">Agregar servicio</h2>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del servicio
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-200">
          <Tag className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Ej: Netflix"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
        </div>
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-200">
          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Ej: 5000"
            value={monto || ""}
            onChange={e => setMonto(Number(e.target.value))}
            className="flex-1 outline-none text-sm"
          />
        </div>
      </div>

      {/* Frecuencia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-200">
          <Repeat className="w-5 h-5 text-gray-400 mr-2" />
          <select
            value={frecuencia}
            onChange={e => setFrecuencia(e.target.value as "mensual" | "anual" | "unico")}
            className="flex-1 outline-none text-sm bg-transparent"
          >
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
            <option value="unico">Único</option>
          </select>
        </div>
      </div>

      {/* Próximo vencimiento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Próximo vencimiento
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-200">
          <CalendarClock className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="date"
            value={proximoPago}
            onChange={e => setProximoPago(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#2E6F40] text-white py-2.5 rounded-xl hover:bg-[#1f4e2a] transition font-medium disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Agregar servicio"}
      </button>
    </form>
  )
}
