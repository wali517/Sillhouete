const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

// Find theme CSS or main styles
const styles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('Total style tags:', styles.length);

for (let i = 0; i < styles.length; i++) {
  const s = styles[i];
  if (s.includes('--typeBasePrimary') || s.includes('--typeHeaderPrimary') || s.includes('body,') || s.includes('site-nav__link')) {
    console.log(`\n--- Style tag ${i} ---`);
    console.log(s.slice(0, 1500));
  }
}
