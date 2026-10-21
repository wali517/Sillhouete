const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

const start = html.indexOf('grid-product');
if (start !== -1) {
  console.log(html.slice(start - 50, start + 2500));
}
