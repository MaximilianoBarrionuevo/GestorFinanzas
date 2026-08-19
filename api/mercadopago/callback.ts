import type { VercelRequest, VercelResponse } from "@vercel/node"
import { getAdminClient, getMpConfig, verifyState } from "./_shared.js"

/**
 * Mercado Pago redirige acá (navegación de browser común, sin JS de por
 * medio) después de que el usuario autoriza. Cambiamos el `code` por tokens,
 * los guardamos, y mandamos al usuario de vuelta al dashboard.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error: mpError } = req.query

  const redirectToApp = (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString()
    res.writeHead(302, { Location: `/dashboard?${qs}` })
    res.end()
  }

  if (mpError) {
    return redirectToApp({ mp: "error", reason: "cancelado" })
  }

  if (typeof code !== "string" || typeof state !== "string") {
    return redirectToApp({ mp: "error", reason: "faltan_parametros" })
  }

  try {
    const userId = verifyState(state)
    if (!userId) {
      return redirectToApp({ mp: "error", reason: "estado_invalido" })
    }

    const { clientId, clientSecret, redirectUri } = getMpConfig()

    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const text = await tokenRes.text()
      console.error("mercadopago/callback token exchange failed", tokenRes.status, text)
      return redirectToApp({ mp: "error", reason: "intercambio_fallido" })
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
      user_id: number | string
    }

    const admin = getAdminClient()
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    const { error: dbError } = await admin.from("MercadoPagoTokens").upsert({
      user_id: userId,
      mp_user_id: String(tokenData.user_id),
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      connected_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("mercadopago/callback db upsert failed", dbError)
      return redirectToApp({ mp: "error", reason: "guardado_fallido" })
    }

    return redirectToApp({ mp: "conectado" })
  } catch (err) {
    console.error("mercadopago/callback", err)
    const message = err instanceof Error ? err.message : "Error desconocido"
    return redirectToApp({ mp: "error", reason: "excepcion", detail: message })
  }
}
