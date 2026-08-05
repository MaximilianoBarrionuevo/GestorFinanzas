import type { services } from "../../../types/types"
import { CalendarIcon, Trash2 } from "lucide-react"

type Props = {
  services: services[]
  onDelete: (id: string) => void
}

export default function UpcomingServices({ services, onDelete }: Props) {
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-")
    return `${day}/${month}/${year}`
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-slate-900">Próximos servicios</h2>
      <ul className="space-y-3">
        {services.map(s => {
          const isOverdue = s.proximo_pago < today
          return (
            <li
              key={s.id}
              className={`flex justify-between items-center p-3 rounded-lg border transition ${
                isOverdue
                  ? "bg-rose-50 border-rose-100"
                  : "bg-slate-50 border-slate-100 hover:bg-slate-100"
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{s.nombre}</span>
                <div className={`flex items-center text-sm mt-1 ${isOverdue ? "text-rose-600" : "text-gray-500"}`}>
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {isOverdue ? "Venció el " : "Próximo pago: "}
                  {formatDate(s.proximo_pago)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold text-red-600 text-lg">- ${s.monto.toLocaleString("es-AR")}</span>
                <button
                  onClick={() => s.id && onDelete(s.id)}
                  className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-rose-600"
                  title="Eliminar servicio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          )
        })}
        {services.length === 0 && (
          <li className="text-gray-400 text-center py-4">No hay servicios próximos</li>
        )}
      </ul>
    </div>
  )
}