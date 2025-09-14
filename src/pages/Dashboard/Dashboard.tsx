import { useEffect, useState } from "react"
import type { transactions, services } from "../../types/types"
import SummaryCards from "./components/SummaryCards"
import Charts from "./components/Charts"
import RecentTransactions from "./components/RecentTransactions"
import UpcomingServices from "./components/UpcomingServices"
import TransactionForm from "./components/TransactionForm"
import { useAuth } from "../../Context/AuthContext"
import { supabase } from "../../supabaseClient"
import EditTransactionModal from "./components/EditTransactionModal"
import ConfirmDeleteModal from "./components/ConfirmDeleteModal"

export default function Dashboard() {
  const { user, logout } = useAuth()

  const [transactionsList, setTransactionsList] = useState<transactions[]>([])
  const [servicesList] = useState<services[]>([])

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

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const [selectedTransaction, setSelectedTransaction] = useState<transactions | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const onEdit = (transaction: transactions) => {
    setSelectedTransaction(transaction)
    setIsEditOpen(true)
  }

  const handleEditTransaction = async (id: string, updatedData: Partial<transactions>) => {
    const { data, error } = await supabase
      .from("Transacciones")
      .update(updatedData)
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error al editar transacción:", error.message)
    } else if (data && data.length > 0) {
      setTransactionsList(prev =>
        prev.map(t => (t.id === id ? { ...t, ...data[0] } : t))
      )
    }
  }

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<transactions | null>(null);

  const handleDeleteClick = (transaction: transactions) => {
    setTransactionToDelete(transaction);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    const { error } = await supabase
      .from("Transacciones")
      .delete()
      .eq("id", transactionToDelete.id);

    if (error) console.error("Error al eliminar:", error.message);
    else setTransactionsList(prev => prev.filter(t => t.id !== transactionToDelete.id));
  };

  if (!user) return <p>Cargando...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <img src="./LogoCashFlow.webp" alt="Logo" className="h-12" />
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-[#2E6F40] text-white rounded hover:bg-[#1f4e2a] transition"
        >
          Cerrar sesión
        </button>
      </div>
      <SummaryCards data={summaryData} />

      <TransactionForm userId={user.id} onAdd={handleAddTransaction} />

      <Charts transactions={transactionsList} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentTransactions
          transactions={transactionsList}
          onEdit={onEdit}
          onDelete={handleDeleteClick} // ahora abre el modal en vez de borrar directo
        />


        <UpcomingServices services={servicesList} />

        <EditTransactionModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleEditTransaction}
          transaction={selectedTransaction}
        />

        <ConfirmDeleteModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  )
}
