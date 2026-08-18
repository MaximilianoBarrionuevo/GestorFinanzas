import type { investmentCurrency, investmentType } from "../types/types"

/**
 * Cotizaciones de mercado en vivo.
 *
 * Hoy solo está resuelto CRYPTO, vía la API pública de CoinGecko (gratis, sin
 * key, con CORS habilitado para llamar directo desde el browser).
 *
 * Para CEDEARs / acciones argentinas no hay una API gratuita confiable; lo
 * más viable es un proveedor pago (ej. data912.com, IOL API) o una Supabase
 * Edge Function que scrapee un endpoint propio (evita problemas de CORS al
 * llamarlo desde el browser). Para esos tipos, `fetchCurrentPrice` devuelve
 * `null` y el usuario sigue cargando el precio a mano.
 */

// Ticker (como se carga en el form) -> id de CoinGecko. Cubre las sugerencias
// del formulario de inversiones más algunas monedas comunes adicionales.
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  LTC: "litecoin",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  TRX: "tron",
  SHIB: "shiba-inu",
}

const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"

/**
 * Trae el precio actual de un activo, ya denominado en `moneda` (ARS o USD)
 * — CoinGecko soporta pedir la cotización directo en cualquiera de las dos,
 * así que no hace falta convertir a mano con un tipo de cambio aparte.
 * Devuelve `null` si el tipo de activo no tiene fuente automática todavía,
 * si el ticker no está mapeado, o si falla la request (sin conexión, rate
 * limit de CoinGecko, etc) — en todos los casos el llamador debe permitir
 * cargar el precio a mano como fallback.
 */
export async function fetchCurrentPrice(
  activo: string,
  tipo: investmentType,
  moneda: investmentCurrency = "USD"
): Promise<number | null> {
  if (tipo !== "CRYPTO") return null

  const id = COINGECKO_IDS[activo.trim().toUpperCase()]
  if (!id) return null

  const vsCurrency = moneda === "ARS" ? "ars" : "usd"

  try {
    const res = await fetch(`${COINGECKO_URL}?ids=${id}&vs_currencies=${vsCurrency}`)
    if (!res.ok) return null

    const data: Record<string, Record<string, number>> = await res.json()
    const price = data[id]?.[vsCurrency]

    return typeof price === "number" ? price : null
  } catch {
    return null
  }
}

/** true si `activo` (para el `tipo` dado) tiene cotización automática disponible. */
export function hasAutoPrice(activo: string, tipo: investmentType): boolean {
  return tipo === "CRYPTO" && activo.trim().toUpperCase() in COINGECKO_IDS
}
