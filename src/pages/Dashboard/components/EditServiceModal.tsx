import { useEffect, useState } from "react"
import type { services } from "../../../types/types"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<Omit<services, "id" | "user_id" | "created_at">>) => void
  service: services | null
}

export default function EditServiceModal({ isOpen, onClose, onSave, service }: Props) {
  const [formData, setFormData] = useState<Partial<services>>({})

  useEffect(() => {
    if (service) {
      setFormData({
        nombre: service.nombre,
        monto: service.monto,
        frecuencia: service.frecuencia,
        proximo_pago: service.proximo_pago,
      })
    }
  }, [service])

  if (!isOpen || !service) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === "monto" ? Number(value) : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!service.id) return
    onSave(service.id, formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-[#2E6F40] mb-4">Editar servicio</h2>
        <p className="text-sm text-slate-500 -mt-3 mb-4">
          Por ejemplo, si te aumentó la cuota del gimnasio, actualizá el monto acá: el próximo "Descontar" ya va a usar el nuevo valor.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre || ""}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Monto</label>
            <input
              type="number"
              name="monto"
              value={formData.monto || ""}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Frecuencia</label>
            <select
              name="frecuencia"
              value={formData.frecuencia || "mensual"}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
              <option value="unico">Único</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Próximo pago</label>
            <input
              type="date"
              name="proximo_pago"
              value={formData.proximo_pago || ""}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#2E6F40] text-white hover:bg-[#1f4e2a]">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}