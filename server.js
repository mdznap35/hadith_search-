const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'ar,en;q=0.9',
  'Referer': 'https://dorar.net/',
  'Origin': 'https://dorar.net'
};

app.get('/api/dorar', function(req, res) {
  var q = req.query.q;
  if (!q) return res.status(400).json({ error: '?q= مطلوب' });
  
  var encodedQ = encodeURIComponent(q);

  function tryDirect() {
    var options = {
      hostname: 'dorar.net',
      path: '/dorar_api.json?skey=' + encodedQ,
      method: 'GET',
      headers: headers,
      timeout: 10000
    };
    
    var req = https.request(options, function(drRes) {
      var data = '';
      drRes.on('data', function(chunk) { data += chunk; });
      drRes.on('end', function() {
        if (drRes.statusCode !== 200) return tryMiddleware();
        try {
          var json = JSON.parse(data);
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Cache-Control', 'public, max-age=300');
          res.json(json);
        } catch(e) { tryMiddleware(); }
      });
    });
    req.on('error', function() { tryMiddleware(); });
    req.on('timeout', function() { req.destroy(); tryMiddleware(); });
    req.end();
  }

  function tryMiddleware() {
    var mwUrl = 'https://dorar-hadith-api-ooo6.onrender.com/v1/api/hadith/search?value=' + encodedQ;
    https.get(mwUrl, { timeout: 10000, headers: { 'User-Agent': 'hadith-search/1.0' } }, function(mwRes) {
      var data = '';
      mwRes.on('data', function(chunk) { data += chunk; });
      mwRes.on('end', function() {
        try {
          var json = JSON.parse(data);
          if (json && json.data && Array.isArray(json.data)) {
            var result = json.data.map(function(h) {
              return { th: h.hadith || '', rawi: h.rawi || '', source: h.book || '', hukm: h.grade || '' };
            }).filter(function(h) { return h.th; });
            res.set('Access-Control-Allow-Origin', '*');
            res.json({ ahadith: result });
          } else { res.status(502).json({ error: 'فشل' }); }
        } catch(e) { res.status(502).json({ error: 'فشل' }); }
      });
    }).on('error', function(e) { res.status(502).json({ error: e.message }); });
  }
  tryDirect();
});

app.use(express.static(path.join(__dirname)));
app.get('/', function(req, res) { res.sendFile(path.join(__dirname, 'hadith_search.html')); });
app.listen(PORT, '0.0.0.0', function() { console.log('✅ Server on port ' + PORT); });
