import type { services } from "../../../types/types"
import { CalendarIcon } from "lucide-react" // si usás lucide-react para íconos, opcional

type Props = {
  services: services[]
}

export default function UpcomingServices({ services }: Props) {
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-")
    return `${day}/${month}/${year}`
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Próximos servicios</h2>
      <ul className="space-y-3">
        {services.map(s => (
          <li
            key={s.id}
            className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{s.nombre}</span>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Próximo pago: {formatDate(s.proximo_pago)}
              </div>
            </div>
            <span className="font-semibold text-red-600 text-lg">- ${s.monto}</span>
          </li>
        ))}
        {services.length === 0 && (
          <li className="text-gray-400 text-center py-4">No hay servicios próximos</li>
        )}
      </ul>
    </div>
  )
}
