const { once } = require('events');
const QueryStream = require('pg-query-stream');
const { getPool } = require('../config/database.cjs');

const SELECT_ROLLOUTS_SQL = `
  SELECT
    ingested_at AS recorded_at,
    uid,
    hotkey,
    model,
    revision,
    env_name,
    score,
    latency_seconds,
    extra,
    raw_data
  FROM public.affine_results
  WHERE model = $1
  ORDER BY ingested_at DESC;
`;

const normalizeModel = (query) => {
  if (!query) return '';
  if (Array.isArray(query)) {
    return query.find((value) => typeof value === 'string' && value.trim()) ?? '';
  }
  return typeof query === 'string' ? query.trim() : '';
};

async function rolloutsModelHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const model =
    normalizeModel(req.query.modelName) || normalizeModel(req.query.model);

  if (!model) {
    return res
      .status(400)
      .json({ message: 'Provide a model name via ?model or ?modelName.' });
  }

  let client;
  let stream;

  try {
    const pool = getPool();
    client = await pool.connect();

    stream = client.query(
      new QueryStream(SELECT_ROLLOUTS_SQL, [model], { batchSize: 1_000 }),
    );

    const safeModelName = model.replace(/[^\w.-]/g, '_');
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rollouts_${safeModelName}.jsonl"`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 200;

    for await (const row of stream) {
      const payload = {
        ingested_at: row.recorded_at,
        uid: row.uid,
        hotkey: row.hotkey,
        model: row.model,
        revision: row.revision,
        env_name: row.env_name,
        score: row.score,
        latency_seconds: row.latency_seconds,
        rollout_data: row.extra,
        raw_data: row.raw_data,
      };

      const chunk = `${JSON.stringify(payload)}\n`;
      if (!res.write(chunk)) {
        await once(res, 'drain');
      }
    }

    res.end();
  } catch (err) {
    console.error('Error streaming rollouts for model %s:', model, err);

    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to stream rollouts.' });
    } else {
      res.destroy(err);
    }
  } finally {
    if (stream && !stream.destroyed) {
      stream.destroy();
    }
    if (client) {
      client.release();
    }
  }
}

module.exports = rolloutsModelHandler;