import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ArrowLeftRight, CalendarClock, CreditCard, LayoutDashboard, TrendingUp } from "lucide-react"
import type { transactions, investmentPurchase } from "../../types/types"
import SummaryCards from "./components/SummaryCards"
import Charts from "./components/Charts"
import RecentTransactions from "./components/RecentTransactions"
import UpcomingServices from "./components/UpcomingServices"
import TransactionForm from "./components/TransactionForm"
import { useAuth } from "../../Context/AuthContext"
import { useToast } from "../../Context/ToastContext"
import EditTransactionModal from "./components/EditTransactionModal"
import ConfirmDeleteModal from "./components/ConfirmDeleteModal"
import ServiceForm from "./components/ServiceForm"
import EditServiceModal from "./components/EditServiceModal"
import CategoryHistoryCard from "./components/CategoryHistoryCard"
import SavingsSection from "./components/SavingSections"
import InvestmentSection from "./components/InvestmentSection"
import PositionDetailModal from "./components/PositionDetailModal"
import EditInvestmentModal from "./components/EditInvestmentModal"
import CreditCardsSection from "./components/CreditCardsSection"
import MercadoPagoConnectionCard from "./components/MercadoPagoConnectionCard"
import Tabs, { type TabItem } from "../../components/ui/Tabs"
import { useTransactions } from "../../Hooks/useTransactions"
import { useServices } from "../../Hooks/useServices"
import { useInvestments } from "../../Hooks/useInvestments"
import { useSavings } from "../../Hooks/useSavings"
import { useCreditCards } from "../../Hooks/useCreditCards"
import { useMercadoPago } from "../../Hooks/useMercadoPago"
import { calcPeriodTotals, calcNetWorth, filterCurrentMonth, calcProximaFecha, currentCardCycleKey } from "../../lib/Finance"
import type { services, creditCard, cardCycleSummary } from "../../types/types"

