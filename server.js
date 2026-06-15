const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/dorar', function(req, res) {
  var q = req.query.q;
  if (!q) return res.status(400).json({ error: '?q= مطلوب' });
  
  function tryFetch(proto, tryHttp) {
    var url = proto + 'dorar.net/dorar_api.json?skey=' + encodeURIComponent(q);
    var fetcher = (proto.indexOf('https') === 0) ? https : http;
    fetcher.get(url, { timeout: 10000 }, function(drRes) {
      var data = '';
      drRes.on('data', function(chunk) { data += chunk; });
      drRes.on('end', function() {
        try {
          var json = JSON.parse(data);
          res.set('Access-Control-Allow-Origin', '*');
          res.json(json);
        } catch(e) {
          if (tryHttp) tryFetch('http://', false);
          else res.status(502).json({ error: 'فشل تحليل JSON' });
        }
      });
    }).on('error', function(e) {
      if (tryHttp) tryFetch('http://', false);
      else res.status(502).json({ error: e.message });
    });
  }
  tryFetch('https://', true);
});

app.use(express.static(path.join(__dirname)));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'hadith_search.html'));
});
app.listen(PORT, '0.0.0.0', function() {
  console.log('✅ Server running on port ' + PORT);
});
