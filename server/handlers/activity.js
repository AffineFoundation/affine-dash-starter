import { query } from '../db.js';

async function getActivity(req, res, next) {
  try {
    const sql = `
      SELECT
        ingested_at,
        hotkey,
        uid,
        model,
        env_name,
        score,
        success
      FROM public.affine_results
      ORDER BY ingested_at DESC
      LIMIT 10;
    `;
    const { rows } = await query(sql);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Activity query error:', err);
    next(err);
  }
}

export default getActivity;

