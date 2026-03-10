import { useEffect, useState } from "react"
import { PiggyBank, Wallet } from "lucide-react"
import { savingsService } from "../../../Services/SavingsService"
import type { savingsBalance } from "../../../types/types"

type Props = {
  userId: string
  availableBalance: number
  onUsdPurchase: (arsCost: number, usdAmount: number, exchangeRate: number) => Promise<boolean>
}

type Currency = "ARS" | "USD"
type MovementType = "deposit" | "withdraw"

const initialSavings: savingsBalance = {
  user_id: "",
  ARS: 0,
  USD: 0,
}

export default function SavingsSection({ userId, availableBalance, onUsdPurchase }: Props) {
  const [savings, setSavings] = useState<savingsBalance>(initialSavings)
  const [currency, setCurrency] = useState<Currency>("ARS")
  const [movementType, setMovementType] = useState<MovementType>("deposit")
  const [amount, setAmount] = useState<number>(0)
  const [exchangeRate, setExchangeRate] = useState<number>(0)
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isUsdPurchase = currency === "USD" && movementType === "deposit" && exchangeRate > 0

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true)
        const data = await savingsService.getByUserId(userId)
        setSavings(data)
      } catch (err) {
        console.error("Error al obtener ahorros:", err)
        setError("No se pudieron cargar tus ahorros")
      } finally {
        setLoading(false)
      }
    }

    fetchBalances()
  }, [userId])

  const applyMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!amount || amount <= 0) {
      setError("Ingresá un monto válido")
      return
    }

    if (currency === "USD" && movementType === "deposit" && exchangeRate < 0) {
      setError("La TCR no puede ser negativa")
      return
    }

    const nextBalances = { ARS: savings.ARS, USD: savings.USD }

    if (currency === "USD" && movementType === "deposit" && exchangeRate > 0) {
      const arsCost = amount * exchangeRate

      if (availableBalance < arsCost) {
        setError("No tenés saldo suficiente para comprar esos dólares")
        return
      }

      const registered = await onUsdPurchase(arsCost, amount, exchangeRate)
      if (!registered) {
        setError("No se pudo registrar el gasto de compra de USD")
        return
      }

      nextBalances.USD += amount
    } else {
      const current = nextBalances[currency]
      const nextValue = movementType === "deposit" ? current + amount : current - amount

      if (nextValue < 0) {
        setError("No podés retirar más de lo que tenés ahorrado")
        return
      }

      nextBalances[currency] = nextValue
    }

    try {
      setSaving(true)
      const updated = await savingsService.updateByUserId(userId, nextBalances)
      setSavings(updated)
      setAmount(0)
      setExchangeRate(0)
    } catch (err) {
      console.error("Error al guardar ahorros:", err)
      setError("No se pudo guardar el movimiento")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <p className="text-gray-500">Cargando ahorros...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <div className="flex items-center gap-2">
        <PiggyBank className="text-[#2E6F40]" />
        <h2 className="text-xl font-bold text-gray-800">Ahorros (Pesos / USD)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#F4F5F6] p-4">
          <p className="text-sm text-gray-500">Ahorro en pesos</p>
          <p className="text-2xl font-bold text-[#2E6F40]">${savings.ARS.toLocaleString("es-AR")}</p>
        </div>
        <div className="rounded-xl bg-[#F4F5F6] p-4">
          <p className="text-sm text-gray-500">Ahorro en dólares</p>
          <p className="text-2xl font-bold text-[#2E6F40]">USD {savings.USD.toLocaleString("en-US")}</p>
        </div>
      </div>

      <form onSubmit={applyMovement} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Moneda</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="w-full border rounded-lg px-3 py-2"
            disabled={saving}
          >
            <option value="ARS">Pesos (ARS)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Movimiento</label>
          <select
            value={movementType}
            onChange={e => setMovementType(e.target.value as MovementType)}
            className="w-full border rounded-lg px-3 py-2"
            disabled={saving}
          >
            <option value="deposit">Agregar ahorro</option>
            <option value="withdraw">Retirar</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Monto</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount || ""}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
            placeholder={currency === "USD" ? "Ej: 100" : "Ej: 10000"}
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">TCR (opcional)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={exchangeRate || ""}
            onChange={e => setExchangeRate(Number(e.target.value))}
            disabled={currency !== "USD" || movementType !== "deposit" || saving}
            className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400"
            placeholder="Ej: 1300"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-10 bg-[#2E6F40] text-white rounded-lg hover:bg-[#1f4e2a] transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Wallet className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>

      {isUsdPurchase && (
        <p className="text-sm text-gray-600">
          Compra estimada: USD {amount.toLocaleString("en-US")} x ${exchangeRate.toLocaleString("es-AR")} =
          {" "}<strong>${(amount * exchangeRate).toLocaleString("es-AR")}</strong> (se descuenta del saldo)
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}