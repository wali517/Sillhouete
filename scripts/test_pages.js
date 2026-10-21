const http = require('http');

function test(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ path, status: res.statusCode, length: data.length }));
    }).on('error', reject);
  });
}

(async () => {
  const pages = ['/', '/collections/sale-1', '/products/livia', '/account', '/checkout'];
  for (const p of pages) {
    const res = await test(p);
    console.log(`Page: ${res.path.padEnd(22)} Status: ${res.status} Length: ${res.length}`);
  }
})();
