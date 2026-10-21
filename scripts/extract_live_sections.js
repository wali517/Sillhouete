const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

function extractSection(id) {
  const marker = 'id="shopify-section-' + id + '"';
  const start = html.indexOf(marker);
  if (start === -1) {
    console.log('Section not found:', id);
    return;
  }
  // Find where the next shopify-section begins or 5000 chars
  const next = html.indexOf('id="shopify-section-', start + marker.length);
  const end = next !== -1 ? next : start + 10000;
  const snippet = html.slice(start, Math.min(start + 8000, end));
  console.log(`\n=================== SECTION: ${id} ===================`);
  console.log(snippet.slice(0, 3000));
}

// Check Announcement
extractSection('sections--21698043445491__announcement');

// Check Header
extractSection('sections--21698043445491__header');

// Check Slideshow
extractSection('template--21698042888435__slideshow');

// Check Video custom
extractSection('template--21698042888435__video_image_custom_MNTbgW');

// Check Footer
extractSection('sections--21698043412723__footer');
