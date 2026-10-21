const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

const start = html.indexOf('grid-product__meta');
if (start !== -1) {
  console.log(html.slice(start - 20, start + 1000));
}
