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
        { title: "Saldo Actual", value: `$${data.saldo}`, color: "bg-[#2E6F40] text-[#F4F5F6]" },
        { title: "Ingresos", value: `$${data.ingresos}`, color: "bg-[#A0D861] text-[#2D2D2D]" },
        { title: "Egresos", value: `$${data.egresos}`, color: "bg-[#47cc6a] text-[#2D2D2D]" },
        { title: "Servicios", value: `$${data.servicios}`, color: "bg-[#2E6F40] bg-opacity-80 text-[#F4F5F6]" },
    ];


    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => (
                <div key={i} className={`rounded-2xl shadow-md p-4 text-white ${card.color}`}>
                    <h2 className="text-sm">{card.title}</h2>
                    <p className="text-2xl font-bold">{card.value}</p>
                </div>
            ))}
        </div>
    )
}
