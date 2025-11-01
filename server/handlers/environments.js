import { query } from '../db.js';

async function getEnvironments(req, res, next) {
  try {
    const sql = `
      -- This query gets a distinct, sorted list of all recently active environments.
      SELECT DISTINCT env_name
      FROM public.affine_results
      WHERE ingested_at > NOW() - INTERVAL '30 days' -- Match subnet-overview window so columns always align
      ORDER BY env_name ASC;
    `;
    const { rows } = await query(sql);
    const envs = rows.map(r => r.env_name);
    res.status(200).json(envs);
  } catch (err) {
    console.error('Environments endpoint error:', err);
    next(err);
  }
}

export default getEnvironments;

