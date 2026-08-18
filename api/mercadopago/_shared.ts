import { createClient } from "@supabase/supabase-js"
import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Cliente de Supabase con la service_role key: bypasea RLS por completo.
 * Solo se usa desde estas funciones serverless (nunca desde el browser) para
 * poder leer/escribir la tabla de tokens de Mercado Pago, que el cliente no
 * puede tocar directamente.
 */
export function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Faltan las variables de entorno de Supabase (service role) en el servidor.")
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export function getMpConfig() {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Faltan las variables de entorno de Mercado Pago en el servidor.")
  }

  return { clientId, clientSecret, redirectUri }
}

const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutos: tiempo que tiene el usuario para completar el login en MP.

function getStateSecret() {
  const secret = process.env.OAUTH_STATE_SECRET
  if (!secret) throw new Error("Falta OAUTH_STATE_SECRET en el servidor.")
  return secret
}

/**
 * El `state` del flujo OAuth es la única forma de saber, cuando Mercado Pago
 * redirige de vuelta al callback, a qué usuario de nuestra app corresponde
 * esa conexión (el callback es una navegación de browser común, sin headers
 * de auth). Por eso viaja firmado: nadie puede fabricar uno para otro usuario.
 */
export function signState(userId: string): string {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + STATE_TTL_MS })
  const payloadB64 = Buffer.from(payload).toString("base64url")
  const signature = createHmac("sha256", getStateSecret()).update(payloadB64).digest("base64url")
  return `${payloadB64}.${signature}`
}

export function verifyState(state: string): string | null {
  const [payloadB64, signature] = state.split(".")
  if (!payloadB64 || !signature) return null

  const expected = createHmac("sha256", getStateSecret()).update(payloadB64).digest("base64url")
  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(signature)

  if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"))
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null
    if (Date.now() > payload.exp) return null
    return payload.uid
  } catch {
    return null
  }
}

/** Valida el JWT de Supabase que manda el cliente y devuelve el user_id, o null si no es válido. */
export async function getAuthenticatedUserId(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice("Bearer ".length)

  const admin = getAdminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null

  return data.user.id
}
