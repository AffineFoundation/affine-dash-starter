const URL = 'https://weight-watcher-nfvr.onrender.com/summary/latest';

async function validatorSummaryHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const response = await fetch(URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Validator summary error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = validatorSummaryHandler;