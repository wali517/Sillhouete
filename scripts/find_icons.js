const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

const first = html.indexOf('class="header-item header-item--icons"');
if (first !== -1) {
  console.log(html.slice(first, first + 3000));
} else {
  console.log('Not found by exact class');
  const matches = [...html.matchAll(/header-item--icons/g)];
  console.log('Total occurrences:', matches.length);
  for (const m of matches) {
    console.log('At offset:', m.index);
    console.log(html.slice(m.index - 20, m.index + 500));
  }
}
