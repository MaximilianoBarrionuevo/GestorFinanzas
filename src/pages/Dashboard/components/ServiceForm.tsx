import { useState } from "react"
import type { services } from "../../../types/types"

type ServiceFormProps = {
  userId: string
  onAdd: (service: Omit<services, "id">) => void
}

export default function ServiceForm({ userId, onAdd }: ServiceFormProps) {
  const [nombre, setNombre] = useState("")
  const [monto, setMonto] = useState(0)
  const [frecuencia, setFrecuencia] = useState<"mensual" | "anual" | "unico">("mensual")
  const [proximoPago, setProximoPago] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !monto || !proximoPago) return

    const newService: Omit<services, "id"> = {
      user_id: userId,
      nombre,
      monto,
      frecuencia,
      proximo_pago: proximoPago,
    }

    onAdd(newService)
    setNombre("")
    setMonto(0)
    setFrecuencia("mensual")
    setProximoPago("")
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded space-y-4 bg-white shadow">
      <h2 className="text-lg font-bold">Agregar Servicio</h2>

      <input
        type="text"
        placeholder="Nombre del servicio"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="number"
        placeholder="Monto"
        value={monto}
        onChange={(e) => setMonto(Number(e.target.value))}
        className="w-full p-2 border rounded"
      />

      <select
        value={frecuencia}
        onChange={(e) => setFrecuencia(e.target.value as "mensual" | "anual" | "unico")}
        className="w-full p-2 border rounded"
      >
        <option value="mensual">Mensual</option>
        <option value="anual">Anual</option>
        <option value="unico">Único</option>
      </select>

      <input
        type="date"
        value={proximoPago}
        onChange={(e) => setProximoPago(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button type="submit" className="px-4 py-2 bg-[#2E6F40] text-white rounded hover:bg-[#1f4e2a]">
        Agregar Servicio
      </button>
    </form>
  )
}
