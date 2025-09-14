import type { transactions } from "../../../types/types"
import { ArrowDownCircle, ArrowUpCircle, Pencil, Trash2 } from "lucide-react"

type Props = {
  transactions: transactions[]
  onDelete: (transaction: transactions) => void
  onEdit: (transaction: transactions) => void
}

export default function RecentTransactions({ transactions, onDelete, onEdit }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 max-h-96 overflow-auto">
      <h2 className="text-xl font-bold mb-4 text-[#2E6F40]">Últimos movimientos</h2>

      <ul className="space-y-4">
        {transactions.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:shadow-md transition"
          >
            {/* Info de la transacción */}
            <div className="flex items-start space-x-3">
              {t.type === "egreso" ? (
                <ArrowDownCircle className="w-6 h-6 text-red-500 mt-1" />
              ) : (
                <ArrowUpCircle className="w-6 h-6 text-[#2E6F40] mt-1" />
              )}

              <div>
                <span className="font-semibold text-gray-800">{t.category}</span>
                {t.description && (
                  <p className="text-sm text-gray-500">{t.description}</p>
                )}
              </div>
            </div>

            {/* Acciones y monto */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p
                  className={`font-bold ${
                    t.type === "egreso" ? "text-red-600" : "text-[#2E6F40]"
                  }`}
                >
                  {t.type === "egreso" ? `- $${t.amount}` : `+ $${t.amount}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">{t.date}</p>
              </div>

              {/* Botones */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => onEdit(t)}
                  className="p-1 rounded hover:bg-gray-200"
                  title="Editar"
                >
                  <Pencil className="w-5 h-5 text-blue-600" />
                </button>
                <button
                  onClick={() => onDelete(t.id)}
                  className="p-1 rounded hover:bg-gray-200"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
