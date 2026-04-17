import { useEffect, useState } from "react"
import type { investmentPurchase, transactions, services } from "../../types/types"
import SummaryCards from "./components/SummaryCards"
import Charts from "./components/Charts"
import RecentTransactions from "./components/RecentTransactions"
import UpcomingServices from "./components/UpcomingServices"
import TransactionForm from "./components/TransactionForm"
import { useAuth } from "../../Context/AuthContext"
import { transactionService } from "../../Services/TransactionService"
import { servicesService } from "../../Services/ServicesService"
import EditTransactionModal from "./components/EditTransactionModal"
import ConfirmDeleteModal from "./components/ConfirmDeleteModal"
import ServiceForm from "./components/ServiceForm"
import CategoryHistoryCard from "./components/CategoryHistoryCard"
import SavingsSection from "./components/SavingSections"
import InvestmentSection from "./components/InvestmentSection"

export default function Dashboard() {
  const { user, logout } = useAuth()

  const [transactionsList, setTransactionsList] = useState<transactions[]>([])
  const [servicesList, setServicesList] = useState<services[]>([])

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
    servicios: servicesList.reduce((acc, s) => acc + s.monto, 0),
  }

  useEffect(() => {
    if (!user) return

    const fetchTransactions = async () => {
      try {
        const data = await transactionService.getByUserId(user.id)
        setTransactionsList(data)
      } catch (error) {
        console.error("Error al obtener transacciones:", error)
      }
    }

    fetchTransactions()
  }, [user])

  const handleAddTransaction = async (transaction: transactions) => {
    if (!user) return

    try {
      const data = await transactionService.create(user.id, {
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
      })
      setTransactionsList(prev => [data, ...prev])
    } catch (error) {
      console.error("Error al agregar transacción:", error)
    }
  }

  const handleRegisterInvestment = async (purchase: investmentPurchase) => {
    if (!user) return false

    try {
      const expense = await transactionService.create(user.id, {
        amount: purchase.totalCompra,
        category: `Inversión ${purchase.tipo}`,
        description: `${purchase.broker}: ${purchase.activo} x ${purchase.cantidad} a ${purchase.moneda} ${purchase.precioCompra}`,
        date: purchase.fechaCompra,
        type: "egreso",
      })

      setTransactionsList(prev => [expense, ...prev])
      return true
    } catch (error) {
      console.error("Error al registrar compra de activo:", error)
      return false
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
    try {
      const data = await transactionService.update(id, updatedData)
      setTransactionsList(prev =>
        prev.map(t => (t.id === id ? { ...t, ...data } : t))
      )
    } catch (error) {
      console.error("Error al editar transacción:", error)
    }
  }

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<transactions | null>(null)

  const handleDeleteClick = (transaction: transactions) => {
    setTransactionToDelete(transaction)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await transactionService.remove(transactionToDelete.id)
      setTransactionsList(prev => prev.filter(t => t.id !== transactionToDelete.id))
      setIsDeleteOpen(false)
      setTransactionToDelete(null)
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  };

  const handleAddService = async (service: services) => {
    if (!user) return

    try {
      const data = await servicesService.create(user.id, {
        nombre: service.nombre,
        monto: service.monto,
        frecuencia: service.frecuencia,
        proximo_pago: service.proximo_pago,
      })
      setServicesList(prev => [data, ...prev])
    } catch (error) {
      console.error("Error al agregar servicio:", error)
    }
  }

  useEffect(() => {
    if (!user) return

    const fetchServices = async () => {
      try {
        const data = await servicesService.getByUserId(user.id)
        setServicesList(data)
      } catch (error) {
        console.error("Error al obtener servicios:", error)
      }
    }

    fetchServices()
  }, [user])

  const handleUsdPurchase = async (arsCost: number, usdAmount: number, rate: number) => {
    if (!user) return false

    const today = new Date().toISOString().split("T")[0]

    try {
      const expense = await transactionService.create(user.id, {
        amount: arsCost,
        category: "Compra USD",
        description: `Compra de USD ${usdAmount.toLocaleString("en-US")} a TCR ${rate.toLocaleString("es-AR")}`,
        date: today,
        type: "egreso",
      })

      setTransactionsList(prev => [expense, ...prev])
      return true
    } catch (error) {
      console.error("Error al registrar compra de USD:", error)
      return false
    }
  }

  if (!user) return <p>Cargando...</p>

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-7 text-slate-900">
      <header className="rounded-3xl border border-emerald-100 bg-white/90 backdrop-blur-sm shadow-lg px-5 md:px-8 py-4 md:py-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <img src="./LogoCashFlow.webp" alt="Logo" className="h-11 md:h-12" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Panel financiero</p>
            <h1 className="text-xl md:text-2xl font-semibold">Hola, {user.email}</h1>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-[#2E6F40] text-white rounded-xl hover:bg-[#1f4e2a] transition"
        >
          Cerrar sesión
        </button>
      </header>

      <SummaryCards data={summaryData} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TransactionForm userId={user.id} onAdd={handleAddTransaction} />
        <SavingsSection userId={user.id} availableBalance={saldo} onUsdPurchase={handleUsdPurchase} />
      </div>

      <InvestmentSection userId={user.id} onRegisterPurchase={handleRegisterInvestment} />

      <Charts transactions={transactionsList} />

      <CategoryHistoryCard transactions={transactionsList} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentTransactions
          transactions={transactionsList}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
        />

        <UpcomingServices services={servicesList} />
      </div>

      <ServiceForm userId={user.id} onAdd={handleAddService} />

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
  )
}