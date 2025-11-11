const { query } = require('../config/database.cjs');

async function environmentsHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const sql = `
      SELECT DISTINCT env_name
      FROM public.affine_results
      WHERE env_name IS NOT NULL
      ORDER BY env_name;
    `;
    const { rows } = await query(sql);
    // Return array of environment names
    const environments = rows.map(row => row.env_name);
    return res.status(200).json(environments);
  } catch (err) {
    console.error('Environments query error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
}

module.exports = environmentsHandler;