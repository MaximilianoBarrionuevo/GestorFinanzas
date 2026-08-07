import type { investmentType } from "../types/types"

/**
 * Punto de extensión para cuando se quiera traer cotizaciones de mercado en
 * vivo en vez de cargarlas a mano.
 *
 * Cómo cablearlo en el futuro:
 * 1. Crypto (BTC, ETH, etc): CoinGecko API pública, sin key, `/simple/price`.
 * 2. CEDEARs / acciones: no hay una API gratuita confiable para el mercado
 *    argentino; lo más viable es un proveedor pago (ej. data912.com, IOL API)
 *    o scrapear un endpoint propio via una Edge Function de Supabase (evita
 *    problemas de CORS al llamarlo desde el browser).
 * 3. Reemplazar el cuerpo de esta función por el fetch real. La firma no
 *    debería cambiar, así que no hace falta tocar los componentes que la usan.
 */
export async function fetchCurrentPrice(
  _activo: string,
  _tipo: investmentType
): Promise<number | null> {
  // Todavía no implementado: el usuario carga el precio a mano.
  return null
}