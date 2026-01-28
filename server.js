const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3000;

// Mapping des routes API vers leurs URLs
const API_ROUTES = {
  '/api/json/': (id) => `http://med-api.philharmoniedeparis.fr/IAConferences/query/tostrapi/id/${id}?extended=true`,
  '/api/xml/': (id) => `http://med-api.philharmoniedeparis.fr/Medias/GetAudioPlaylist/id/${id}/xml`
};

// Types MIME
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain'
};

// Fonction pour faire un proxy des requêtes API
function proxyApiRequest(apiUrl, res) {
  const urlObj = new URL(apiUrl);
  
  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  };
  
  http.get(options, (apiRes) => {
    res.writeHead(apiRes.statusCode, {
      'Content-Type': apiRes.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    apiRes.pipe(res);
  }).on('error', (err) => {
    console.error('Erreur proxy:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

// Créer le serveur
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Proxy pour les APIs
  for (const [route, urlBuilder] of Object.entries(API_ROUTES)) {
    if (req.url.startsWith(route)) {
      const id = req.url.replace(route, '').split('?')[0];
      proxyApiRequest(urlBuilder(id), res);
      return;
    }
  }
  
  // Servir les fichiers statiques
  const filePath = req.url === '/' ? './Pup-Conference.html' : '.' + req.url;
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Fichier non trouvé</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Erreur serveur: ${err.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 Serveur démarré !');
  console.log('📡 Port:', PORT);
  console.log('🌐 Ouvrez: http://localhost:' + PORT);
  console.log('');
  console.log('Proxy activé pour:');
  console.log('  - /api/json/{id} → API IAConferences');
  console.log('  - /api/xml/{id}  → API GetAudioPlaylist');
  console.log('');
});
