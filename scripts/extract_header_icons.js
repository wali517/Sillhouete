const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

const start = html.indexOf('header-item--icons');
if (start !== -1) {
  const snippet = html.slice(start, start + 3000);
  console.log(snippet);
} else {
  console.log('header-item--icons not found');
}
