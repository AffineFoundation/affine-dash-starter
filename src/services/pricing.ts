const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bittensor&vs_currencies=usd'

const DEFAULT_ALPHA_PRICE_BASE_URL = '/api'

type CoingeckoResponse = {
  bittensor?: {
    usd?: number
  }
}

type AlphaPriceApiEntry = {
  cost?: number | string | null
  height?: number | string | null
  timestamp?: string | null
  net_uid?: number | string | null
  price_in_tao?: number | string | null
}

type AlphaPriceApiResponse = {
  data?: {
    content?: AlphaPriceApiEntry[] | null
  } | AlphaPriceApiEntry[]
  content?: AlphaPriceApiEntry[]
}

export type AlphaPriceLatest = {
  priceRao: bigint | null
  timestamp: string | null
}

/**
 * Fetch the current USD price for TAO from Coingecko.
 * Returns null if the response is malformed or unavailable.
 */
export const fetchTaoUsdPrice = async (): Promise<number | null> => {
  const res = await fetch(COINGECKO_URL, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Coingecko request failed: ${res.status} ${res.statusText}`)
  }
  const json = (await res.json()) as CoingeckoResponse
  const value = json?.bittensor?.usd
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }
  return value
}

const ensureBigInt = (value: unknown): bigint | null => {
  if (value == null) return null
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isFinite(value)) {
    try {
      return BigInt(Math.trunc(value))
    } catch {
      return null
    }
  }
  const stringValue =
    typeof value === 'string'
      ? value.trim()
      : typeof value === 'object' && 'toString' in value
      ? String((value as { toString: () => string }).toString()).trim()
      : null
  if (!stringValue) return null
  try {
    return BigInt(stringValue)
  } catch {
    return null
  }
}

const toRaoFromTao = (value: number | string | null | undefined): bigint | null => {
  if (value == null) return null
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value)
      : Number(value as unknown)
  if (!Number.isFinite(numeric)) return null
  const scaled = Math.round(numeric * 1_000_000_000)
  try {
    return BigInt(scaled)
  } catch {
    return null
  }
}

export const fetchAlphaPriceLatest = async (
  netuid: number,
  options?: { baseUrl?: string; apiKey?: string },
): Promise<AlphaPriceLatest> => {
  if (!Number.isFinite(netuid)) {
    throw new Error('Invalid netuid supplied to fetchAlphaPriceLatest')
  }

  const baseUrl =
    options?.baseUrl?.trim() ||
    import.meta.env.VITE_SUBTENSOR_PRICE_BASE_URL?.trim() ||
    DEFAULT_ALPHA_PRICE_BASE_URL
  const apiKey =
    options?.apiKey?.trim() || import.meta.env.VITE_SUBTENSOR_API_KEY?.trim() || ''

  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const params = new URLSearchParams({
    page: '1',
    limit: '256',
    sortDirection: 'DESC',
  })

  const endpoint = `${normalizedBase}/prices/latest?${params.toString()}`
  const requestUrl =
    endpoint.startsWith('/') && typeof window !== 'undefined'
      ? `${window.location.origin}${endpoint}`
      : endpoint

  let res: Response
  try {
    res = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
    })
  } catch (error) {
    console.warn('[pricing] alpha price request failed to reach host', error)
    return { priceRao: null, timestamp: null }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.warn(
      '[pricing] alpha price request returned non-2xx status',
      res.status,
      res.statusText,
      text,
    )
    return { priceRao: null, timestamp: null }
  }

  const json = (await res.json()) as AlphaPriceApiResponse

  let list: AlphaPriceApiEntry[] = []
  if (Array.isArray(json?.content)) {
    list = json.content
  } else if (Array.isArray(json?.data)) {
    list = json.data as AlphaPriceApiEntry[]
  } else if (
    json?.data &&
    typeof json.data === 'object' &&
    Array.isArray((json.data as { content?: AlphaPriceApiEntry[] }).content)
  ) {
    list = ((json.data as { content?: AlphaPriceApiEntry[] }).content ??
      []) as AlphaPriceApiEntry[]
  }

  const entry =
    list.find((item) => Number(item?.net_uid) === Number(netuid)) ?? null
  if (!entry) {
    return { priceRao: null, timestamp: null }
  }

  const priceRao =
    toRaoFromTao(entry.price_in_tao as number | string | null | undefined) ??
    ensureBigInt(entry.cost)
  const timestamp =
    typeof entry.timestamp === 'string' && entry.timestamp.trim() !== ''
      ? entry.timestamp
      : null

  return { priceRao, timestamp }
}

export const RAO_PER_TAO = 1_000_000_000n
