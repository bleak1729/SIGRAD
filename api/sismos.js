const https = require('https');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const options = {
    hostname: 'sismosve.rafnixg.dev',
    path:     '/api/sismos',
    method:   'GET',
    headers:  { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
  };

  const request = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => res.send(data));
  });

  request.on('error', e => res.status(500).json({ error: e.message }));
  request.end();
};
