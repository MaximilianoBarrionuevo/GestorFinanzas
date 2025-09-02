import { useEffect, useState } from "react"
import type { transactions, services } from "../../types/types"
import SummaryCards from "./components/SummaryCards"
import Charts from "./components/Charts"
import RecentTransactions from "./components/RecentTransactions"
import UpcomingServices from "./components/UpcomingServices"
import TransactionForm from "./components/TransactionForm"
import { useAuth } from "../../Context/AuthContext"
import { supabase } from "../../supabaseClient"

export default function Dashboard() {
  const { user } = useAuth()

  const [transactionsList, setTransactionsList] = useState<transactions[]>([])
  const [servicesList] = useState<services[]>([])

  // 🔹 Cálculos de resumen
  const totalIngresos = transactionsList
    .filter(t => t.type === "ingreso")
    .reduce((acc, t) => acc + t.amount, 0)

  const totalEgresos = transactionsList
    .filter(t => t.type === "egreso")
    .reduce((acc, t) => acc + t.amount, 0)

  const saldo = totalIngresos - totalEgresos

  const summaryData = {
    saldo,
    ingresos: totalIngresos,
    egresos: totalEgresos,
    servicios: servicesList.reduce((acc, s) => acc + s.amount, 0),
  }

  useEffect(() => {
    if (!user) return

    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from("Transacciones")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (error) {
        console.error("Error al obtener transacciones:", error.message)
      } else {
        setTransactionsList(data)
      }
    }

    fetchTransactions()
  }, [user])

  const handleAddTransaction = async (transaction: transactions) => {
    if (!user) return

    const { data, error } = await supabase
      .from("Transacciones")
      .insert([{ ...transaction, user_id: user.id }])
      .select()

    if (error) {
      console.error("Error al agregar transacción:", error.message)
    } else {
      setTransactionsList(prev => [data[0], ...prev])
    }
  }


  if (!user) return <p>Cargando...</p>

  return (
    <div className="p-6 space-y-6">
      <SummaryCards data={summaryData} />

      <Charts transactions={transactionsList} />

      <TransactionForm userId={user.id} onAdd={handleAddTransaction} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentTransactions transactions={transactionsList} />
        <UpcomingServices services={servicesList} />
      </div>
    </div>
  )
}
