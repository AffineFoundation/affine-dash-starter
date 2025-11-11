const AFFINE_REPO_BASE =
  'https://github.com/AffineFoundation/affinetes/tree/main/environments/affine'
const AFFINE_FILE_BASE =
  'https://github.com/AffineFoundation/affinetes/blob/main/environments/affine'
const AGENTGYM_REPO_BASE = 'https://github.com/angosr/AgentGym'

const toNormalized = (envName: string | null | undefined) =>
  (envName ?? '').trim().toLowerCase()

const toSlug = (envName: string | null | undefined) => {
  const normalized = toNormalized(envName)
  if (!normalized) return ''
  const parts = normalized.split(':')
  return parts[parts.length - 1] || ''
}

const ensureAgentGymSlug = (slug: string) =>
  slug.startsWith('agentenv-') ? slug : `agentenv-${slug}`

export const isAgentGymEnv = (envName: string | null | undefined) =>
  toNormalized(envName).startsWith('agentgym:')

export const getEnvRepoUrl = (envName: string | null | undefined) =>
  isAgentGymEnv(envName) ? AGENTGYM_REPO_BASE : AFFINE_REPO_BASE

export const getEnvCodeUrl = (envName: string | null | undefined) => {
  const slug = toSlug(envName)
  if (!slug) return null
  if (isAgentGymEnv(envName)) {
    const agentSlug = ensureAgentGymSlug(slug)
    return `${AGENTGYM_REPO_BASE}/tree/main/${agentSlug}`
  }
  return `${AFFINE_FILE_BASE}/${slug}.py`
}
