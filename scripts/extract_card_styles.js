const fs = require('fs');
const html = fs.readFileSync('live_sillhouete.html', 'utf8');

const matches = html.match(/\.grid-product__title[\s\S]*?}/gi) || [];
console.log('grid-product__title matches:', matches);

const priceMatches = html.match(/\.grid-product__price[\s\S]*?}/gi) || [];
console.log('grid-product__price matches:', priceMatches);
