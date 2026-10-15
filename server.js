const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.yml':'text/yaml','.yaml':'text/yaml','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.wasm':'application/wasm'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (error, stat) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    if (stat.isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(301,{Location:pathname + '/'}); return res.end(); }
      file = path.join(file,'index.html');
    }
    fs.readFile(file,(err,data)=>{
      if(err) { res.writeHead(404); return res.end('Not found'); }
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.setHeader('X-Content-Type-Options','nosniff');
      res.end(data);
    });
  });
}).listen(process.env.PORT || 3000,'0.0.0.0');
