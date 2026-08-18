import type { VercelRequest, VercelResponse } from "@vercel/node"
import { getAdminClient, getAuthenticatedUserId } from "./_shared"

/** Borra los tokens guardados. No revoca el permiso del lado de Mercado Pago (eso lo hace el usuario desde su cuenta de MP si quiere). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  const userId = await getAuthenticatedUserId(req.headers.authorization)
  if (!userId) {
    return res.status(401).json({ error: "No autenticado" })
  }

  try {
    const admin = getAdminClient()
    const { error } = await admin.from("MercadoPagoTokens").delete().eq("user_id", userId)
    if (error) throw error

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error("mercadopago/disconnect", err)
    return res.status(500).json({ error: "No se pudo desconectar la cuenta" })
  }
}