const TABS: TabItem[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { id: "inversion", label: "Ahorro e inversión", icon: TrendingUp },
  { id: "tarjetas", label: "Tarjetas", icon: CreditCard },
  { id: "servicios", label: "Servicios", icon: CalendarClock },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { showError, showSuccess } = useToast()
  const [activeTab, setActiveTab] = useState("resumen")
  const [searchParams, setSearchParams] = useSearchParams()

  const { transactionsList, addTransaction, editTransaction, removeTransaction, refetch: refetchTransactions } =
    useTransactions(user?.id)
  const { servicesList, addService, editService, removeService } = useServices(user?.id)
  const {
    positions,
    loading: investmentsLoading,
    addPurchase,
    updatePositionCurrentValue,
    editPurchase,
    removePurchase,
  } = useInvestments(user?.id)
  const { savings, loading: savingsLoading, updateSavings } = useSavings(user?.id)
  const {
    cards,
    expenses: cardExpenses,
    cycleSummaries,
    loading: cardsLoading,
    addCard,
    editCard,
    removeCard,
    markCyclePaid,
    addExpense: addCardExpense,
    editExpense: editCardExpense,
    removeExpense: removeCardExpense,
  } = useCreditCards(user?.id)
  const {
    status: mpStatus,
    loading: mpLoading,
    connecting: mpConnecting,
    syncing: mpSyncing,
    connect: mpConnect,
    disconnect: mpDisconnect,
    sync: mpSync,
  } = useMercadoPago(user?.id)

  // Después de volver del login de Mercado Pago (ver api/mercadopago/callback.ts),
  // mostramos un aviso según cómo salió y limpiamos el query param.
  useEffect(() => {
    const mp = searchParams.get("mp")
    if (!mp) return

    if (mp === "conectado") {
      showSuccess("Mercado Pago conectado")
    } else if (mp === "error") {
      showError(`No se pudo conectar Mercado Pago (${searchParams.get("reason") ?? "error desconocido"})`)
    }

    const next = new URLSearchParams(searchParams)
    next.delete("mp")
    next.delete("reason")
    setSearchParams(next, { replace: true })
    // Solo queremos que esto corra al montar / cuando cambian los params de la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleMpSync = async () => {
    const result = await mpSync()
    if (result && result.imported > 0) {
      await refetchTransactions()
    }
  }

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

  const handleAddTransaction = async (transaction: Omit<transactions, "id" | "user_id">) => {
    await addTransaction(transaction)
  }

  const handleRegisterOperation: React.ComponentProps<typeof InvestmentSection>["onRegisterOperation"] = async purchase => {
    const created = await addPurchase(purchase)
    if (!created) return null

    const esVenta = purchase.operacion === "venta"

    const registeredTransaction = await addTransaction({
      amount: purchase.totalCompraArs,
      category: esVenta ? `Venta ${purchase.tipo}` : `Inversión ${purchase.tipo}`,
      description: `${purchase.broker}: ${purchase.activo} x ${purchase.cantidad} a ${purchase.moneda} ${purchase.precioCompra}${
        purchase.exchangeRate ? ` (TCR ${purchase.exchangeRate.toLocaleString("es-AR")})` : ""
      }`,
      date: purchase.fechaCompra,
      type: esVenta ? "ingreso" : "egreso",
    })

    // La operación (compra/venta) ya quedó guardada aunque esto falle: se lo
    // marcamos aparte al usuario para que sepa que tiene que cargar el
    // movimiento de caja a mano en vez de perderlo en silencio.
    if (!registeredTransaction) {
      showError(
        `La ${esVenta ? "venta" : "compra"} se registró, pero no pudimos crear el movimiento en "Movimientos". Cargalo a mano si hace falta.`
      )
    }

    return created
  }

  // Estado del modal de detalle de una posición + edición de una compra puntual.
  const [selectedPositionKey, setSelectedPositionKey] = useState<string | null>(null)
  const selectedPosition = positions.find(p => p.key === selectedPositionKey) ?? null

  const [editingPurchase, setEditingPurchase] = useState<investmentPurchase | null>(null)

  const handleEditPurchaseSave = async (id: string, purchase: Parameters<typeof editPurchase>[1]) => {
    await editPurchase(id, purchase)
    setEditingPurchase(null)
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

  // "Pagar resumen": registra el egreso por el total del ciclo actual y marca
  // ese ciclo como pagado en la tarjeta, para no poder pagarlo dos veces.
  const handlePayCardCycle = async (card: creditCard, summary: cardCycleSummary) => {
    if (summary.resumenActual <= 0) return

    const created = await addTransaction({
      amount: summary.resumenActual,
      category: `Tarjeta: ${card.nombre}`,
      description: `Pago resumen ${card.nombre} (vence ${summary.fechaVencimientoActual})`,
      date: new Date().toISOString().split("T")[0],
      type: "egreso",
    })

    if (!created) return

    await markCyclePaid(card.id, currentCardCycleKey(card.diaCierre))
  }

  const handleAddService: React.ComponentProps<typeof ServiceForm>["onAdd"] = async service => {
    await addService(service)
  }

  // "Descontar": registra la transacción del período actual y mueve el vencimiento
  // al siguiente automáticamente (mensual -> +1 mes, anual -> +1 año).
  // Para servicios "único", ya no corresponde que sigan apareciendo, así que se eliminan.
  const handlePayService = async (service: services) => {
    if (!service.id) return

    const created = await addTransaction({
      amount: service.monto,
      category: `Servicio: ${service.nombre}`,
      description: `Pago de ${service.nombre} (vencimiento ${service.proximo_pago})`,
      date: service.proximo_pago,
      type: "egreso",
    })

    if (!created) return

    if (service.frecuencia === "unico") {
      await removeService(service.id)
      return
    }

    const proximaFecha = calcProximaFecha(service.proximo_pago, service.frecuencia)
    await editService(service.id, { proximo_pago: proximaFecha })
  }

  const [selectedService, setSelectedService] = useState<services | null>(null)
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false)

  const handleEditServiceClick = (service: services) => {
    setSelectedService(service)
    setIsEditServiceOpen(true)
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
          <div className="space-y-6">
            <MercadoPagoConnectionCard
              status={mpStatus}
              loading={mpLoading}
              connecting={mpConnecting}
              syncing={mpSyncing}
              onConnect={mpConnect}
              onDisconnect={mpDisconnect}
              onSync={handleMpSync}
            />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TransactionForm onAdd={handleAddTransaction} />
              <RecentTransactions
                transactions={transactionsList}
                onEdit={onEdit}
                onDelete={handleDeleteClick}
              />
            </div>
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
              onRegisterOperation={handleRegisterOperation}
              onOpenPosition={position => setSelectedPositionKey(position.key)}
            />
          </div>
        )}

        {activeTab === "tarjetas" && (
          <CreditCardsSection
            cards={cards}
            expenses={cardExpenses}
            cycleSummaries={cycleSummaries}
            loading={cardsLoading}
            onAddCard={addCard}
            onEditCard={editCard}
            onRemoveCard={removeCard}
            onAddExpense={addCardExpense}
            onEditExpense={editCardExpense}
            onRemoveExpense={removeCardExpense}
            onPayCycle={handlePayCardCycle}
          />
        )}

        {activeTab === "servicios" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ServiceForm userId={user?.id ?? ""} onAdd={handleAddService} />
            <UpcomingServices
              services={servicesList}
              onPay={handlePayService}
              onEdit={handleEditServiceClick}
              onDelete={removeService}
            />
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

        <EditServiceModal
          isOpen={isEditServiceOpen}
          onClose={() => setIsEditServiceOpen(false)}
          onSave={editService}
          service={selectedService}
        />

        <PositionDetailModal
          position={selectedPosition}
          onClose={() => setSelectedPositionKey(null)}
          onUpdateValue={updatePositionCurrentValue}
          onEditPurchase={purchase => setEditingPurchase(purchase)}
          onRemovePurchase={removePurchase}
        />

        <EditInvestmentModal
          isOpen={editingPurchase !== null}
          onClose={() => setEditingPurchase(null)}
          onSave={handleEditPurchaseSave}
          purchase={editingPurchase}
        />
      </div>
    </div>
  )
}