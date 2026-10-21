const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

// 1. Check fonts
console.log('=== 1. FONTS IN LIVE SITE ===');
const fontMatches = html.match(/font-family:[^;]+;/gi) || [];
const fontMap = {};
for (const f of fontMatches) {
  fontMap[f.trim()] = (fontMap[f.trim()] || 0) + 1;
}
console.log('Top font-families:', Object.entries(fontMap).sort((a,b) => b[1] - a[1]).slice(0, 15));

// Check typography links (google fonts, adobe fonts, shopify cdn font files)
const fontLinks = html.match(/<link[^>]*font[^>]*>/gi) || [];
console.log('Font links:', fontLinks);
const atFontFaces = html.match(/@font-face[\s\S]*?}/gi) || [];
console.log('@font-face count:', atFontFaces.length);
for (const ff of atFontFaces.slice(0, 5)) {
  console.log(ff);
}

// 2. Check Popup on open (newsletter-popup or login/signup modal)
console.log('\n=== 2. POPUP SECTION IN LIVE SITE ===');
const popupStart = html.indexOf('newsletter-popup');
if (popupStart !== -1) {
  console.log(html.slice(popupStart - 100, popupStart + 4000));
} else {
  console.log('newsletter-popup not found by substring');
}

// Check modal / popup dialogs
const modalMatches = html.match(/<div[^>]*class="[^"]*(popup|modal)[^"]*"[\s\S]*?<\/div>/gi) || [];
console.log('Modal/popup matches count:', modalMatches.length);

// 3. Check Announcement slider configuration & classes
console.log('\n=== 3. ANNOUNCEMENT SLIDER IN LIVE SITE ===');
const annStart = html.indexOf('AnnouncementSlider');
if (annStart !== -1) {
  console.log(html.slice(annStart - 100, annStart + 2000));
}

// 4. Check Slideshow configuration & classes
console.log('\n=== 4. SLIDESHOW IN LIVE SITE ===');
const slideStart = html.indexOf('template--21698042888435__slideshow');
if (slideStart !== -1) {
  console.log(html.slice(slideStart, slideStart + 2000));
}
