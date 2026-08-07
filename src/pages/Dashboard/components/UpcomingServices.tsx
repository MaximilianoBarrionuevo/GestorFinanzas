import { CalendarIcon, CheckCircle2, Pencil, Trash2 } from "lucide-react"
import type { services } from "../../../types/types"
import { calcEstadoServicio } from "../../../lib/Finance"

type Props = {
  services: services[]
  onPay: (service: services) => void
  onEdit: (service: services) => void
  onDelete: (id: string) => void
}

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export default function UpcomingServices({ services, onPay, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-slate-900">Próximos servicios</h2>
      <ul className="space-y-3">
        {services.map(s => {
          const { estado, diffDays } = calcEstadoServicio(s.proximo_pago)

          const badge =
            estado === "vencido"
              ? { text: `Vencido hace ${Math.abs(diffDays)}d`, className: "bg-rose-100 text-rose-700" }
              : estado === "por_vencer"
              ? { text: diffDays === 0 ? "Vence hoy" : `Vence en ${diffDays}d`, className: "bg-amber-100 text-amber-700" }
              : { text: "Todavía no vence", className: "bg-slate-100 text-slate-500" }

          return (
            <li
              key={s.id}
              className={`flex flex-wrap justify-between items-center gap-3 p-3 rounded-lg border transition ${
                estado === "vencido"
                  ? "bg-rose-50 border-rose-100"
                  : estado === "por_vencer"
                  ? "bg-amber-50 border-amber-100"
                  : "bg-slate-50 border-slate-100 hover:bg-slate-100"
              }`}
            >
              <div className="flex flex-col min-w-[140px]">
                <span className="font-medium text-gray-900">{s.nombre}</span>
                <div className="flex items-center text-sm mt-1 text-gray-500 gap-2 flex-wrap">
                  <span className="inline-flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {formatDate(s.proximo_pago)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.text}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="font-semibold text-red-600 text-lg">- ${s.monto.toLocaleString("es-AR")}</span>

                <button
                  onClick={() => onPay(s)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    estado === "vigente"
                      ? "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                  title="Registrar el pago de este período y mover el vencimiento al siguiente"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Descontar
                </button>

                <button
                  onClick={() => onEdit(s)}
                  className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-slate-700"
                  title="Editar servicio"
                >
                  <Pencil className="w-4 h-4" />
                </button>

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