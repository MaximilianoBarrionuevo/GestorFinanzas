import type { VercelRequest, VercelResponse } from "@vercel/node"
import { getAdminClient, getAuthenticatedUserId } from "./_shared"

/** Le dice al cliente si el usuario tiene Mercado Pago conectado, sin exponer nunca el token. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const userId = await getAuthenticatedUserId(req.headers.authorization)
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" })
    }

    const admin = getAdminClient()
    const { data, error } = await admin
      .from("MercadoPagoTokens")
      .select("last_synced_at, connected_at")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) throw error

    return res.status(200).json({
      connected: Boolean(data),
      lastSyncedAt: data?.last_synced_at ?? null,
      connectedAt: data?.connected_at ?? null,
    })
  } catch (err) {
    console.error("mercadopago/status", err)
    const message = err instanceof Error ? err.message : "Error desconocido"
    return res.status(500).json({ error: `No se pudo consultar el estado de la conexión: ${message}` })
  }
}
