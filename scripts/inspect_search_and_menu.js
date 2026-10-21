const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

// 1. Search bar details in live site
console.log('=== SEARCH BAR IN LIVE SITE ===');
const searchStart = html.indexOf('site-header__search');
if (searchStart !== -1) {
  console.log(html.slice(searchStart, searchStart + 2500));
}

// 2. Menu nav links css & computed styles
console.log('\n=== MENU NAV CSS ===');
const matches = html.match(/\.site-nav[^{]*\{[^}]*\}/gi) || [];
for (const m of matches) {
  console.log(m);
}

// Check nav font size across all styles
const navStyles = html.match(/\.site-nav__link[^{]*\{[^}]*\}/gi) || [];
for (const s of navStyles) {
  console.log(s);
}
