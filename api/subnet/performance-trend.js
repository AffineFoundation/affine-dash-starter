import { query } from '../_db.js'

const WEIGHTS_URL =
  'https://pub-bf429ea7a5694b99adaf3d444cbbe64d.r2.dev/affine/weights/latest.json'

const PERFORMANCE_SQL = `
  SELECT
    date_trunc('day', ingested_at) AS timestamp,
    AVG(
      CASE
        WHEN env_name = 'agentgym:sciworld' THEN (score - (-100.0)) / (100.0 - (-100.0))
        ELSE score
      END
    ) AS score
  FROM
    public.affine_results
  WHERE
    hotkey = $1
    AND ingested_at >= NOW() - INTERVAL '30 day'
    AND score IS NOT NULL
  GROUP BY
    date_trunc('day', ingested_at)
  ORDER BY
    timestamp ASC;
`

const parseWeight = (value) => {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const numeric = Number.parseFloat(String(value))
  return Number.isFinite(numeric) ? numeric : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const summaryResponse = await fetch(WEIGHTS_URL, { cache: 'no-store' })
    if (!summaryResponse.ok) {
      throw new Error(`Failed to fetch latest weights: ${summaryResponse.status}`)
    }
    const summary = await summaryResponse.json()
    const miners = summary?.data?.miners

    let topMinerHotkey = null
    let maxWeight = -Infinity

    if (miners && typeof miners === 'object') {
      for (const [hotkey, miner] of Object.entries(miners)) {
        if (!miner) continue
        const weightValue =
          parseWeight(miner.weight ?? miner.total_weight ?? miner.score ?? null) ??
          -Infinity
        if (weightValue > maxWeight) {
          maxWeight = weightValue
          topMinerHotkey = hotkey
        }
      }
    }

    if (!topMinerHotkey) {
      return res.status(200).json({ hotkey: null, data: [] })
    }

    const { rows } = await query(PERFORMANCE_SQL, [topMinerHotkey])
    const trend = rows.map((row) => ({
      timestamp:
        row.timestamp instanceof Date
          ? row.timestamp.toISOString()
          : new Date(row.timestamp).toISOString(),
      score: row.score == null ? null : Number(row.score),
    }))

    return res.status(200).json({
      hotkey: topMinerHotkey,
      data: trend,
    })
  } catch (err) {
    console.error('Subnet performance trend error:', err)
    return res.status(500).json({ message: 'Server Error' })
  }
}
