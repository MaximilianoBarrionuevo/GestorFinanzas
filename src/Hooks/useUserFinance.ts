import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

export function useUserFinance(userId: string) {
  const [saldo, setSaldo] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // obtener saldo y transacciones
  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      setLoading(true)

      const { data: user, error: userError } = await supabase
        .from("Users")
        .select("saldo")
        .eq("id", userId)
        .single()

      if (userError) console.error(userError)
      else setSaldo(user?.saldo ?? 0)

      const { data: txs, error: txError } = await supabase
        .from("Transacciones")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20) // eficiencia

      if (txError) console.error(txError)
      else setTransactions(txs)

      setLoading(false)
    }

    fetchData()
  }, [userId])

  // registrar transacción (y actualizar saldo)
  const addTransaction = async (amount: number, category: string) => {
    const { data, error } = await supabase
      .from("Transacciones")
      .insert([{ user_id: userId, amount, category }])
      .select()

    if (error) {
      console.error(error)
      return
    }

    // update saldo
    const newSaldo = saldo + amount
    setSaldo(newSaldo)
    setTransactions([...(data ?? []), ...transactions])

    await supabase
      .from("Users")
      .update({ saldo: newSaldo })
      .eq("id", userId)
  }

  return { saldo, transactions, loading, addTransaction }
}
