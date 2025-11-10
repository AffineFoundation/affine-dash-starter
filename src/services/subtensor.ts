import { ApiPromise, HttpProvider, WsProvider } from '@polkadot/api'
import { RAO_PER_TAO } from './pricing'

export const DEFAULT_SUBTENSOR_ENDPOINT =
  import.meta.env.VITE_SUBTENSOR_ENDPOINT ?? 'wss://entrypoint-finney.opentensor.ai:443'

type TransportKind = 'ws' | 'http'

const parseTransportPreferenceFromEnv = (): TransportKind[] | null => {
  const raw = import.meta.env.VITE_SUBTENSOR_TRANSPORT_ORDER
  if (!raw) return null
  const parsed = raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is TransportKind => entry === 'ws' || entry === 'http')
  return parsed.length ? parsed : null
}

const transportPreferenceOverride = parseTransportPreferenceFromEnv()

const parsedTimeout = Number.parseInt(
  import.meta.env.VITE_SUBTENSOR_CONNECT_TIMEOUT_MS ?? '',
  10,
)
const CONNECT_TIMEOUT_MS = Number.isFinite(parsedTimeout) ? parsedTimeout : 8000

let apiPromise: Promise<ApiPromise> | null = null

const getEndpoint = (override?: string) =>
  override?.trim() || DEFAULT_SUBTENSOR_ENDPOINT

const isHttpProtocol = (value: string) => /^https?:\/\//i.test(value)
const isWsProtocol = (value: string) => /^wss?:\/\//i.test(value)

const stripLeadingSlashes = (value: string) => value.replace(/^\/+/, '')

const toHttpEndpoint = (value: string) => {
  if (isHttpProtocol(value)) return value
  if (isWsProtocol(value)) {
    return value.replace(/^ws(s)?:\/\//i, (_, secure: string | undefined) =>
      secure ? 'https://' : 'http://',
    )
  }
  return `https://${stripLeadingSlashes(value)}`
}

const toWsEndpoint = (value: string) => {
  if (isWsProtocol(value)) return value
  if (isHttpProtocol(value)) {
    return value.replace(/^http(s)?:\/\//i, (_, secure: string | undefined) =>
      secure ? 'wss://' : 'ws://',
    )
  }
  return `wss://${stripLeadingSlashes(value)}`
}

const getTransportOrder = (endpoint: string): TransportKind[] => {
  if (transportPreferenceOverride) return transportPreferenceOverride
  if (isHttpProtocol(endpoint) && !isWsProtocol(endpoint)) return ['http']
  return ['ws', 'http']
}

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
  onTimeout?: () => void,
): Promise<T> => {
  if (!timeoutMs || timeoutMs <= 0) return promise
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      onTimeout?.()
      reject(new Error(message))
    }, timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

const createProviderForTransport = (endpoint: string, transport: TransportKind) => {
  if (transport === 'http') {
    const url = toHttpEndpoint(endpoint)
    return { provider: new HttpProvider(url), url }
  }
  const url = toWsEndpoint(endpoint)
  return { provider: new WsProvider(url), url }
}

const connectSubtensorApi = async (endpoint: string): Promise<ApiPromise> => {
  const errors: string[] = []
  const transports = getTransportOrder(endpoint)
  if (!transports.length) {
    throw new Error('No transports configured for Subtensor endpoint')
  }

  for (const transport of transports) {
    const { provider, url } = createProviderForTransport(endpoint, transport)
    try {
      const api = await withTimeout(
        ApiPromise.create({ provider }),
        CONNECT_TIMEOUT_MS,
        `[subtensor] ${transport.toUpperCase()} connection timed out after ${CONNECT_TIMEOUT_MS}ms (${url})`,
        () => {
          try {
            provider.disconnect()
          } catch {
            // ignore cleanup errors
          }
        },
      )
      console.info(`[subtensor] connected via ${transport.toUpperCase()} (${url})`)
      return api
    } catch (error) {
      const message =
        error instanceof Error ? error.message : error ? String(error) : 'Unknown error'
      errors.push(`${transport.toUpperCase()} ${url}: ${message}`)
      console.warn(`[subtensor] ${transport.toUpperCase()} connection failed`, error)
      try {
        provider.disconnect()
      } catch {
        // ignore cleanup errors
      }
    }
  }

  throw new Error(
    errors.length
      ? `Unable to connect to Subtensor endpoint. Attempts: ${errors.join(' | ')}`
      : 'Unable to connect to Subtensor endpoint.',
  )
}

const establishApiPromise = (endpoint: string) => {
  const promise = connectSubtensorApi(endpoint)
  apiPromise = promise
  promise.catch(() => {
    if (apiPromise === promise) {
      apiPromise = null
    }
  })
  return promise
}

export const getSubtensorApi = (endpointOverride?: string) => {
  if (apiPromise) return apiPromise
  return establishApiPromise(getEndpoint(endpointOverride))
}

export const fetchCurrentBlock = async (
  endpointOverride?: string,
): Promise<number | null> => {
  const api = await getSubtensorApi(endpointOverride)
  const blockNumber = await api.query.system.number()
  try {
    return blockNumber.toNumber()
  } catch {
    return Number(blockNumber.toString())
  }
}

export type SubtensorEmission = {
  uid: number
  emission: string
}

type SubtensorModuleQueries = {
  emission?: (netuid: number) => Promise<unknown>
}

const ensureString = (value: unknown) => {
  if (value == null) return '0'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString()
  }
  if (typeof value === 'object' && 'toString' in value) {
    try {
      const result = (value as { toString: () => string }).toString()
      return result || '0'
    } catch {
      return '0'
    }
  }
  return '0'
}

export const fetchSubnetEmissions = async (
  netuid: number,
  endpointOverride?: string,
): Promise<SubtensorEmission[]> => {
  const api = await getSubtensorApi(endpointOverride)
  const queries = (api.query as Record<string, unknown>)?.subtensorModule as
    | SubtensorModuleQueries
    | undefined

  const emissionQuery = queries?.emission
  if (!emissionQuery) return []

  const emissions = await emissionQuery(netuid)
  if (!emissions) {
    console.warn('[subtensor] emission storage returned empty', { netuid })
    return []
  }

  let toArray: unknown[]
  if (typeof (emissions as { toArray?: () => unknown[] }).toArray === 'function') {
    toArray = (emissions as { toArray: () => unknown[] }).toArray()
  } else if (Array.isArray(emissions)) {
    toArray = emissions
  } else {
    try {
      toArray = Array.from(emissions as Iterable<unknown>)
    } catch {
      toArray = []
    }
  }

  console.debug('[subtensor] emission raw sample', {
    netuid,
    type: emissions.constructor?.name,
    length: toArray.length,
    sample: toArray.slice(0, 5).map((value) => ensureString(value)),
  })

  const parsed = toArray.map((value, index) => ({
    uid: index,
    emission: ensureString(value),
  }))

  if (parsed.every((entry) => entry.emission === '0')) {
    console.warn('[subtensor] all emission values are zero', {
      netuid,
      count: parsed.length,
    })
  }

  return parsed
}

export const disconnectSubtensor = async () => {
  if (!apiPromise) return
  const api = await apiPromise
  api.disconnect()
  apiPromise = null
}

export const convertRaoToTao = (value: bigint | null | undefined): number | null => {
  if (value == null) return null
  try {
    const whole = value / RAO_PER_TAO
    const remainder = value % RAO_PER_TAO
    return Number(whole) + Number(remainder) / Number(RAO_PER_TAO)
  } catch (error) {
    console.error('[subtensor] failed to convert RAO to TAO', error)
    return null
  }
}
