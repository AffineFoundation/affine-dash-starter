import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DEFAULT_SUBTENSOR_ENDPOINT,
  fetchCurrentBlock,
  fetchSubnetEmissions,
  SubtensorEmission,
} from '../services/subtensor'

const DEFAULT_NETUID = Number.parseInt(
  import.meta.env.VITE_SUBTENSOR_NETUID ?? '120',
  10,
)

type UseSubtensorChainResult = {
  currentBlock: number | null | undefined
  currentBlockLoading: boolean
  currentBlockError: string | null
  emissions: SubtensorEmission[] | undefined
  emissionByUid: Map<number, SubtensorEmission>
  emissionsLoading: boolean
  emissionsError: string | null
}

const endpoint =
  import.meta.env.VITE_SUBTENSOR_ENDPOINT?.trim() ?? DEFAULT_SUBTENSOR_ENDPOINT

const toErrorMessage = (error: unknown) => {
  if (!error) return null
  if (error instanceof Error) return error.message
  return String(error)
}

const useSubtensorChain = (
  netuid: number = DEFAULT_NETUID,
): UseSubtensorChainResult => {
  const blockQuery = useQuery({
    queryKey: ['subtensor', 'block', endpoint],
    queryFn: () => fetchCurrentBlock(endpoint),
    refetchInterval: 6000,
    staleTime: 3000,
  })

  const emissionQuery = useQuery({
    queryKey: ['subtensor', 'emissions', endpoint, netuid],
    queryFn: () => fetchSubnetEmissions(netuid, endpoint),
    enabled: Number.isFinite(netuid),
    refetchInterval: 60000,
    staleTime: 30000,
  })

  const emissionByUid = useMemo(() => {
    const map = new Map<number, SubtensorEmission>()
    if (emissionQuery.data) {
      emissionQuery.data.forEach((emission) => {
        map.set(emission.uid, emission)
      })
    }
    return map
  }, [emissionQuery.data])

  return {
    currentBlock: blockQuery.data,
    currentBlockLoading: blockQuery.isLoading,
    currentBlockError: toErrorMessage(blockQuery.error),
    emissions: emissionQuery.data,
    emissionByUid,
    emissionsLoading: emissionQuery.isLoading,
    emissionsError: toErrorMessage(emissionQuery.error),
  }
}

export default useSubtensorChain
