const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

const start = html.indexOf('site-header');
if (start !== -1) {
  const snippet = html.slice(start, start + 6000);
  console.log(snippet);
}
