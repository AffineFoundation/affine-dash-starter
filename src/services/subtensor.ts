import { ApiPromise, WsProvider } from '@polkadot/api'

export const DEFAULT_SUBTENSOR_ENDPOINT =
  import.meta.env.VITE_SUBTENSOR_ENDPOINT ?? 'wss://entrypoint-finney.opentensor.ai:443'

let apiPromise: Promise<ApiPromise> | null = null

const getEndpoint = (override?: string) =>
  override?.trim() || DEFAULT_SUBTENSOR_ENDPOINT

export const getSubtensorApi = (endpointOverride?: string) => {
  if (!apiPromise) {
    const provider = new WsProvider(getEndpoint(endpointOverride))
    apiPromise = ApiPromise.create({ provider })
  }
  return apiPromise
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
