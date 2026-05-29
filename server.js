const express = require('express');
const cors    = require('cors');
const path    = require('path');
const https   = require('https');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy: Sismos API (evita CORS)
app.get('/proxy/sismos', (req, res) => {
  const options = {
    hostname: 'sismosve.rafnixg.dev',
    path:     '/api/sismos',
    method:   'GET',
    headers:  { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
  };
  const request = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    });
  });
  request.on('error', e => res.status(500).json({ error: e.message }));
  request.end();
});

// Encender
app.listen(3000, () => {
  console.log('✅ Servidor listo en: http://localhost:3000');
});
