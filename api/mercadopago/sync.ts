import type { VercelRequest, VercelResponse } from "@vercel/node"
import { getAdminClient, getAuthenticatedUserId, getMpConfig } from "./_shared.js"

type StoredTokens = {
  access_token: string
  refresh_token: string
  expires_at: string
  mp_user_id: string
}

type MpPayment = {
  id: number | string
  status: string
  transaction_amount: number
  collector_id: number | string
  description: string | null
  statement_descriptor: string | null
  date_approved: string | null
  date_created: string
}

async function refreshAccessToken(tokens: StoredTokens) {
  const { clientId, clientSecret } = getMpConfig()

  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    }),
  })

  if (!res.ok) {
    throw new Error(`No se pudo refrescar el token de Mercado Pago (${res.status})`)
  }

  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>
}

/**
 * Trae pagos aprobados de los últimos 30 días y los inserta como transacciones,
 * evitando duplicados vía (user_id, external_source, external_id).
 *
 * NOTA para quien retome esto: el endpoint /v1/payments/search y sus campos
 * están documentados por Mercado Pago pero no se probó todavía contra una
 * cuenta real conectada — es lo más probable que necesite un ajuste una vez
 * que se vea la respuesta real (nombres de campo, si trae también
 * transferencias/recargas además de pagos, paginación si hay >100 resultados, etc).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const userId = await getAuthenticatedUserId(req.headers.authorization)
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" })
    }

    const admin = getAdminClient()

    const { data: tokens, error: tokensError } = await admin
      .from("MercadoPagoTokens")
      .select("access_token, refresh_token, expires_at, mp_user_id")
      .eq("user_id", userId)
      .maybeSingle<StoredTokens>()

    if (tokensError) throw tokensError
    if (!tokens) {
      return res.status(404).json({ error: "No conectaste Mercado Pago todavía" })
    }

    let accessToken = tokens.access_token

    // Refrescamos si el token vence en menos de un día.
    const expiresSoon = new Date(tokens.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000
    if (expiresSoon) {
      const refreshed = await refreshAccessToken(tokens)
      accessToken = refreshed.access_token
      await admin
        .from("MercadoPagoTokens")
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq("user_id", userId)
    }

    const since = new Date()
    since.setDate(since.getDate() - 30)

    const searchUrl = new URL("https://api.mercadopago.com/v1/payments/search")
    searchUrl.searchParams.set("sort", "date_created")
    searchUrl.searchParams.set("criteria", "desc")
    searchUrl.searchParams.set("range", "date_created")
    searchUrl.searchParams.set("begin_date", since.toISOString())
    searchUrl.searchParams.set("end_date", new Date().toISOString())
    searchUrl.searchParams.set("limit", "100")

    const mpRes = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!mpRes.ok) {
      const text = await mpRes.text()
      console.error("mercadopago/sync search failed", mpRes.status, text)
      return res.status(502).json({ error: "No se pudo consultar los movimientos en Mercado Pago" })
    }

    const searchData = (await mpRes.json()) as { results?: MpPayment[] }
    const aprobados = (searchData.results ?? []).filter(p => p.status === "approved")

    let imported = 0

    for (const p of aprobados) {
      const esCobro = String(p.collector_id) === tokens.mp_user_id
      const amount = Number(p.transaction_amount) || 0
      const fecha = (p.date_approved ?? p.date_created).split("T")[0]

      const { error: insertError, data: insertData } = await admin
        .from("Transacciones")
        .upsert(
          {
            user_id: userId,
            amount,
            category: "Mercado Pago",
            description: p.description || p.statement_descriptor || `Pago #${p.id}`,
            date: fecha,
            type: esCobro ? "ingreso" : "egreso",
            external_source: "mercadopago",
            external_id: String(p.id),
          },
          { onConflict: "user_id,external_source,external_id", ignoreDuplicates: true }
        )
        .select("id")

      if (insertError) {
        console.error("mercadopago/sync insert failed", p.id, insertError)
        continue
      }
      if (insertData && insertData.length > 0) {
        imported += 1
      }
    }

    await admin.from("MercadoPagoTokens").update({ last_synced_at: new Date().toISOString() }).eq("user_id", userId)

    return res.status(200).json({ imported, revisados: aprobados.length })
  } catch (err) {
    console.error("mercadopago/sync", err)
    const message = err instanceof Error ? err.message : "Error desconocido"
    return res.status(500).json({ error: `No se pudo sincronizar: ${message}` })
  }
}
