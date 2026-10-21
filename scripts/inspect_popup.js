const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

const start = html.indexOf('NewsletterPopup');
if (start !== -1) {
  console.log(html.slice(start, start + 3500));
}
