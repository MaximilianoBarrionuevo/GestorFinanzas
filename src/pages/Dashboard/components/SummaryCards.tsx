import { ArrowDownRight, ArrowUpRight, Landmark, Wallet } from "lucide-react"

type Props = {
  data: {
    saldo: number
    ingresos: number
    egresos: number
    servicios: number
  }
}

export default function SummaryCards({ data }: Props) {
  const cards = [
    {
      title: "Saldo Actual",
      value: data.saldo,
      icon: Wallet,
      color: "from-emerald-600 to-emerald-500",
      textColor: "text-white",
    },
    {
      title: "Ingresos",
      value: data.ingresos,
      icon: ArrowUpRight,
      color: "from-emerald-200 to-lime-200",
      textColor: "text-slate-800",
    },
    {
      title: "Egresos",
      value: data.egresos,
      icon: ArrowDownRight,
      color: "from-rose-100 to-orange-100",
      textColor: "text-slate-800",
    },
    {
      title: "Servicios",
      value: data.servicios,
      icon: Landmark,
      color: "from-teal-100 to-emerald-100",
      textColor: "text-slate-800",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon
        return (
          <div
            key={i}
            className={`rounded-2xl border border-white/70 shadow-md p-4 bg-gradient-to-br ${card.color} ${card.textColor}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xs md:text-sm opacity-80">{card.title}</h2>
                <p className="text-xl md:text-2xl font-bold mt-1">
                  ${card.value.toLocaleString("es-AR")}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-white/40">
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}