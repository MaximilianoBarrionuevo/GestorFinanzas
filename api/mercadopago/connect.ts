import type { VercelRequest, VercelResponse } from "@vercel/node"
import { getAuthenticatedUserId, getMpConfig, signState } from "./_shared"

/** Devuelve la URL de autorización de Mercado Pago para que el cliente redirija ahí. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  const userId = await getAuthenticatedUserId(req.headers.authorization)
  if (!userId) {
    return res.status(401).json({ error: "No autenticado" })
  }

  try {
    const { clientId, redirectUri } = getMpConfig()
    const state = signState(userId)

    const url = new URL("https://auth.mercadopago.com.ar/authorization")
    url.searchParams.set("client_id", clientId)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("platform_id", "mp")
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("state", state)

    return res.status(200).json({ url: url.toString() })
  } catch (err) {
    console.error("mercadopago/connect", err)
    return res.status(500).json({ error: "No se pudo generar el link de conexión" })
  }
}
