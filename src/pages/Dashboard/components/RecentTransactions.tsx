import type { transactions } from "../../../types/types"

type Props = {
    transactions: transactions[]
}

export default function RecentTransactions({ transactions }: Props) {
    return (
        <div className="bg-white rounded-2xl shadow-md p-4 max-h-96 overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Últimos movimientos</h2>
            <ul className="divide-y divide-gray-200">
                {transactions.map(t => (
                    <li key={t.id} className="flex justify-between py-2">
                        <span className="w-1/3">{t.category}</span>
                        <span className={"w-1/3 " + (t.type === "egreso" ? "text-red-600" : "text-[#2E6F40]")}>
                            {t.type === "egreso" ? `- $${t.amount}` : `+ $${t.amount}`}
                        </span>
                        <span>{t.date}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
