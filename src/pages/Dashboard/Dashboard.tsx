import { useMemo, useState } from "react"
import { ArrowLeftRight, CalendarClock, LayoutDashboard, TrendingUp } from "lucide-react"
import type { transactions } from "../../types/types"
import SummaryCards from "./components/SummaryCards"
import Charts from "./components/Charts"
import RecentTransactions from "./components/RecentTransactions"
import UpcomingServices from "./components/UpcomingServices"
import TransactionForm from "./components/TransactionForm"
import { useAuth } from "../../Context/AuthContext"
import EditTransactionModal from "./components/EditTransactionModal"
import ConfirmDeleteModal from "./components/ConfirmDeleteModal"
import ServiceForm from "./components/ServiceForm"
import CategoryHistoryCard from "./components/CategoryHistoryCard"
import SavingsSection from "./components/SavingSections"
import InvestmentSection from "./components/InvestmentSection"
import Tabs, { type TabItem } from "../../components/ui/Tabs"
import { useTransactions } from "../../Hooks/useTransactions"
import { useServices } from "../../Hooks/useServices"
import { useInvestments } from "../../Hooks/useInvestments"
import { useSavings } from "../../Hooks/useSavings"
import { calcPeriodTotals, calcNetWorth, filterCurrentMonth } from "../../lib/Finance"

const TABS: TabItem[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { id: "inversion", label: "Ahorro e inversión", icon: TrendingUp },
  { id: "servicios", label: "Servicios", icon: CalendarClock },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("resumen")

  const { transactionsList, addTransaction, editTransaction, removeTransaction } = useTransactions(user?.id)
  const { servicesList, addService, removeService } = useServices(user?.id)
  const {
    positions,
    loading: investmentsLoading,
    addPurchase,
    updatePositionCurrentValue,
    removePurchase,
  } = useInvestments(user?.id)
  const { savings, loading: savingsLoading, updateSavings } = useSavings(user?.id)

  // Totales históricos (para saldo líquido y total invertido a costo).
  const historicos = useMemo(() => calcPeriodTotals(transactionsList), [transactionsList])
  // Totales del mes en curso (para las cards de ingresos/egresos/tasa de ahorro).
  const delMes = useMemo(() => calcPeriodTotals(filterCurrentMonth(transactionsList)), [transactionsList])

  const netWorth = useMemo(
    () => calcNetWorth(historicos.saldo, savings.ARS, positions),
    [historicos.saldo, savings.ARS, positions]
  )

  const proximoServicio = useMemo(() => {
    if (servicesList.length === 0) return null
    return [...servicesList].sort((a, b) => a.proximo_pago.localeCompare(b.proximo_pago))[0]
  }, [servicesList])

  const handleAddTransaction = async (transaction: transactions) => {
    await addTransaction({
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      type: transaction.type,
    })
  }

  const handleRegisterInvestment: React.ComponentProps<typeof InvestmentSection>["onRegisterPurchase"] = async purchase => {
    const created = await addPurchase(purchase)
    if (!created) return null

    await addTransaction({
      amount: purchase.totalCompraArs,
      category: `Inversión ${purchase.tipo}`,
      description: `${purchase.broker}: ${purchase.activo} x ${purchase.cantidad} a ${purchase.moneda} ${purchase.precioCompra}${
        purchase.exchangeRate ? ` (TCR ${purchase.exchangeRate.toLocaleString("es-AR")})` : ""
      }`,
      date: purchase.fechaCompra,
      type: "egreso",
    })

    return created
  }

  const handleUsdPurchase = async (arsCost: number, usdAmount: number, rate: number) => {
    const todayStr = new Date().toISOString().split("T")[0]
    const created = await addTransaction({
      amount: arsCost,
      category: "Compra USD",
      description: `Compra de USD ${usdAmount.toLocaleString("en-US")} a TCR ${rate.toLocaleString("es-AR")}`,
      date: todayStr,
      type: "egreso",
    })
    return Boolean(created)
  }

  const handleAddService: React.ComponentProps<typeof ServiceForm>["onAdd"] = async service => {
    await addService(service)
  }

  const [selectedTransaction, setSelectedTransaction] = useState<transactions | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const onEdit = (transaction: transactions) => {
    setSelectedTransaction(transaction)
    setIsEditOpen(true)
  }

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<transactions | null>(null)

  const handleDeleteClick = (transaction: transactions) => {
    setTransactionToDelete(transaction)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!transactionToDelete) return
    await removeTransaction(transactionToDelete.id)
    setIsDeleteOpen(false)
    setTransactionToDelete(null)
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5]">
      <div className="p-4 md:p-8 space-y-6 md:space-y-7 text-slate-900 max-w-7xl mx-auto">
        <header className="rounded-3xl border border-emerald-100 bg-white/90 backdrop-blur-sm shadow-lg px-5 md:px-8 py-4 md:py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <img src="./LogoCashFlow.webp" alt="Logo" className="h-11 md:h-12" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Panel financiero</p>
              <h1 className="text-xl md:text-2xl font-semibold">Hola, {user?.email}</h1>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#2E6F40] text-white rounded-xl hover:bg-[#1f4e2a] transition"
          >
            Cerrar sesión
          </button>
        </header>

        <SummaryCards
          netWorth={netWorth}
          ingresosMes={delMes.ingresos}
          egresosMes={delMes.egresos}
          tasaAhorro={delMes.tasaAhorro}
          proximoServicio={proximoServicio}
        />

        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === "resumen" && (
          <div className="space-y-6">
            <Charts transactions={transactionsList} />
            <CategoryHistoryCard transactions={transactionsList} />
          </div>
        )}

        {activeTab === "movimientos" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <TransactionForm userId={user?.id ?? ""} onAdd={handleAddTransaction} />
            <RecentTransactions
              transactions={transactionsList}
              onEdit={onEdit}
              onDelete={handleDeleteClick}
            />
          </div>
        )}

        {activeTab === "inversion" && (
          <div className="space-y-6">
            <SavingsSection
              savings={savings}
              loading={savingsLoading}
              availableBalance={historicos.saldo}
              onUsdPurchase={handleUsdPurchase}
              onUpdateSavings={updateSavings}
            />
            <InvestmentSection
              positions={positions}
              loading={investmentsLoading}
              onRegisterPurchase={handleRegisterInvestment}
              onUpdatePositionValue={updatePositionCurrentValue}
              onRemovePurchase={removePurchase}
            />
          </div>
        )}

        {activeTab === "servicios" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ServiceForm userId={user?.id ?? ""} onAdd={handleAddService} />
            <UpcomingServices services={servicesList} onDelete={removeService} />
          </div>
        )}

        <EditTransactionModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={editTransaction}
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