// tiny static server so the page loads over http (needed for CSS masks)
const http = require('http'), fs = require('fs'), path = require('path');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.css': 'text/css' };
module.exports = function serve(root) {
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
      fs.readFile(f, (e, d) => {
        if (e) { rsp.writeHead(404); return rsp.end(); }
        rsp.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); rsp.end(d);
      });
    }).listen(0, '127.0.0.1', () => res({ server: s, url: `http://127.0.0.1:${s.address().port}` }));
  });
};
