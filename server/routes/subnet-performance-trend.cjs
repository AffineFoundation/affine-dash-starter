const { query } = require('../config/database.cjs');

const PERFORMANCE_SQL = `
  SELECT
    timestamp,
    block,
    score / 100.0 AS score
  FROM
    public.epoch_top_miner_performance
  WHERE
    timestamp >= NOW() - INTERVAL '30 day'
  ORDER BY
    block ASC;
`;

const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

async function subnetPerformanceTrendHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { rows } = await query(PERFORMANCE_SQL);
    const points = rows
      .map((row) => {
        const timestamp = normalizeTimestamp(row.timestamp);
        const blockNumber = row.block == null ? null : Number(row.block);
        const score = row.score == null ? null : Number(row.score);
        if (!timestamp || blockNumber == null || Number.isNaN(blockNumber)) {
          return null;
        }
        return {
          timestamp,
          block: blockNumber,
          score,
        };
      })
      .filter(Boolean);

    return res.status(200).json(points);
  } catch (err) {
    console.error('Subnet performance trend error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
}

module.exports = subnetPerformanceTrendHandler;