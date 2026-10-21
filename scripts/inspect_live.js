const fs = require('fs');

const html = fs.readFileSync('live_sillhouete.html', 'utf8');

// 1. Announcements
console.log('=== 1. ANNOUNCEMENTS ===');
const annRegex = /class="[^"]*announcement[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
let m;
const announcements = [];
const pRegex = /<p[^>]*class="[^"]*announcement[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
while ((m = pRegex.exec(html)) !== null) {
  announcements.push(m[1].replace(/<[^>]+>/g, '').trim());
}
console.log('Announcements found:', announcements);

// 2. Head styles / CSS regarding SALE or blinks
console.log('\n=== 2. BLINKS / SALE CSS ===');
const styleMatches = html.match(/<style[\s\S]*?<\/style>/gi) || [];
for (const s of styleMatches) {
  if (s.includes('blinks') || s.includes('sale-menu') || s.includes('sale-1')) {
    console.log('Found style containing blinks/sale:');
    console.log(s);
  }
}

// 3. Navigation Header
console.log('\n=== 3. HEADER NAV ITEMS ===');
const navRegex = /<nav[^>]*>([\s\S]*?)<\/nav>/gi;
while ((m = navRegex.exec(html)) !== null) {
  console.log('Nav block length:', m[1].length);
  const links = [];
  const lmRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let lm;
  while ((lm = lmRegex.exec(m[1])) !== null) {
    const text = lm[2].replace(/<[^>]+>/g, '').trim();
    if (text) links.push({ href: lm[1], text });
  }
  console.log('Nav links count:', links.length);
  console.log('Nav links:', links.slice(0, 15));
}

// 4. Sections on Homepage
console.log('\n=== 4. HOMEPAGE SECTIONS ===');
const sectionRegex = /<div[^>]*id="shopify-section-([^"]*)"[^>]*>/gi;
const sections = [];
while ((m = sectionRegex.exec(html)) !== null) {
  sections.push(m[1]);
}
console.log('Shopify sections order:', sections);

// 5. Instagram Feed
console.log('\n=== 5. INSTAGRAM FEED ===');
for (const sec of sections) {
  if (sec.toLowerCase().includes('insta') || sec.toLowerCase().includes('feed')) {
    console.log('Found insta section:', sec);
  }
}

// 6. View All buttons
console.log('\n=== 6. VIEW ALL BUTTONS ===');
const btnRegex = /<a[^>]*class="[^"]*btn[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
while ((m = btnRegex.exec(html)) !== null) {
  const text = m[2].replace(/<[^>]+>/g, '').trim();
  if (text.toLowerCase().includes('view all')) {
    console.log('View All link:', m[1], 'text:', text);
  }
}

// 7. Badges (New, Sale, etc.)
console.log('\n=== 7. BADGES & PRODUCT CARDS ===');
const badgeRegex = /class="[^"]*(badge|tag)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)>/gi;
const badges = [];
while ((m = badgeRegex.exec(html)) !== null) {
  const text = m[2].replace(/<[^>]+>/g, '').trim();
  if (text) badges.push({ full: m[0], text });
}
console.log('Badges count:', badges.length, badges.slice(0, 10));
