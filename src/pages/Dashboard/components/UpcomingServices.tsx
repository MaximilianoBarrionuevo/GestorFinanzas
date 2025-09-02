import type { services } from "../../../types/types"

type Props = {
  services: services[]
}

export default function UpcomingServices({ services }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <h2 className="text-lg font-semibold mb-2">Próximos servicios</h2>
      <ul className="divide-y divide-gray-200">
        {services.map(s => (
          <li key={s.id} className="flex justify-between py-2">
            <span>{s.name} (día {s.charge_day})</span>
            <span className="text-accent">- ${s.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
